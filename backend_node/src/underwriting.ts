import { ApplicationCreateInput } from './types';
import { RuleRow } from './types';

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function r2(x: number): number {
  return Math.round(x * 100) / 100;
}

export interface ScoringResult {
  debt_to_income: number;
  score_credit: number;
  score_income: number;
  score_dti: number;
  score_employment: number;
  weighted_score: number;
  auto_decision: string;
}

export function calculateUnderwriting(
  payload: ApplicationCreateInput,
  rule: RuleRow,
): ScoringResult {
  const debt_to_income = (payload.monthly_debt * 12 / payload.annual_income) * 100;
  const score_credit = clamp(((payload.credit_score - 300) / 550) * 100);
  const score_income = clamp((payload.annual_income / payload.loan_amount) * 40);
  const score_dti = clamp(100 - (debt_to_income * 1.5));
  const score_employment = clamp((payload.employment_years / 10) * 100);

  const total_weight =
    rule.weight_credit +
    rule.weight_income +
    rule.weight_dti +
    rule.weight_employment;

  const weighted_score =
    (score_credit * rule.weight_credit +
      score_income * rule.weight_income +
      score_dti * rule.weight_dti +
      score_employment * rule.weight_employment) /
    total_weight;

  let auto_decision: string;
  if (payload.credit_score < rule.min_credit_score || debt_to_income > rule.max_dti) {
    auto_decision = 'rejected';
  } else if (weighted_score >= rule.approval_score) {
    auto_decision = 'approved';
  } else if (weighted_score >= rule.review_score) {
    auto_decision = 'review';
  } else {
    auto_decision = 'rejected';
  }

  return {
    debt_to_income: r2(debt_to_income),
    score_credit: r2(score_credit),
    score_income: r2(score_income),
    score_dti: r2(score_dti),
    score_employment: r2(score_employment),
    weighted_score: r2(weighted_score),
    auto_decision,
  };
}

export function decisionToStatus(decision: string): string {
  if (decision === 'approved') return 'auto_approved';
  if (decision === 'rejected') return 'auto_rejected';
  return 'pending_review';
}
