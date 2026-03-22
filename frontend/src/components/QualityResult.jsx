import ScoreBar from './ScoreBar';

export default function QualityResult({ result, onReset }) {
  const overallColor = result.overall_score >= 70
    ? 'var(--green)' : result.overall_score >= 45
    ? 'var(--yellow)' : 'var(--red)';

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...(result.issues_detected || [])].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  const severityClass = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero score */}
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 24,
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `conic-gradient(${overallColor} ${result.overall_score * 3.6}deg, var(--surface3) 0deg)`,
          boxShadow: `0 0 24px ${overallColor}44`,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--surface2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: overallColor, lineHeight: 1 }}>
              {result.overall_score}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.5px' }}>/ 100</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="label">Overall Data Quality Score</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
            {result.overall_score >= 70 ? 'Good Quality' : result.overall_score >= 45 ? 'Needs Improvement' : 'Poor Quality'}
          </div>
          {result.summary && (
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{result.summary}</p>
          )}
          {result.requires_immediate_review && (
            <div style={{ marginTop: 10 }}>
              <span className="badge badge-red">⚠ Requires Immediate Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="card">
        <div className="card-title">Score Breakdown</div>
        <ScoreBar label="Completeness" score={result.breakdown.completeness}/>
        <ScoreBar label="Accuracy" score={result.breakdown.accuracy}/>
        <ScoreBar label="Timeliness" score={result.breakdown.timeliness}/>
        <ScoreBar label="Clinical Plausibility" score={result.breakdown.clinical_plausibility}/>
      </div>

      {/* Issues */}
      {sorted.length > 0 && (
        <div className="card">
          <div className="card-title">
            Issues Detected
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>
              {sorted.filter(i => i.severity === 'high').length} high ·{' '}
              {sorted.filter(i => i.severity === 'medium').length} medium ·{' '}
              {sorted.filter(i => i.severity === 'low').length} low
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((issue, i) => (
              <div key={i} style={{
                background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px',
                borderLeft: `3px solid ${issue.severity === 'high' ? 'var(--red)' : issue.severity === 'medium' ? 'var(--yellow)' : 'var(--accent2)'}`,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <code style={{ fontSize: 12, color: 'var(--accent2)', background: 'var(--surface3)', padding: '1px 6px', borderRadius: 4 }}>
                    {issue.field}
                  </code>
                  <span className={`badge ${severityClass[issue.severity] || 'badge-blue'}`}>
                    {issue.severity}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{issue.issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--green)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No Issues Detected</div>
        </div>
      )}

      <button className="btn btn-ghost" onClick={onReset} style={{ alignSelf: 'flex-start' }}>
        ← New Validation
      </button>
    </div>
  );
}
