from google.genai import types
from ..gemini_client import client
import json

def extract_symptoms(clinical_text: str) -> dict:
    if not clinical_text:
        return {
            "summary": "No symptoms recorded.",
            "structuredSymptoms": []
        }

    prompt = f"""
Analyze the following clinical text and extract a structured list of symptoms.
Returns a JSON object with two fields:
1. "summary": A concise 1-sentence summary of the patient's presentation.
2. "structuredSymptoms": An array of objects, each containing:
   - "symptom": The name of the symptom (e.g., "chest pain")
   - "severity": Use standard terms like "mild", "moderate", "severe", or "unknown"
   - "duration": The duration if mentioned (e.g., "2 days"), or "unknown"

Clinical Text:
"{clinical_text}"

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
        print(f"Symptom Agent failed: {e}")
        return {
            "summary": clinical_text,
            "structuredSymptoms": [{"symptom": clinical_text, "severity": "unknown", "duration": "unknown"}]
        }
