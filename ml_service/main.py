from typing import Optional, Dict, Any, List

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="CDSS Liver Health Models API")


def _load_model(path: str):
  try:
    return joblib.load(path)
  except Exception:
    return None


# Trained models (update paths if you move files)
GATE_MODEL = _load_model("models/gate_model.pkl")
FATTY_LIVER_MODEL = _load_model("models/fatty_liver_model.pkl")
HCV_STAGE_MODEL = _load_model("models/hepatitisC_stage_model.pkl")
HCV_COMPLICATIONS_MODEL = _load_model("models/hepatitisC_complications.pkl")
HCV_STATUS_MODEL = _load_model("models/hepatitisC_status_model.pkl")
CANCER_MODEL = _load_model("models/cancer_model.pkl")


# ========= Pydantic input schemas =========

class GateInput(BaseModel):
  Age: float
  Gender: float
  Total_Bilirubin: float
  Direct_Bilirubin: float
  ALP: float
  ALT: float
  AST: float
  Total_Protiens: float
  Albumin: float
  Albumin_and_Globulin_Ratio: float


class FattyLiverInput(BaseModel):
  Albumin: float
  ALP: float
  AST: float
  ALT: float
  Cholesterol: float
  Creatinine: float
  Glucose: float
  GGT: float
  Bilirubin: float
  Triglycerides: float
  Uric_Acid: float
  Platelets: float
  HDL: float


class HcvComplicationsInput(BaseModel):
  Bilirubin: float
  Cholesterol: float
  Albumin: float
  Copper: float
  Alk_Phos: float
  SGOT: float
  Tryglicerides: float
  Platelets: float
  Prothrombin: float
  Age: float
  Sex: float
  Hepatomegaly: float
  Spiders: float
  Edema: float


class HcvStageInput(BaseModel):
  Bilirubin: float
  Cholesterol: float
  Albumin: float
  Copper: float
  Alk_Phos: float
  SGOT: float
  Tryglicerides: float
  Platelets: float
  Prothrombin: float
  Status: float
  Age: float
  Sex: float
  Ascites: float
  Hepatomegaly: float
  Spiders: float
  Edema: float
  APRI: float
  Bilirubin_Albumin: float
  Copper_Platelets: float


class HcvStatusInput(BaseModel):
  Bilirubin: float
  Cholesterol: float
  Albumin: float
  Copper: float
  Alk_Phos: float
  SGOT: float
  Tryglicerides: float
  Platelets: float
  Prothrombin: float
  Age: float
  Sex: float
  Ascites: float
  Hepatomegaly: float
  Spiders: float
  Edema: float
  APRI: float
  ALBI_Score: float
  Bili_Alb_Ratio: float


class CancerInput(BaseModel):
  Age: float
  Gender: float
  BMI: float
  Smoking: float
  GeneticRisk: float
  PhysicalActivity: float
  AlcoholIntake: float
  CancerHistory: float


class AllModelsInput(BaseModel):
  gate: Optional[GateInput] = None
  fatty_liver: Optional[FattyLiverInput] = None
  hcv_complications: Optional[HcvComplicationsInput] = None
  hcv_stage: Optional[HcvStageInput] = None
  hcv_status: Optional[HcvStatusInput] = None
  cancer: Optional[CancerInput] = None


# ========= Helpers =========

def _build_df(payload: BaseModel, feature_order: Optional[List[str]] = None) -> pd.DataFrame:
  data = payload.dict()
  if feature_order:
    return pd.DataFrame([[data[f] for f in feature_order]], columns=feature_order)
  return pd.DataFrame([data])


def _predict_generic(model, payload: Optional[BaseModel], feature_order: Optional[List[str]] = None) -> Dict[str, Any]:
  if model is None:
    return {"available": False, "reason": "Model not loaded"}
  if payload is None:
    return {"available": False, "reason": "Input not provided"}

  try:
    df = _build_df(payload, feature_order)
    pred = model.predict(df)[0]

    if hasattr(pred, "item"):
        pred = pred.item()

    proba_val = None
    try:
        proba = model.predict_proba(df)[0]
        proba_val = float(max(proba))
    except Exception:
        proba_val = None

    return {
        "available": True,
        "prediction": pred,
        "probability": proba_val
    }
  except Exception as e:
    return {"available": False, "reason": f"Prediction failed: {e}"}


# ========= Orchestrator =========

@app.post("/predict/all")
def predict_all(body: AllModelsInput):
  # 1) Gate model
  gate_order = [
    "Age",
    "Gender",
    "Total_Bilirubin",
    "Direct_Bilirubin",
    "ALP",
    "ALT",
    "AST",
    "Total_Protiens",
    "Albumin",
    "Albumin_and_Globulin_Ratio",
  ]
  gate_result = _predict_generic(GATE_MODEL, body.gate, gate_order)

  gate_pred = gate_result.get("prediction")
  gate_label = None
  if isinstance(gate_pred, (int, float)):
    # Assumption: 0 = Healthy, 1 = Patient (as label-encoded during training)
    gate_label = "patient" if gate_pred >= 0.5 else "healthy"
  gate_result["label"] = gate_label

  # Decide whether to run downstream models
  run_downstream = True
  if gate_result.get("available") and gate_label == "healthy":
    run_downstream = False

  # 2) Downstream models
  if run_downstream:
    fatty_liver = _predict_generic(
      FATTY_LIVER_MODEL,
      body.fatty_liver,
      feature_order=[
        "Albumin",
        "ALP",
        "AST",
        "ALT",
        "Cholesterol",
        "Creatinine",
        "Glucose",
        "GGT",
        "Bilirubin",
        "Triglycerides",
        "Uric_Acid",
        "Platelets",
        "HDL",
      ],
    )
    hcv_complications = _predict_generic(
      HCV_COMPLICATIONS_MODEL,
      body.hcv_complications,
      feature_order=[
        "Bilirubin",
        "Cholesterol",
        "Albumin",
        "Copper",
        "Alk_Phos",
        "SGOT",
        "Tryglicerides",
        "Platelets",
        "Prothrombin",
        "Age",
        "Sex",
        "Hepatomegaly",
        "Spiders",
        "Edema",
      ],
    )
    hcv_stage = _predict_generic(
      HCV_STAGE_MODEL,
      body.hcv_stage,
      feature_order=[
        "Bilirubin",
        "Cholesterol",
        "Albumin",
        "Copper",
        "Alk_Phos",
        "SGOT",
        "Tryglicerides",
        "Platelets",
        "Prothrombin",
        "Status",
        "Age",
        "Sex",
        "Ascites",
        "Hepatomegaly",
        "Spiders",
        "Edema",
        "APRI",
        "Bilirubin_Albumin",
        "Copper_Platelets",
      ],
    )
    hcv_status = _predict_generic(
      HCV_STATUS_MODEL,
      body.hcv_status,
      feature_order=[
        "Bilirubin",
        "Cholesterol",
        "Albumin",
        "Copper",
        "Alk_Phos",
        "SGOT",
        "Tryglicerides",
        "Platelets",
        "Prothrombin",
        "Age",
        "Sex",
        "Ascites",
        "Hepatomegaly",
        "Spiders",
        "Edema",
        "APRI",
        "ALBI_Score",
        "Bili_Alb_Ratio",
      ],
    )
    cancer = _predict_generic(
      CANCER_MODEL,
      body.cancer,
      feature_order=[
        "Age",
        "Gender",
        "BMI",
        "Smoking",
        "GeneticRisk",
        "PhysicalActivity",
        "AlcoholIntake",
        "CancerHistory",
      ],
    )
  else:
    skip_reason = "Skipped because Gate Model classified user as healthy (screen negative)."
    fatty_liver = {"available": False, "reason": skip_reason}
    hcv_complications = {"available": False, "reason": skip_reason}
    hcv_stage = {"available": False, "reason": skip_reason}
    hcv_status = {"available": False, "reason": skip_reason}
    cancer = {"available": False, "reason": skip_reason}

  return {
    "gate": gate_result,
    "fatty_liver": fatty_liver,
    "hcv_complications": hcv_complications,
    "hcv_stage": hcv_stage,
    "hcv_status": hcv_status,
    "cancer": cancer,
  }
