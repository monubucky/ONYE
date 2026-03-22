export default function ScoreBar({ label, score, animate = true }) {
  const color = score >= 70 ? 'var(--green)' : score >= 45 ? 'var(--yellow)' : 'var(--red)';
  const grade = score >= 70 ? 'Good' : score >= 45 ? 'Fair' : 'Poor';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 500 }}>{score}/100 · {grade}</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`, background: color,
          borderRadius: 99, boxShadow: `0 0 8px ${color}`,
          transition: animate ? 'width 0.7s cubic-bezier(0.22,1,0.36,1)' : 'none',
        }}/>
      </div>
    </div>
  );
}
