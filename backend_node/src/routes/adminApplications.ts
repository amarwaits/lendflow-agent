import { Router, Request, Response } from 'express';
import { getDb, addAuditEntry } from '../db';
import { requireAdmin, AuthenticatedRequest } from '../auth';
import { validate } from '../middleware/validate';
import { StatusUpdateSchema, OverrideSchema, NoteSchema, ApplicationRow, AuditRow, RuleRow } from '../types';
import { calculateUnderwriting, decisionToStatus } from '../underwriting';
import { utcNowIso } from '../utils';
import { rowToApplicationResponse } from './public';

export const adminApplicationsRouter = Router();
adminApplicationsRouter.use(requireAdmin);

adminApplicationsRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { status, loan_type } = req.query;

  let query = `
    SELECT id, loan_type, full_name, weighted_score, auto_decision, final_decision, status, created_at
    FROM applications
  `;
  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status as string);
  }
  if (loan_type) {
    conditions.push('loan_type = ?');
    params.push(loan_type as string);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY datetime(created_at) DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

adminApplicationsRouter.get('/:applicationId', (req: Request, res: Response) => {
  const db = getDb();
  const { applicationId } = req.params;

  const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow | undefined;
  if (!appRow) {
    res.status(404).json({ detail: 'Application not found' });
    return;
  }

  const auditRows = db.prepare(`
    SELECT id, action, actor, details, created_at
    FROM application_audit
    WHERE application_id = ?
    ORDER BY id DESC
  `).all(applicationId) as AuditRow[];

  res.json({
    application: rowToApplicationResponse(appRow),
    audit: auditRows,
  });
});

adminApplicationsRouter.put('/:applicationId/status', validate(StatusUpdateSchema), (req: Request, res: Response) => {
  const db = getDb();
  const { applicationId } = req.params;
  const admin = (req as AuthenticatedRequest).adminUser;
  const { status } = req.body;

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow | undefined;
  if (!row) {
    res.status(404).json({ detail: 'Application not found' });
    return;
  }

  let final_decision = row.final_decision;
  if (status === 'approved') final_decision = 'approved';
  if (status === 'rejected') final_decision = 'rejected';

  const now = utcNowIso();
  db.prepare(`
    UPDATE applications SET status = ?, final_decision = ?, updated_at = ? WHERE id = ?
  `).run(status, final_decision, now, applicationId);

  addAuditEntry(applicationId, 'status_updated', admin, `Status changed to ${status}.`);

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow;
  res.json(rowToApplicationResponse(updated));
});

adminApplicationsRouter.post('/:applicationId/override', validate(OverrideSchema), (req: Request, res: Response) => {
  const db = getDb();
  const { applicationId } = req.params;
  const admin = (req as AuthenticatedRequest).adminUser;
  const { decision, reason } = req.body;

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow | undefined;
  if (!row) {
    res.status(404).json({ detail: 'Application not found' });
    return;
  }

  const now = utcNowIso();
  db.prepare(`
    UPDATE applications SET final_decision = ?, status = ?, override_reason = ?, updated_at = ? WHERE id = ?
  `).run(decision, 'overridden', reason, now, applicationId);

  addAuditEntry(
    applicationId,
    'manual_override',
    admin,
    `Manual override set final decision to ${decision}. Reason: ${reason}`,
  );

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow;
  res.json(rowToApplicationResponse(updated));
});

adminApplicationsRouter.post('/:applicationId/notes', validate(NoteSchema), (req: Request, res: Response) => {
  const db = getDb();
  const { applicationId } = req.params;
  const admin = (req as AuthenticatedRequest).adminUser;
  const { note } = req.body;

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow | undefined;
  if (!row) {
    res.status(404).json({ detail: 'Application not found' });
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const prefix = `[${timestamp}] ${admin}: `;
  const newNotes = [row.admin_notes, `${prefix}${note}`].filter(Boolean).join('\n');

  const now = utcNowIso();
  db.prepare(`
    UPDATE applications SET admin_notes = ?, status = ?, updated_at = ? WHERE id = ?
  `).run(newNotes, 'in_review', now, applicationId);

  addAuditEntry(applicationId, 'note_added', admin, note);

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow;
  res.json(rowToApplicationResponse(updated));
});

adminApplicationsRouter.post('/:applicationId/reevaluate', (req: Request, res: Response) => {
  const db = getDb();
  const { applicationId } = req.params;
  const admin = (req as AuthenticatedRequest).adminUser;

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow | undefined;
  if (!row) {
    res.status(404).json({ detail: 'Application not found' });
    return;
  }

  const rule = db.prepare('SELECT * FROM underwriting_rules WHERE loan_type = ?').get(row.loan_type) as RuleRow | undefined;
  if (!rule) {
    res.status(404).json({ detail: 'Underwriting rule not found' });
    return;
  }

  const scoring = calculateUnderwriting(
    {
      loan_type: row.loan_type as 'home' | 'car' | 'personal',
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      annual_income: row.annual_income,
      loan_amount: row.loan_amount,
      credit_score: row.credit_score,
      monthly_debt: row.monthly_debt,
      employment_years: row.employment_years,
    },
    rule,
  );

  let final_decision: string;
  let status: string;
  if (row.status === 'overridden') {
    final_decision = row.final_decision;
    status = 'overridden';
  } else {
    final_decision = scoring.auto_decision;
    status = decisionToStatus(scoring.auto_decision);
  }

  const now = utcNowIso();
  db.prepare(`
    UPDATE applications
    SET debt_to_income = ?, score_credit = ?, score_income = ?, score_dti = ?, score_employment = ?,
        weighted_score = ?, auto_decision = ?, final_decision = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    scoring.debt_to_income, scoring.score_credit, scoring.score_income, scoring.score_dti, scoring.score_employment,
    scoring.weighted_score, scoring.auto_decision, final_decision, status, now,
    applicationId,
  );

  addAuditEntry(
    applicationId,
    're_evaluated',
    admin,
    'Application re-evaluated with latest underwriting rule weights.',
  );

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow;
  res.json(rowToApplicationResponse(updated));
});
