"""
LendFlow AI Underwriting Service
FastAPI microservice exposing LightGBM + SHAP for loan application scoring.
Falls back gracefully — the Node.js backend treats any failure as a signal
to use the rule engine instead.
"""

import logging
import numpy as np
import pandas as pd
import lightgbm as lgb
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "credit_score",
    "annual_income",
    "loan_amount",
    "monthly_debt",
    "employment_years",
    "loan_type_encoded",
    "dti",
    "loan_to_income",
]

LOAN_TYPE_MAP = {"home": 0, "car": 1, "personal": 2}

# Approval thresholds — mimic rule engine ground-truth with realistic noise
APPROVAL_PROB_THRESHOLD = 0.65
REVIEW_PROB_THRESHOLD = 0.40

model: lgb.LGBMClassifier | None = None
explainer: shap.TreeExplainer | None = None


# ---------------------------------------------------------------------------
# Synthetic data generation
# ---------------------------------------------------------------------------

def _rule_based_label(
    credit: np.ndarray,
    dti: np.ndarray,
    lti: np.ndarray,
    emp: np.ndarray,
    income: np.ndarray,
) -> np.ndarray:
    """Deterministic rule signal used as training label base."""
    score = np.zeros(len(credit))
    score += np.clip((credit - 300) / 550, 0, 1) * 40
    score += np.clip(1 - dti / 60, 0, 1) * 25
    score += np.clip(1 - lti / 8, 0, 1) * 20
    score += np.clip(emp / 10, 0, 1) * 10
    score += np.clip(income / 200_000, 0, 1) * 5
    return (score >= 50).astype(int)


def generate_synthetic_data(n: int = 8000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.RandomState(seed)

    loan_type_enc = rng.choice([0, 1, 2], n, p=[0.45, 0.35, 0.20])
    credit_score = rng.randint(300, 901, n)
    annual_income = np.clip(rng.lognormal(10.8, 0.55, n), 18_000, 600_000)
    loan_amount = np.clip(rng.lognormal(11.0, 0.85, n), 3_000, 900_000)
    monthly_debt = np.clip(rng.lognormal(6.4, 0.75, n), 0, 10_000)
    employment_years = np.clip(rng.exponential(7, n), 0, 40)

    dti = np.where(
        annual_income > 0,
        np.clip(monthly_debt * 12 / annual_income * 100, 0, 200),
        0,
    )
    loan_to_income = np.where(annual_income > 0, np.clip(loan_amount / annual_income, 0, 30), 0)

    base_labels = _rule_based_label(credit_score, dti, loan_to_income, employment_years, annual_income)

    # Add 12 % random noise to simulate human-reviewer variability
    noise_mask = rng.uniform(0, 1, n) < 0.12
    noisy_labels = base_labels.copy()
    noisy_labels[noise_mask] = 1 - noisy_labels[noise_mask]

    return pd.DataFrame(
        {
            "credit_score": credit_score,
            "annual_income": annual_income,
            "loan_amount": loan_amount,
            "monthly_debt": monthly_debt,
            "employment_years": employment_years,
            "loan_type_encoded": loan_type_enc,
            "dti": dti,
            "loan_to_income": loan_to_income,
            "approved": noisy_labels,
        }
    )


# ---------------------------------------------------------------------------
# Model training
# ---------------------------------------------------------------------------

def train_model() -> None:
    global model, explainer

    logger.info("Generating synthetic training data (n=8000)…")
    df = generate_synthetic_data(8000)
    X = df[FEATURE_NAMES]
    y = df["approved"]

    logger.info("Training LightGBM classifier…")
    model = lgb.LGBMClassifier(
        objective="binary",
        metric="binary_logloss",
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        num_leaves=31,
        feature_fraction=0.8,
        bagging_fraction=0.8,
        bagging_freq=5,
        min_child_samples=20,
        verbosity=-1,
        random_state=42,
    )
    model.fit(X, y)

    logger.info("Building SHAP TreeExplainer…")
    explainer = shap.TreeExplainer(model)
    logger.info("AI model ready.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    train_model()
    yield


app = FastAPI(title="LendFlow AI Underwriting", version="1.0.0", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    credit_score: float
    annual_income: float
    loan_amount: float
    monthly_debt: float
    employment_years: float
    loan_type: str  # 'home' | 'car' | 'personal'


class PredictResponse(BaseModel):
    ai_score: float          # 0–100 approval probability
    ai_decision: str         # 'approved' | 'review' | 'rejected'
    shap_values: dict        # feature_name → float contribution


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None or explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    loan_type_enc = LOAN_TYPE_MAP.get(req.loan_type, 0)
    dti = (req.monthly_debt * 12 / req.annual_income * 100) if req.annual_income > 0 else 0
    loan_to_income = (req.loan_amount / req.annual_income) if req.annual_income > 0 else 0

    features = pd.DataFrame(
        [
            {
                "credit_score": req.credit_score,
                "annual_income": req.annual_income,
                "loan_amount": req.loan_amount,
                "monthly_debt": req.monthly_debt,
                "employment_years": req.employment_years,
                "loan_type_encoded": loan_type_enc,
                "dti": dti,
                "loan_to_income": loan_to_income,
            }
        ]
    )

    prob = float(model.predict_proba(features)[0][1])
    ai_score = round(prob * 100, 2)

    if prob >= APPROVAL_PROB_THRESHOLD:
        ai_decision = "approved"
    elif prob >= REVIEW_PROB_THRESHOLD:
        ai_decision = "review"
    else:
        ai_decision = "rejected"

    # SHAP values (class-1 = approved)
    raw_shap = explainer.shap_values(features)
    if isinstance(raw_shap, list):
        raw_shap = raw_shap[1]
    shap_dict = {name: round(float(val), 4) for name, val in zip(FEATURE_NAMES, raw_shap[0])}

    return PredictResponse(ai_score=ai_score, ai_decision=ai_decision, shap_values=shap_dict)
