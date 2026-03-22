import { useState } from 'react';
import QualityResult from '../components/QualityResult';
import { validateDataQuality } from '../utils/api';
import { SAMPLE_QUALITY } from '../utils/sampleData';

const DEFAULT_FORM = {
  name: '', dob: '', gender: '',
  medications: '', allergies: '', conditions: '',
  blood_pressure: '', heart_rate: '', temperature: '', spo2: '',
  last_updated: '',
};

export default function ValidatePage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function f(field) {
    return { value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) };
  }

  function loadSample() {
    const s = SAMPLE_QUALITY;
    setForm({
      name: s.demographics.name || '',
      dob: s.demographics.dob || '',
      gender: s.demographics.gender || '',
      medications: (s.medications || []).join(', '),
      allergies: (s.allergies || []).join(', '),
      conditions: (s.conditions || []).join(', '),
      blood_pressure: s.vital_signs?.blood_pressure || '',
      heart_rate: String(s.vital_signs?.heart_rate || ''),
      temperature: '',
      spo2: '',
      last_updated: s.last_updated || '',
    });
    setResult(null);
    setError(null);
  }

  function buildPayload() {
    const split = str => str.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {};

    if (form.name || form.dob || form.gender) {
      payload.demographics = {};
      if (form.name) payload.demographics.name = form.name;
      if (form.dob) payload.demographics.dob = form.dob;
      if (form.gender) payload.demographics.gender = form.gender;
    }

    if (form.medications) payload.medications = split(form.medications);
    if (form.allergies !== '') payload.allergies = split(form.allergies);
    if (form.conditions) payload.conditions = split(form.conditions);
    if (form.last_updated) payload.last_updated = form.last_updated;

    const vitals = {};
    if (form.blood_pressure) vitals.blood_pressure = form.blood_pressure;
    if (form.heart_rate) vitals.heart_rate = Number(form.heart_rate);
    if (form.temperature) vitals.temperature = Number(form.temperature);
    if (form.spo2) vitals.spo2 = Number(form.spo2);
    if (Object.keys(vitals).length > 0) payload.vital_signs = vitals;

    return payload;
  }

  async function handleSubmit() {
    setError(null);
    const payload = buildPayload();

    if (Object.keys(payload).length === 0) {
      setError('Please fill in at least one field to validate.');
      return;
    }

    setLoading(true);
    try {
      const data = await validateDataQuality(payload);
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
    return <QualityResult result={result} onReset={() => setResult(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)', marginBottom: 6 }}>
            Data Quality Validation
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>
            Evaluate patient record quality across completeness, accuracy, timeliness, and clinical plausibility.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadSample}>Load Sample Data</button>
      </div>

      {/* Demographics */}
      <div className="card">
        <div className="card-title">Demographics</div>
        <div className="grid-3">
          <div>
            <div className="label">Patient Name</div>
            <input className="input" {...f('name')} placeholder="Full name"/>
          </div>
          <div>
            <div className="label">Date of Birth</div>
            <input className="input" type="date" {...f('dob')}/>
          </div>
          <div>
            <div className="label">Gender</div>
            <select className="select" {...f('gender')}>
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinical data */}
      <div className="card">
        <div className="card-title">Clinical Data</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label">Medications (comma-separated)</div>
            <input className="input" {...f('medications')} placeholder="e.g. Metformin 500mg, Lisinopril 10mg"/>
          </div>
          <div className="grid-2">
            <div>
              <div className="label">Allergies (comma-separated, leave empty if none documented)</div>
              <input className="input" {...f('allergies')} placeholder="e.g. Penicillin, Sulfa"/>
            </div>
            <div>
              <div className="label">Conditions (comma-separated)</div>
              <input className="input" {...f('conditions')} placeholder="e.g. Type 2 Diabetes, Hypertension"/>
            </div>
          </div>
        </div>
      </div>

      {/* Vital signs */}
      <div className="card">
        <div className="card-title">Vital Signs</div>
        <div className="grid-2">
          <div>
            <div className="label">Blood Pressure (systolic/diastolic)</div>
            <input className="input" {...f('blood_pressure')} placeholder="e.g. 120/80"/>
          </div>
          <div>
            <div className="label">Heart Rate (bpm)</div>
            <input className="input" type="number" {...f('heart_rate')} placeholder="e.g. 72"/>
          </div>
          <div>
            <div className="label">Temperature (°F)</div>
            <input className="input" type="number" step="0.1" {...f('temperature')} placeholder="e.g. 98.6"/>
          </div>
          <div>
            <div className="label">SpO2 (%)</div>
            <input className="input" type="number" min="0" max="100" {...f('spo2')} placeholder="e.g. 98"/>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="card">
        <div className="card-title">Record Metadata</div>
        <div style={{ maxWidth: 280 }}>
          <div className="label">Last Updated</div>
          <input className="input" type="date" {...f('last_updated')}/>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start', padding: '12px 32px', fontSize: 14 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner" style={{ width: 16, height: 16 }}/> Analyzing Quality...</>
        ) : (
          '◎ Validate Data Quality'
        )}
      </button>
    </div>
  );
}
