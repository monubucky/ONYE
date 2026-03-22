import { useState } from 'react';
import ReconcilePage from './pages/ReconcilePage';
import ValidatePage from './pages/ValidatePage';
import SettingsModal from './components/SettingsModal';

const TABS = [
  { id: 'reconcile', label: 'Medication Reconciliation' },
  { id: 'validate', label: 'Data Quality' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('reconcile');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <style>{globalStyles}</style>
      <div className="app-shell">
        <header className="app-header">
          <div className="header-inner">
            <div className="brand">
              <div className="brand-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="2" fill="#00e5bf"/>
                  <rect x="16" y="2" width="10" height="10" rx="2" fill="#00e5bf" opacity="0.5"/>
                  <rect x="2" y="16" width="10" height="10" rx="2" fill="#00e5bf" opacity="0.5"/>
                  <rect x="16" y="16" width="10" height="10" rx="2" fill="#00e5bf"/>
                </svg>
              </div>
              <div>
                <div className="brand-name">ClinicalSync</div>
                <div className="brand-sub">EHR Reconciliation Engine</div>
              </div>
            </div>
            <nav className="tab-nav">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.05 3.05l1.41 1.41M13.54 13.54l1.41 1.41M3.05 14.95l1.41-1.41M13.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Config
            </button>
          </div>
        </header>

        <main className="app-main">
          {activeTab === 'reconcile' ? <ReconcilePage /> : <ValidatePage />}
        </main>

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </>
  );
}

const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0d12;
    --surface: #111620;
    --surface2: #161c28;
    --surface3: #1d2535;
    --border: #232d3f;
    --border2: #2d3a50;
    --accent: #00e5bf;
    --accent2: #0099ff;
    --accent3: #7c5cfc;
    --text: #e8edf5;
    --text2: #8a99b3;
    --text3: #556075;
    --red: #ff4757;
    --yellow: #ffc048;
    --green: #00e5bf;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --radius: 10px;
    --radius-lg: 16px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  html, body { background: var(--bg); color: var(--text); font-family: var(--font-mono); min-height: 100vh; }

  .app-shell { display: flex; flex-direction: column; min-height: 100vh; }

  .app-header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(12px);
  }
  .header-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center; gap: 24px;
    padding: 12px 24px;
  }
  .brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .brand-icon { display: flex; }
  .brand-name { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--text); letter-spacing: -0.3px; }
  .brand-sub { font-size: 11px; color: var(--text3); font-weight: 300; letter-spacing: 0.5px; }

  .tab-nav { display: flex; gap: 4px; margin-left: auto; }
  .tab-btn {
    font-family: var(--font-mono); font-size: 13px; font-weight: 400;
    color: var(--text2); background: transparent;
    border: 1px solid transparent; border-radius: var(--radius);
    padding: 8px 16px; cursor: pointer; transition: all 0.18s;
    white-space: nowrap;
  }
  .tab-btn:hover { color: var(--text); background: var(--surface3); }
  .tab-btn.active { color: var(--accent); border-color: var(--accent); background: rgba(0,229,191,0.06); }

  .settings-btn {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-mono); font-size: 13px; color: var(--text2);
    background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius); padding: 8px 12px; cursor: pointer;
    transition: all 0.18s; flex-shrink: 0;
  }
  .settings-btn:hover { color: var(--text); border-color: var(--border2); }

  .app-main { flex: 1; max-width: 1280px; margin: 0 auto; width: 100%; padding: 32px 24px; }

  /* Shared components */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 24px;
  }
  .card-title {
    font-family: var(--font-display); font-weight: 700; font-size: 16px;
    color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }
  .label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; font-weight: 500; margin-bottom: 6px; }

  .input, .textarea, .select {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text); font-family: var(--font-mono);
    font-size: 13px; padding: 10px 14px; outline: none; transition: border-color 0.18s;
  }
  .input:focus, .textarea:focus, .select:focus { border-color: var(--accent2); }
  .textarea { resize: vertical; min-height: 120px; line-height: 1.6; }
  .select { appearance: none; cursor: pointer; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: var(--font-mono); font-size: 13px; font-weight: 500;
    padding: 10px 20px; border-radius: var(--radius); cursor: pointer;
    transition: all 0.18s; border: 1px solid transparent; white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #0a0d12; border-color: var(--accent); }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn-ghost { background: transparent; color: var(--text2); border-color: var(--border); }
  .btn-ghost:hover { color: var(--text); border-color: var(--border2); background: var(--surface3); }
  .btn-danger { background: rgba(255,71,87,0.1); color: var(--red); border-color: rgba(255,71,87,0.3); }
  .btn-danger:hover { background: rgba(255,71,87,0.2); }
  .btn-success { background: rgba(0,229,191,0.1); color: var(--accent); border-color: rgba(0,229,191,0.3); }
  .btn-success:hover { background: rgba(0,229,191,0.2); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; padding: 3px 9px;
    border-radius: 99px; border: 1px solid;
  }
  .badge-green { color: var(--green); border-color: rgba(0,229,191,0.35); background: rgba(0,229,191,0.08); }
  .badge-yellow { color: var(--yellow); border-color: rgba(255,192,72,0.35); background: rgba(255,192,72,0.08); }
  .badge-red { color: var(--red); border-color: rgba(255,71,87,0.35); background: rgba(255,71,87,0.08); }
  .badge-blue { color: var(--accent2); border-color: rgba(0,153,255,0.35); background: rgba(0,153,255,0.08); }
  .badge-purple { color: #a78bfa; border-color: rgba(124,92,252,0.35); background: rgba(124,92,252,0.08); }

  .error-box {
    background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.25);
    border-radius: var(--radius); padding: 14px 16px;
    color: var(--red); font-size: 13px; line-height: 1.5;
  }

  .spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  @media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
`;
