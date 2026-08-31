# ============================================================
# TEST DIABETES INFERENCE MODULE
# ============================================================

from predict import predict_diabetes_risk


# Example patient
patient = {
    "HighBP": 1,
    "HighChol": 1,
    "CholCheck": 1,
    "BMI": 30,
    "Smoker": 0,
    "Stroke": 0,
    "HeartDiseaseorAttack": 0,
    "PhysActivity": 1,
    "Fruits": 1,
    "Veggies": 1,
    "HvyAlcoholConsump": 0,
    "AnyHealthcare": 1,
    "NoDocbcCost": 0,
    "GenHlth": 3,
    "MentHlth": 2,
    "PhysHlth": 2,
    "DiffWalk": 0,
    "Sex": 1,
    "Age": 8,
    "Education": 4,
    "Income": 5,
}


result = predict_diabetes_risk(patient)


print("=" * 70)
print("DIABETES MODEL TEST")
print("=" * 70)

print("\nPrediction:")
print(
    "Higher estimated risk"
    if result["prediction"] == 1
    else "Lower estimated risk"
)

print(
    f"\nRisk probability: "
    f"{result['risk_probability']:.2%}"
)

print(
    f"Decision threshold: "
    f"{result['threshold']:.4f}"
)