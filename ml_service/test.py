import joblib

model = joblib.load("models/hepatitisC_stage_model.pkl")

print(type(model))

# Check feature names
try:
    print("Feature names used by the model:")
    print(model.get_booster().feature_names)
except:
    print("Feature names:", model.feature_names_in_)