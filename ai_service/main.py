from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from contextlib import asynccontextmanager

from .vector_store import vector_store
from .agents.symptom_agent import extract_symptoms
from .agents.diagnostic_agent import predict_diagnosis
from .agents.explainability_agent import explain_diagnosis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize vector store on startup
    vector_store.initialize()
    yield
    # Clean up on shutdown

app = FastAPI(title="CDSS AI Service", lifespan=lifespan)

class EncounterRequest(BaseModel):
    symptom_text: str | None = None

@app.post("/diagnose")
async def run_ai_diagnosis(encounter: EncounterRequest):
    try:
        symptom_text = encounter.symptom_text or ""
        
        # 1. Symptom Agent parses raw text
        symptom_analysis = extract_symptoms(symptom_text)
        
        # 2. RAG Retrieval based on the extracted summary
        query = symptom_analysis.get("summary", "")
        retrieved_guidelines = vector_store.search(query, top_k=3)
        
        # 3. Diagnostic Agent predicts based on symptoms + RAG
        disease_prediction = predict_diagnosis(symptom_analysis, retrieved_guidelines)
        
        # 4. Explainability Agent provides verifiable rationale
        explainable_summary = explain_diagnosis(disease_prediction, retrieved_guidelines)
        
        rag_snippets = [{"source": f"Guideline Ref {idx + 1}", "text": text} for idx, text in enumerate(retrieved_guidelines)]
        
        return {
            "symptomAnalysis": symptom_analysis,
            "ragSnippets": rag_snippets,
            "diseasePrediction": {
                "primary": disease_prediction.get("primary", "Pending"),
                "differential": disease_prediction.get("differential", []),
                "suggestedTests": disease_prediction.get("suggestedTests", []),
                "suggestedMedications": disease_prediction.get("suggestedMedications", []),
            },
            "riskStratification": disease_prediction.get("riskStratification", "medium"),
            "confidenceScore": 0.85,
            "protocolReferences": [],
            "explainableSummary": explainable_summary or "Explanation not available.",
            "redFlags": disease_prediction.get("redFlags", [])
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
