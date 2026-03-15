from google.genai import types
from ..gemini_client import client
import json

def predict_diagnosis(structured_symptoms: dict, retrieved_guidelines: list) -> dict:
    prompt = f"""
Based on the patient's extracted symptoms and the provided medical guidelines, formulate a preliminary diagnosis.
Provide a differential diagnosis, suggested tests, suggested medications, and risk stratification.

Symptoms:
{json.dumps(structured_symptoms.get("structuredSymptoms", []), indent=2)}

Relevant Clinical Guidelines:
{chr(10).join(f"- {g}" for g in retrieved_guidelines)}

Return a JSON object with the following fields:
- "primary": String (Most likely primary diagnosis)
- "differential": Array of Strings (Top 2-3 differential diagnoses)
- "suggestedTests": Array of Strings (Recommended labs or imaging)
- "suggestedMedications": Array of Strings (Recommended empirical or symptomatic treatments)
- "riskStratification": String (Must be "low", "medium", or "high")
- "redFlags": Array of Strings (Any critical warnings based on the symptoms. Leave empty if none.)

Return ONLY valid JSON.
"""
    try:
        if not client:
             raise Exception("Gemini client not initialized")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json'
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Diagnostic Agent failed: {e}")
        return {
            "primary": "Unable to determine diagnosis",
            "differential": [],
            "suggestedTests": [],
            "suggestedMedications": [],
            "riskStratification": "medium",
            "redFlags": []
        }
