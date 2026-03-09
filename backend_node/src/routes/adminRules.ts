import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { requireAdmin } from '../auth';
import { validate } from '../middleware/validate';
import { UnderwritingRuleUpdateSchema, LoanTypeEnum, RuleRow } from '../types';
import { utcNowIso } from '../utils';

export const adminRulesRouter = Router();
adminRulesRouter.use(requireAdmin);

adminRulesRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM underwriting_rules ORDER BY loan_type ASC').all();
  res.json(rows);
});

adminRulesRouter.put('/:loanType', validate(UnderwritingRuleUpdateSchema), (req: Request, res: Response) => {
  const loanTypeParsed = LoanTypeEnum.safeParse(req.params.loanType);
  if (!loanTypeParsed.success) {
    res.status(404).json({ detail: 'Rule not found' });
    return;
  }
  const loanType = loanTypeParsed.data;
  const payload = req.body;

  if (payload.approval_score <= payload.review_score) {
    res.status(400).json({ detail: 'Approval score must be greater than review score' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM underwriting_rules WHERE loan_type = ?').get(loanType) as RuleRow | undefined;
  if (!existing) {
    res.status(404).json({ detail: 'Rule not found' });
    return;
  }

  const now = utcNowIso();
  db.prepare(`
    UPDATE underwriting_rules
    SET min_credit_score = ?, max_dti = ?, approval_score = ?, review_score = ?,
        weight_credit = ?, weight_income = ?, weight_dti = ?, weight_employment = ?,
        use_ai_model = ?,
        updated_at = ?
    WHERE loan_type = ?
  `).run(
    payload.min_credit_score, payload.max_dti, payload.approval_score, payload.review_score,
    payload.weight_credit, payload.weight_income, payload.weight_dti, payload.weight_employment,
    payload.use_ai_model ? 1 : 0,
    now, loanType,
  );

  const updated = db.prepare('SELECT * FROM underwriting_rules WHERE loan_type = ?').get(loanType) as RuleRow;
  res.json(updated);
});
