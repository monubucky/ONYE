import { useState } from 'react';

const EMPTY_SOURCE = {
  system: '',
  medication: '',
  last_updated: '',
  last_filled: '',
  source_reliability: 'high',
  notes: '',
};

export default function SourceForm({ sources, onChange }) {
  const [expanded, setExpanded] = useState(null);

  function addSource() {
    const updated = [...sources, { ...EMPTY_SOURCE }];
    onChange(updated);
    setExpanded(updated.length - 1);
  }

  function removeSource(i) {
    onChange(sources.filter((_, idx) => idx !== i));
    setExpanded(null);
  }

  function updateSource(i, field, value) {
    const updated = sources.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
    onChange(updated);
  }

  const reliabilityColors = { high: 'var(--green)', medium: 'var(--yellow)', low: 'var(--red)' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="label" style={{ marginBottom: 0 }}>Data Sources ({sources.length})</div>
        <button className="btn btn-ghost btn-sm" onClick={addSource}>
          + Add Source
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sources.map((src, i) => (
          <div key={i} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            {/* Header row */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                cursor: 'pointer', userSelect: 'none',
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: reliabilityColors[src.source_reliability] || 'var(--text3)',
              }}/>
              <span style={{ fontSize: 13, color: src.system ? 'var(--text)' : 'var(--text3)', flex: 1 }}>
                {src.system || `Source ${i + 1}`}
              </span>
              {src.medication && (
                <span style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {src.medication}
                </span>
              )}
              <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 4 }}>
                {expanded === i ? '▲' : '▼'}
              </span>
              <button
                onClick={e => { e.stopPropagation(); removeSource(i); }}
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '2px 4px' }}
              >✕</button>
            </div>

            {/* Expanded fields */}
            {expanded === i && (
              <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div className="grid-2" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">System Name *</div>
                    <input className="input" value={src.system} placeholder="e.g. Hospital EHR"
                      onChange={e => updateSource(i, 'system', e.target.value)}/>
                  </div>
                  <div>
                    <div className="label">Reliability</div>
                    <select className="select" value={src.source_reliability}
                      onChange={e => updateSource(i, 'source_reliability', e.target.value)}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div className="label">Medication *</div>
                  <input className="input" value={src.medication} placeholder="e.g. Metformin 500mg twice daily"
                    onChange={e => updateSource(i, 'medication', e.target.value)}/>
                </div>
                <div className="grid-2" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">Last Updated</div>
                    <input className="input" type="date" value={src.last_updated}
                      onChange={e => updateSource(i, 'last_updated', e.target.value)}/>
                  </div>
                  <div>
                    <div className="label">Last Filled (pharmacy)</div>
                    <input className="input" type="date" value={src.last_filled}
                      onChange={e => updateSource(i, 'last_filled', e.target.value)}/>
                  </div>
                </div>
                <div>
                  <div className="label">Notes (optional)</div>
                  <input className="input" value={src.notes || ''} placeholder="Any additional context"
                    onChange={e => updateSource(i, 'notes', e.target.value)}/>
                </div>
              </div>
            )}
          </div>
        ))}

        {sources.length < 2 && (
          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            At least 2 sources required for reconciliation
          </div>
        )}
      </div>
    </div>
  );
}
