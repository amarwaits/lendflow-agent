import { ApplicationCreateInput } from './types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8002';
const AI_TIMEOUT_MS = 4000;

export interface AiScoringResult {
  ai_score: number;       // 0–100 probability of approval
  ai_decision: string;    // 'approved' | 'review' | 'rejected'
  ai_shap_values: string; // JSON-encoded { feature: shap_value }
}

/**
 * Calls the Python ML microservice for AI-based underwriting.
 * Returns null on any error (timeout, service down, bad response) so the
 * caller can fall back to the rule engine transparently.
 */
export async function callAiUnderwriting(
  payload: ApplicationCreateInput,
): Promise<AiScoringResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credit_score: payload.credit_score,
        annual_income: payload.annual_income,
        loan_amount: payload.loan_amount,
        monthly_debt: payload.monthly_debt,
        employment_years: payload.employment_years,
        loan_type: payload.loan_type,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const data = await response.json() as {
      ai_score: number;
      ai_decision: string;
      shap_values: Record<string, number>;
    };

    return {
      ai_score: data.ai_score,
      ai_decision: data.ai_decision,
      ai_shap_values: JSON.stringify(data.shap_values),
    };
  } catch {
    return null; // service unavailable → caller uses rule engine
  }
}
