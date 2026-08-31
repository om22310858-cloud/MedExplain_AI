# ============================================================
# DIABETES MODEL — INFERENCE MODULE
# ============================================================

from pathlib import Path
import json
import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "diabetes_model.joblib"
THRESHOLD_PATH = BASE_DIR / "models" / "diabetes_threshold.json"


# ============================================================
# LOAD MODEL
# ============================================================

model = joblib.load(MODEL_PATH)


# ============================================================
# LOAD DECISION THRESHOLD
# ============================================================

with open(THRESHOLD_PATH, "r") as f:
    threshold_data = json.load(f)

SELECTED_THRESHOLD = threshold_data["selected_threshold"]


# ============================================================
# MODEL FEATURES
# ============================================================

FEATURE_NAMES = [
    "HighBP",
    "HighChol",
    "CholCheck",
    "BMI",
    "Smoker",
    "Stroke",
    "HeartDiseaseorAttack",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "GenHlth",
    "MentHlth",
    "PhysHlth",
    "DiffWalk",
    "Sex",
    "Age",
    "Education",
    "Income",
]


# ============================================================
# PREDICT DIABETES RISK
# ============================================================

def predict_diabetes_risk(patient_data):
    """
    Predict diabetes risk for one patient.

    patient_data must contain the model features
    listed in FEATURE_NAMES.
    """

    # Check for missing features
    missing_features = [
        feature
        for feature in FEATURE_NAMES
        if feature not in patient_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    # Create dataframe in exact feature order
    patient_df = pd.DataFrame(
        [[patient_data[feature] for feature in FEATURE_NAMES]],
        columns=FEATURE_NAMES
    )

    # Probability
    probability = model.predict_proba(
        patient_df
    )[0, 1]

    # Apply selected threshold
    prediction = int(
        probability >= SELECTED_THRESHOLD
    )

    return {
        "prediction": prediction,
        "risk_probability": float(probability),
        "threshold": float(SELECTED_THRESHOLD),
    }