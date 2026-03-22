import { useState } from 'react';
import ConfidenceRing from './ConfidenceRing';
import { recordDecision } from '../utils/api';

export default function ReconcileResult({ result, onReset }) {
  const [decision, setDecision] = useState(null);
  const [notes, setNotes] = useState('');
  const [override, setOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  const safetyColors = {
    PASSED: 'badge-green',
    REVIEW_NEEDED: 'badge-yellow',
    FAILED: 'badge-red',
  };

  const conflictLabels = {
    dose_discrepancy: 'Dose Discrepancy',
    drug_discrepancy: 'Drug Discrepancy',
    status_discrepancy: 'Status Discrepancy',
    frequency_discrepancy: 'Frequency Discrepancy',
  };

  async function submitDecision(d) {
    setDecision(d);
    setSubmitting(true);
    setDecisionError(null);
    try {
      await recordDecision(result.request_id, d, notes, d === 'modified' ? override : null);
      setSubmitted(true);
    } catch (e) {
      setDecisionError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero result card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(0,229,191,0.04) 100%)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="label">Reconciled Medication</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              {result.reconciled_medication}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${safetyColors[result.clinical_safety_check] || 'badge-blue'}`}>
                ⚕ {result.clinical_safety_check?.replace('_', ' ')}
              </span>
              {result.conflict_type && (
                <span className="badge badge-purple">
                  {conflictLabels[result.conflict_type] || result.conflict_type}
                </span>
              )}
              {result.meta && (
                <span className="badge badge-blue">
                  {result.meta.sources_analyzed} sources analyzed
                </span>
              )}
            </div>
          </div>
          <ConfidenceRing score={result.confidence_score} size={90}/>
        </div>
      </div>

      {/* Reasoning */}
      <div className="card">
        <div className="card-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 7h2v5H7V7zm0-3h2v2H7V4z" fill="var(--accent2)"/>
          </svg>
          Clinical Reasoning
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{result.reasoning}</p>
      </div>

      {/* Recommended actions */}
      {result.recommended_actions?.length > 0 && (
        <div className="card">
          <div className="card-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4.5" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Recommended Actions
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.recommended_actions.map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--yellow)', fontSize: 11, marginTop: 2, flexShrink: 0 }}>▶</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Source weights & duplicates */}
      <div className="grid-2">
        {result.source_weights && (
          <div className="card">
            <div className="card-title">Source Reliability</div>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: 4 }}>Most Reliable</span>
                <div style={{ color: 'var(--text)', marginTop: 4 }}>{result.source_weights.most_reliable}</div>
              </div>
              <div>
                <span className="badge badge-red" style={{ marginBottom: 4 }}>Least Reliable</span>
                <div style={{ color: 'var(--text)', marginTop: 4 }}>{result.source_weights.least_reliable}</div>
              </div>
              {result.source_weights.explanation && (
                <p style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  {result.source_weights.explanation}
                </p>
              )}
            </div>
          </div>
        )}

        {result.meta?.duplicate_records?.length > 0 ? (
          <div className="card">
            <div className="card-title">
              <span className="badge badge-yellow" style={{ fontSize: 11 }}>
                {result.meta.duplicate_records.length} Duplicate{result.meta.duplicate_records.length > 1 ? 's' : ''} Detected
              </span>
            </div>
            {result.meta.duplicate_records.map((d, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, padding: '8px', background: 'var(--surface2)', borderRadius: 6 }}>
                <div style={{ color: 'var(--yellow)', marginBottom: 4 }}>{d.source_a} ↔ {d.source_b}</div>
                <div>Similarity: {Math.round(d.similarity_score * 100)}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Duplicate Detection</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13 }}>
              <span>✓</span> No duplicate records found
            </div>
            {result.meta?.source_agreement && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>
                Source agreement: {Math.round(result.meta.source_agreement.agreement_ratio * 100)}%
                ({result.meta.source_agreement.agreeing_sources}/{result.meta.source_agreement.total_sources} sources)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clinician decision panel */}
      {!submitted ? (
        <div className="card" style={{ border: '1px solid var(--border2)' }}>
          <div className="card-title">Clinician Review</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
            Review the AI's reconciliation recommendation and record your decision.
          </p>

          <div style={{ marginBottom: 16 }}>
            <div className="label">Notes (optional)</div>
            <textarea className="textarea" style={{ minHeight: 72 }}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add clinical notes, context, or reasoning for your decision..."/>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="label">Override Medication (if rejecting)</div>
            <input className="input" value={override} onChange={e => setOverride(e.target.value)}
              placeholder="Enter corrected medication if different from AI suggestion"/>
          </div>

          {decisionError && <div className="error-box" style={{ marginBottom: 12 }}>{decisionError}</div>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success" disabled={submitting} onClick={() => submitDecision('approved')}>
              {submitting && decision === 'approved' ? <span className="spinner"/> : '✓'} Approve
            </button>
            <button className="btn btn-danger" disabled={submitting} onClick={() => submitDecision('rejected')}>
              {submitting && decision === 'rejected' ? <span className="spinner"/> : '✕'} Reject
            </button>
            <button className="btn btn-ghost" disabled={submitting} onClick={() => submitDecision('modified')}>
              {submitting && decision === 'modified' ? <span className="spinner"/> : '✎'} Approve with Modification
            </button>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={onReset}>
              ← New Reconciliation
            </button>
          </div>
        </div>
      ) : (
        <div className="card fade-in" style={{ border: '1px solid rgba(0,229,191,0.3)', textAlign: 'center' }}>
          <div style={{ color: 'var(--accent)', fontSize: 28, marginBottom: 8 }}>✓</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Decision Recorded</div>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>
            Your {decision} decision has been saved (Request ID: {result.request_id?.slice(0, 8)}...)
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onReset}>← New Reconciliation</button>
        </div>
      )}
    </div>
  );
}
