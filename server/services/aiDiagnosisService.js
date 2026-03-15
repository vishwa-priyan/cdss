export async function runAIDiagnosis(encounter) {
  try {
    const symptomText = encounter.symptom_text || '';
    
    // Call the Python AI Microservice
    const response = await fetch('http://localhost:8000/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptom_text: symptomText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python AI Service failed (${response.status}): ${errorText}`);
    }

    const aiResult = await response.json();
    return aiResult;
  } catch (error) {
    console.error('AI Orchestration Proxy failed:', error);
    // Return graceful fallback if Python service is down
    return {
      symptomAnalysis: {
        summary: 'AI Service Unavailable',
        structuredSymptoms: [],
      },
      ragSnippets: [],
      diseasePrediction: {
        primary: 'Service Offline',
        differential: [],
        suggestedTests: [],
        suggestedMedications: [],
      },
      riskStratification: 'medium',
      confidenceScore: 0.0,
      protocolReferences: [],
      explainableSummary: 'The Python AI microservice is currently unreachable or encountered an error. Please ensure it is running on port 8000.',
      redFlags: [],
    };
  }
}

