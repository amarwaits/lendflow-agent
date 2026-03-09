import { z } from 'zod';

export const LoanTypeEnum = z.enum(['home', 'car', 'personal']);
export type LoanType = z.infer<typeof LoanTypeEnum>;

export const DecisionTypeEnum = z.enum(['approved', 'rejected', 'review']);
export type DecisionType = z.infer<typeof DecisionTypeEnum>;

export const AdminLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const ApplicationCreateSchema = z.object({
  loan_type: LoanTypeEnum,
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(9).max(10),
  annual_income: z.number().gt(0),
  loan_amount: z.number().gt(0),
  credit_score: z.number().int().gte(300).lte(900),
  monthly_debt: z.number().gte(0),
  employment_years: z.number().gte(0).lte(60),
});
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;

export const StatusUpdateSchema = z.object({
  status: z.enum([
    'pending_review',
    'in_review',
    'approved',
    'rejected',
    'on_hold',
    'auto_approved',
    'auto_rejected',
    'overridden',
  ]),
});
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;

export const OverrideSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().min(5).max(500),
});
export type OverrideInput = z.infer<typeof OverrideSchema>;

export const NoteSchema = z.object({
  note: z.string().min(2).max(800),
});
export type NoteInput = z.infer<typeof NoteSchema>;

export const UnderwritingRuleUpdateSchema = z.object({
  min_credit_score: z.number().int().gte(300).lte(900),
  max_dti: z.number().gte(0).lte(100),
  approval_score: z.number().gte(0).lte(100),
  review_score: z.number().gte(0).lte(100),
  weight_credit: z.number().gt(0),
  weight_income: z.number().gt(0),
  weight_dti: z.number().gt(0),
  weight_employment: z.number().gt(0),
});
export type UnderwritingRuleUpdateInput = z.infer<typeof UnderwritingRuleUpdateSchema>;

// DB row interfaces
export interface ApplicationRow {
  id: string;
  loan_type: string;
  full_name: string;
  email: string;
  phone: string;
  annual_income: number;
  loan_amount: number;
  credit_score: number;
  monthly_debt: number;
  employment_years: number;
  debt_to_income: number;
  score_credit: number;
  score_income: number;
  score_dti: number;
  score_employment: number;
  weighted_score: number;
  auto_decision: string;
  final_decision: string;
  status: string;
  override_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleRow {
  loan_type: string;
  min_credit_score: number;
  max_dti: number;
  approval_score: number;
  review_score: number;
  weight_credit: number;
  weight_income: number;
  weight_dti: number;
  weight_employment: number;
  updated_at: string;
}

export interface AuditRow {
  id: number;
  action: string;
  actor: string;
  details: string;
  created_at: string;
}
