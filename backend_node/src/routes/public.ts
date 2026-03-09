import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, addAuditEntry } from '../db';
import { validate } from '../middleware/validate';
import { ApplicationCreateSchema, ApplicationRow } from '../types';
import { calculateUnderwriting, decisionToStatus } from '../underwriting';
import { callAiUnderwriting } from '../aiUnderwriting';
import { utcNowIso } from '../utils';
import { RuleRow } from '../types';

export const publicRouter = Router();

function rowToApplicationResponse(row: ApplicationRow) {
  return {
    id: row.id,
    loan_type: row.loan_type,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    annual_income: row.annual_income,
    loan_amount: row.loan_amount,
    credit_score: row.credit_score,
    monthly_debt: row.monthly_debt,
    employment_years: row.employment_years,
    debt_to_income: row.debt_to_income,
    weighted_score: row.weighted_score,
    score_breakdown: {
      credit: row.score_credit,
      income: row.score_income,
      debt_to_income: row.score_dti,
      employment: row.score_employment,
    },
    auto_decision: row.auto_decision,
    final_decision: row.final_decision,
    status: row.status,
    override_reason: row.override_reason,
    admin_notes: row.admin_notes,
    underwriting_method: row.underwriting_method ?? 'rules',
    ai_analysis: row.ai_score != null
      ? {
          score: row.ai_score,
          decision: row.ai_decision,
          shap_values: row.ai_shap_values ? JSON.parse(row.ai_shap_values) : null,
        }
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

publicRouter.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'LendFlow underwriting API is running' });
});

publicRouter.get('/loan-types', (_req: Request, res: Response) => {
  res.json([
    { id: 'home', title: 'Home Loan', description: 'For mortgage and refinancing needs.' },
    { id: 'car', title: 'Car Loan', description: 'For new and pre-owned vehicle financing.' },
    { id: 'personal', title: 'Personal Loan', description: 'For personal expenses and life goals.' },
  ]);
});

publicRouter.post('/applications', validate(ApplicationCreateSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const payload = req.body;

  const rule = db.prepare('SELECT * FROM underwriting_rules WHERE loan_type = ?').get(payload.loan_type) as RuleRow | undefined;
  if (!rule) {
    res.status(404).json({ detail: 'Underwriting rule not found' });
    return;
  }

  // Always run the rule engine (audit, fallback, hard knock-outs)
  const scoring = calculateUnderwriting(payload, rule);

  // Attempt AI scoring when enabled for this loan type
  let aiScore: number | null = null;
  let aiDecision: string | null = null;
  let aiShapValues: string | null = null;
  let underwritingMethod = 'rules';

  if (rule.use_ai_model) {
    const aiResult = await callAiUnderwriting(payload);
    if (aiResult) {
      aiScore = aiResult.ai_score;
      aiDecision = aiResult.ai_decision;
      aiShapValues = aiResult.ai_shap_values;
      underwritingMethod = 'ai';
    } else {
      underwritingMethod = 'ai_fallback'; // AI unavailable, fell back to rules
    }
  }

  // Hard knock-outs always override (regulatory floor)
  const hardReject =
    payload.credit_score < rule.min_credit_score ||
    scoring.debt_to_income > rule.max_dti;

  const effectiveDecision = hardReject
    ? 'rejected'
    : aiDecision ?? scoring.auto_decision;

  const applicationId = uuidv4();
  const now = utcNowIso();
  const status = decisionToStatus(effectiveDecision);

  db.prepare(`
    INSERT INTO applications (
      id, loan_type, full_name, email, phone,
      annual_income, loan_amount, credit_score, monthly_debt, employment_years,
      debt_to_income, score_credit, score_income, score_dti, score_employment,
      weighted_score, auto_decision, final_decision, status,
      override_reason, admin_notes,
      ai_score, ai_decision, ai_shap_values, underwriting_method,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    applicationId, payload.loan_type, payload.full_name, payload.email, payload.phone,
    payload.annual_income, payload.loan_amount, payload.credit_score, payload.monthly_debt, payload.employment_years,
    scoring.debt_to_income, scoring.score_credit, scoring.score_income, scoring.score_dti, scoring.score_employment,
    scoring.weighted_score, effectiveDecision, effectiveDecision, status,
    null, null,
    aiScore, aiDecision, aiShapValues, underwritingMethod,
    now, now,
  );

  addAuditEntry(
    applicationId,
    'application_submitted',
    'customer',
    `Application submitted for ${payload.loan_type} loan. Method: ${underwritingMethod}. Decision: ${effectiveDecision}.`,
  );

  const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as ApplicationRow;
  res.status(201).json(rowToApplicationResponse(created));
});

publicRouter.get('/applications/:applicationId', (req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.applicationId) as ApplicationRow | undefined;
  if (!row) {
    res.status(404).json({ detail: 'Application not found' });
    return;
  }
  res.json(rowToApplicationResponse(row));
});

export { rowToApplicationResponse };
