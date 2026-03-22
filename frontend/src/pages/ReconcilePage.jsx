import { useState } from 'react';
import SourceForm from '../components/SourceForm';
import ReconcileResult from '../components/ReconcileResult';
import { reconcileMedication } from '../utils/api';
import { SAMPLE_RECONCILE } from '../utils/sampleData';

const DEFAULT_CONTEXT = { age: '', conditions: '', eGFR: '' };
const DEFAULT_SOURCES = [
  { system: '', medication: '', last_updated: '', last_filled: '', source_reliability: 'high', notes: '' },
  { system: '', medication: '', last_updated: '', last_filled: '', source_reliability: 'high', notes: '' },
];

export default function ReconcilePage() {
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function loadSample() {
    const s = SAMPLE_RECONCILE;
    setContext({
      age: String(s.patient_context.age),
      conditions: s.patient_context.conditions.join(', '),
      eGFR: String(s.patient_context.recent_labs.eGFR),
    });
    setSources(s.sources.map(src => ({
      system: src.system,
      medication: src.medication,
      last_updated: src.last_updated || '',
      last_filled: src.last_filled || '',
      source_reliability: src.source_reliability || 'high',
      notes: '',
    })));
    setResult(null);
    setError(null);
  }

  function buildPayload() {
    return {
      patient_context: {
        age: context.age ? Number(context.age) : undefined,
        conditions: context.conditions ? context.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        recent_labs: context.eGFR ? { eGFR: Number(context.eGFR) } : {},
      },
      sources: sources.map(s => ({
        system: s.system,
        medication: s.medication,
        ...(s.last_updated && { last_updated: s.last_updated }),
        ...(s.last_filled && { last_filled: s.last_filled }),
        source_reliability: s.source_reliability,
        ...(s.notes && { notes: s.notes }),
      })).filter(s => s.system && s.medication),
    };
  }

  async function handleSubmit() {
    setError(null);
    const payload = buildPayload();

    if (payload.sources.length < 2) {
      setError('Please provide at least 2 complete sources (system name + medication required).');
      return;
    }

    setLoading(true);
    try {
      const data = await reconcileMedication(payload);
      setResult(data);
    } catch (e) {
      setError(
        e.status === 401 ? 'API key required. Click "Config" in the header to set your API key.' :
        e.status === 403 ? 'Invalid API key. Please check your configuration.' :
        e.details ? e.details.map(d => d.message).join('; ') :
        e.message || 'Something went wrong. Is the backend running?'
      );
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return <ReconcileResult result={result} onReset={() => setResult(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)', marginBottom: 6 }}>
            Medication Reconciliation
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>
            AI-powered reconciliation of conflicting medication records across healthcare systems.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadSample}>Load Sample Data</button>
      </div>

      {/* Patient Context */}
      <div className="card">
        <div className="card-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="var(--accent2)" strokeWidth="1.5"/>
            <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="var(--accent2)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Patient Context
        </div>
        <div className="grid-3">
          <div>
            <div className="label">Age</div>
            <input className="input" type="number" min="0" max="150"
              value={context.age} onChange={e => setContext({ ...context, age: e.target.value })}
              placeholder="e.g. 67"/>
          </div>
          <div>
            <div className="label">Conditions (comma-separated)</div>
            <input className="input" value={context.conditions}
              onChange={e => setContext({ ...context, conditions: e.target.value })}
              placeholder="e.g. Type 2 Diabetes, Hypertension"/>
          </div>
          <div>
            <div className="label">eGFR (kidney function)</div>
            <input className="input" type="number" min="0" max="200"
              value={context.eGFR} onChange={e => setContext({ ...context, eGFR: e.target.value })}
              placeholder="e.g. 45"/>
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="card">
        <SourceForm sources={sources} onChange={setSources}/>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start', padding: '12px 32px', fontSize: 14 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner" style={{ width: 16, height: 16 }}/> Reconciling with AI...</>
        ) : (
          '⚕ Reconcile Medications'
        )}
      </button>

      {/* How it works */}
      <details style={{ fontSize: 12, color: 'var(--text3)' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--text2)', marginBottom: 8 }}>How does reconciliation work?</summary>
        <div style={{ padding: '12px 0', lineHeight: 1.8 }}>
          The engine weighs each source by recency, reliability, and clinical context. It uses Claude (Anthropic) to generate clinical reasoning — considering factors like recent lab results, disease-drug interactions, and pharmacy fill patterns — to determine the most clinically accurate medication record.
        </div>
      </details>
    </div>
  );
}
