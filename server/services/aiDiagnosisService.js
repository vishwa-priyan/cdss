import { env } from "../config/env.js";

export async function runAIDiagnosis(encounter, mlInputs = {}) {
  const symptomText = encounter.symptom_text || "";

  let mlModels = null;

  try {
    const url = `${env.ml.baseUrl}/predict/all`;

    console.log("Calling ML service:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlInputs),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("ML API error:", text);
      mlModels = { error: `ML service error: ${res.status}` };
    } else {
      mlModels = JSON.parse(text);
    }
  } catch (err) {
    console.error("ML service unreachable:", err);

    mlModels = { error: "ML service unavailable" };
  }

  return {
    symptomAnalysis: {
      summary: symptomText || "No symptoms recorded.",
      structuredSymptoms: symptomText
        ? symptomText
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => ({ symptom: s, severity: "moderate" }))
        : [],
    },
    ragSnippets: [
      {
        source: "Guideline Ref 1",
        text: "Consider differential diagnosis based on presenting symptoms, vitals, and liver-related risk factors.",
      },
      {
        source: "Protocol A",
        text: "For abnormal liver scores, ensure appropriate follow-up imaging and labs.",
      },
    ],
    diseasePrediction: {
      primary: "See liver model outputs below",
      differential: [
        "Gate model (patient/healthy)",
        "Liver cancer risk",
        "Fatty liver risk",
        "Hepatitis C status/stage",
      ],
      suggestedTests: [
        "Liver function tests",
        "Viral hepatitis panel",
        "Ultrasound / elastography",
      ],
      suggestedMedications: [
        "As per hepatology guidelines and clinical judgment",
      ],
    },
    riskStratification: "medium",
    confidenceScore:
      mlModels && !mlModels.error && mlModels.gate?.probability != null
        ? mlModels.gate.probability
        : 0.7,
    protocolReferences: ["CDSS-HEP-001", "CDSS-HEP-002"],
    explainableSummary:
      "Combined analysis of reported symptoms with structured liver-related model predictions. " +
      "Use model outputs as decision support only and always correlate with full clinical context.",
    redFlags:
      symptomText.toLowerCase().includes("jaundice") ||
      symptomText.toLowerCase().includes("bleeding")
        ? [
            "Signs suggest possible advanced liver disease – consider urgent evaluation.",
          ]
        : [],
    mlModels,
  };
}
