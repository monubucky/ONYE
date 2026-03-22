export default function ConfidenceRing({ score, size = 80 }) {
  const pct = Math.round(score * 100);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={6}/>
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <text
          x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}
          fill={color} fontSize={size < 70 ? 13 : 16} fontFamily="var(--font-display)" fontWeight="700"
        >
          {pct}%
        </text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Confidence
      </span>
    </div>
  );
}
