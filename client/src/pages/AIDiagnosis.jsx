import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function AIDiagnosis() {
  const [searchParams] = useSearchParams();
  const encounterId = searchParams.get('encounterId');
  const [encounter, setEncounter] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (encounterId) {
      setLoading(true);
      api
        .get(`/encounters/${encounterId}`)
        .then(({ data }) => {
          setEncounter(data);
          if (data.ai_result?.result_json) {
            const r = typeof data.ai_result.result_json === 'string'
              ? JSON.parse(data.ai_result.result_json)
              : data.ai_result.result_json;
            setResult(r);
          }
        })
        .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [encounterId]);

  const runDiagnosis = () => {
    if (!encounterId) return;
    setRunning(true);
    setError('');
    api
      .post(`/encounters/${encounterId}/ai-diagnosis`)
      .then(({ data }) => setResult(data))
      .catch((e) => setError(e.response?.data?.message || 'AI diagnosis failed'))
      .finally(() => setRunning(false));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>AI Diagnosis</h1>
      {encounterId && encounter && (
        <div className="card">
          <p><strong>Patient:</strong> {encounter.patient_name} &nbsp; <strong>Visit:</strong> {new Date(encounter.visit_date).toLocaleDateString()} &nbsp; <strong>Encounter #</strong>{encounter.id}</p>
          <p><strong>Chief Complaint:</strong> {encounter.chief_complaint || '—'}</p>
          <p><strong>Symptoms:</strong> {encounter.symptoms?.[0]?.symptom_text || '—'}</p>
          <button type="button" className="btn btn-primary" onClick={runDiagnosis} disabled={running}>
            {running ? 'Running AI...' : 'Run AI Diagnosis'}
          </button>
        </div>
      )}
      {!encounterId && (
        <div className="card">
          <p>Select an encounter from <a href="/encounters">Encounters</a> or open a patient to run AI diagnosis.</p>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {result && (
        <>
          <div className="card">
            <h3>Symptom Analysis Agent</h3>
            <p>{result.symptomAnalysis?.summary}</p>
            {result.symptomAnalysis?.structuredSymptoms?.length > 0 && (
              <ul>
                {result.symptomAnalysis.structuredSymptoms.map((s, i) => (
                  <li key={i}>{s.symptom} ({s.severity})</li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3>RAG Knowledge Retrieval</h3>
            {result.ragSnippets?.map((s, i) => (
              <blockquote key={i} style={{ borderLeft: '4px solid var(--color-primary)', paddingLeft: '1rem', margin: '0.5rem 0' }}>
                <strong>{s.source}</strong>: {s.text}
              </blockquote>
            ))}
          </div>
          <div className="card">
            <h3>Disease Prediction Agent</h3>
            <p><strong>Primary:</strong> {result.diseasePrediction?.primary}</p>
            <p><strong>Differentials:</strong> {Array.isArray(result.diseasePrediction?.differential) ? result.diseasePrediction.differential.join(', ') : '—'}</p>
            <p><strong>Suggested Tests:</strong> {Array.isArray(result.diseasePrediction?.suggestedTests) ? result.diseasePrediction.suggestedTests.join(', ') : '—'}</p>
            <p><strong>Suggested Medications:</strong> {Array.isArray(result.diseasePrediction?.suggestedMedications) ? result.diseasePrediction.suggestedMedications.join(', ') : '—'}</p>
          </div>
          <div className="card">
            <h3>Risk & Confidence</h3>
            <p><strong>Risk Stratification:</strong> {result.riskStratification}</p>
            <p><strong>Confidence Score:</strong> {result.confidenceScore != null ? `${(result.confidenceScore * 100).toFixed(0)}%` : '—'}</p>
            <p><strong>Protocol References:</strong> {Array.isArray(result.protocolReferences) ? result.protocolReferences.join(', ') : '—'}</p>
          </div>
          {result.redFlags?.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <h3>Red Flags</h3>
              <ul>{result.redFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
          <div className="card">
            <h3>Explainable Summary (for Doctor)</h3>
            <p>{result.explainableSummary}</p>
          </div>
        </>
      )}
    </div>
  );
}
