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
  const [mlInputs, setMlInputs] = useState({
    gate: {
      Age: '35',
      Gender: '0',
      Total_Bilirubin: '0.8',
      Direct_Bilirubin: '0.2',
      ALP: '80',
      ALT: '25',
      AST: '25',
      Total_Protiens: '7.0',
      Albumin: '4.0',
      Albumin_and_Globulin_Ratio: '1.5',
    },
    cancer: {
      Age: '35',
      Gender: '0',
      BMI: '23',
      Smoking: '0',
      GeneticRisk: '0',
      PhysicalActivity: '1',
      AlcoholIntake: '0',
      CancerHistory: '0',
    },
    fatty_liver: {
      Albumin: '4.0',
      ALP: '80',
      AST: '25',
      ALT: '25',
      Cholesterol: '180',
      Creatinine: '1.0',
      Glucose: '90',
      GGT: '25',
      Bilirubin: '0.8',
      Triglycerides: '120',
      Uric_Acid: '4.5',
      Platelets: '250000',
      HDL: '50',
    },
    hcv_stage: {
      Bilirubin: '0.8',
      Cholesterol: '180',
      Albumin: '4.0',
      Copper: '100',
      Alk_Phos: '80',
      SGOT: '25',
      Tryglicerides: '120',
      Platelets: '250000',
      Prothrombin: '12',
      Status: '0',
      Age: '35',
      Sex: '0',
      Ascites: '0',
      Hepatomegaly: '0',
      Spiders: '0',
      Edema: '0',
      APRI: '0.5',
      Bilirubin_Albumin: '0.2',
      Copper_Platelets: '0.0004',
    },
    hcv_status: {
      Bilirubin: '0.8',
      Cholesterol: '180',
      Albumin: '4.0',
      Copper: '100',
      Alk_Phos: '80',
      SGOT: '25',
      Tryglicerides: '120',
      Platelets: '250000',
      Prothrombin: '12',
      Age: '35',
      Sex: '0',
      Ascites: '0',
      Hepatomegaly: '0',
      Spiders: '0',
      Edema: '0',
      APRI: '0.5',
      ALBI_Score: '-2.6',
      Bili_Alb_Ratio: '0.2',
    },
    hcv_complications: {
      Bilirubin: '0.8',
      Cholesterol: '180',
      Albumin: '4.0',
      Copper: '100',
      Alk_Phos: '80',
      SGOT: '25',
      Tryglicerides: '120',
      Platelets: '250000',
      Prothrombin: '12',
      Age: '35',
      Sex: '0',
      Hepatomegaly: '0',
      Spiders: '0',
      Edema: '0',
    },
  });

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

  const handleMlChange = (modelKey, field, value) => {
    setMlInputs((prev) => ({
      ...prev,
      [modelKey]: {
        ...prev[modelKey],
        [field]: value,
      },
    }));
  };

  const runDiagnosis = () => {
    if (!encounterId) return;
    setRunning(true);
    setError('');
    api
      .post(`/encounters/${encounterId}/ai-diagnosis`, { mlInputs })
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
      <div className="card">
        <h3>Liver Model Inputs</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Enter available lab and clinical values. Leave fields blank if not available – the corresponding model may be skipped or less reliable.
        </p>
        <div className="form-grid">
          <h4>Gate Model (Dispatcher)</h4>
          <div className="form-row">
            {Object.entries(mlInputs.gate).map(([key, val]) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <input
                  value={val}
                  onChange={(e) => handleMlChange('gate', key, e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
            ))}
          </div>
          <h4>Liver Cancer Risk Model</h4>
          <div className="form-row">
            {Object.entries(mlInputs.cancer).map(([key, val]) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <input
                  value={val}
                  onChange={(e) => handleMlChange('cancer', key, e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
            ))}
          </div>
          <h4>Fatty Liver Model</h4>
          <div className="form-row">
            {Object.entries(mlInputs.fatty_liver).map(([key, val]) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <input
                  value={val}
                  onChange={(e) => handleMlChange('fatty_liver', key, e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
            ))}
          </div>
          <h4>Hepatitis C Stage Model</h4>
          <div className="form-row">
            {Object.entries(mlInputs.hcv_stage).map(([key, val]) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <input
                  value={val}
                  onChange={(e) => handleMlChange('hcv_stage', key, e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
            ))}
          </div>
          <h4>Hepatitis C Status Model</h4>
          <div className="form-row">
            {Object.entries(mlInputs.hcv_status).map(([key, val]) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <input
                  value={val}
                  onChange={(e) => handleMlChange('hcv_status', key, e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
            ))}
          </div>
          <h4>Hepatitis Complications Model</h4>
          <div className="form-row">
            {Object.entries(mlInputs.hcv_complications).map(([key, val]) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <input
                  value={val}
                  onChange={(e) => handleMlChange('hcv_complications', key, e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
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
          {result.mlModels && (
            <div className="card">
              <h3>Liver Model Outputs</h3>
              {result.mlModels.error && (
                <p className="error">{result.mlModels.error}</p>
              )}
              {!result.mlModels.error && (
                <ul>
                  {Object.entries(result.mlModels).map(([key, val]) => (
                    <li key={key}>
                      <strong>{key}:</strong>{' '}
                      {val && val.available
                        ? `prediction=${val.prediction} prob=${val.probability != null ? (val.probability * 100).toFixed(1) + '%' : 'n/a'}`
                        : (val && val.reason) || 'not available'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
