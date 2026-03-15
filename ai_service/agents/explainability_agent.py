from ..gemini_client import client
import json

def explain_diagnosis(diagnosis_result: dict, retrieved_guidelines: list) -> str:
    prompt = f"""
You are an expert Clinical Decision Support Explainability AI. 
Your task is to write a short, clear paragraph explaining to a doctor WHY the primary diagnosis was chosen, explicitly citing the provided guidelines.

Diagnosis Result:
{json.dumps(diagnosis_result, indent=2)}

Clinical Guidelines Used:
{chr(10).join(f"- {g}" for g in retrieved_guidelines)}

Provide ONLY the text explanation. Keep it professional, objective, and under 4 sentences. Explain the rationale linking the patient's symptoms (implied by the diagnosis context) to the specific guideline recommendations.
"""
    try:
        if not client:
            raise Exception("Gemini client not initialized")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Explainability Agent failed: {e}")
        return "Explanation unavailable at this time due to an error."
