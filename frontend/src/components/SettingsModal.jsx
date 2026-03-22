import { useState } from 'react';

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('ehr_api_key') || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('ehr_api_key', apiKey);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="fade-in">
        <div style={styles.header}>
          <span style={styles.title}>Configuration</span>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>
        <div style={styles.body}>
          <div className="label">Backend API Key</div>
          <input
            className="input"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your API secret key"
            autoFocus
          />
          <p style={styles.hint}>
            Set via <code>API_SECRET_KEY</code> in your backend <code>.env</code>.
            This key is stored in browser localStorage.
          </p>
        </div>
        <div style={styles.footer}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440,
    margin: '16px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px', borderBottom: '1px solid var(--border)',
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 },
  close: {
    background: 'none', border: 'none', color: 'var(--text3)',
    cursor: 'pointer', fontSize: 16, lineHeight: 1,
  },
  body: { padding: '24px' },
  hint: { marginTop: 10, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '16px 24px', borderTop: '1px solid var(--border)',
  },
};
