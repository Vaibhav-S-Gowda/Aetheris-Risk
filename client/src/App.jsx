/**
 * App.jsx – Aetheris Risk main application component.
 */
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import RiskForm     from './components/RiskForm';
import ResultsPanel from './components/ResultsPanel';
import HistoryPanel from './components/HistoryPanel';
import { evaluate } from './api';

export default function App() {
  const [result,     setResult]     = useState(() => {
    try {
      const saved = localStorage.getItem('aetheris_active_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedInputs, setSelectedInputs] = useState(null);

  const mainRef = useRef(null);

  // Safe entrance animation — elements are visible by default,
  // GSAP only adds a subtle slide-in on top.
  useEffect(() => {
    if (!mainRef.current) return;
    const els = mainRef.current.querySelectorAll('.anim-in');
    gsap.fromTo(
      els,
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.55, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }
    );
  }, []);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await evaluate(formData);
      // The API response now includes inputs; also attach any fields the API didn't include
      if (!res.inputs) {
        res.inputs = {
          person_income: formData.person_income,
          loan_amnt: formData.loan_amnt,
          loan_int_rate: formData.loan_int_rate,
        };
      }
      setResult(res);
      localStorage.setItem('aetheris_active_result', JSON.stringify(res));
      setRefreshKey(k => k + 1);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Evaluation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleSelectRecord = (record) => {
    // 1. Update results panel
    const activeResult = {
      id: record._id,
      risk_probability: record.risk_probability,
      risk_label: record.risk_label,
      esg_score: record.esg_score,
      composite_score: record.composite_score,
      composite_label: record.composite_label || record.risk_label,
      esg_details: record.esg_details,
      country: record.country || record.inputs?.country,
      createdAt: record.createdAt,
      // Pass inputs so RepaymentFeasibility card can show EMI info
      inputs: record.inputs || null,
    };
    setResult(activeResult);
    localStorage.setItem('aetheris_active_result', JSON.stringify(activeResult));

    // 2. Update form inputs
    if (record.inputs) {
      const inputs = {
        person_age: record.inputs.person_age?.toString() || '',
        person_income: record.inputs.person_income?.toString() || '',
        person_emp_length: record.inputs.person_emp_length?.toString() || '',
        loan_amnt: record.inputs.loan_amnt?.toString() || '',
        loan_int_rate: record.inputs.loan_int_rate?.toString() || '',
        person_home_ownership: record.inputs.person_home_ownership || 'RENT',
        loan_intent: record.inputs.loan_intent || 'PERSONAL',
        loan_grade: record.inputs.loan_grade || 'C',
        cb_person_default_on_file: record.inputs.cb_person_default_on_file || 'N',
        country: record.inputs.country || 'USA',
      };
      setSelectedInputs(inputs);
    }
    
    // Close the drawer for a smooth UX
    setShowHistory(false);
  };


  return (
    <div className="app-shell">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <div className="logo-mark">Æ</div>
            <div>
              <div className="logo-text">Aetheris Risk</div>
              <div className="header-subtitle">AI · Finance · Sustainability</div>
            </div>
          </a>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowHistory(true)}
              className="btn-history-toggle"
              aria-label="Toggle history panel"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: 'middle' }}>
                <path d="M8.5 0a7.5 7.5 0 0 0-7.5 7.5c0 .35.03.7.08 1.04l1.37-.23A6 6 0 1 1 8 14v-1.5a4.5 4.5 0 1 0-3.3-1.42l-1.07 1.07A6 6 0 0 1 8.5 0zm-.5 3a.5.5 0 0 1 .5.5v4.2l3.15 1.9a.5.5 0 0 1-.5.86L8 8.35a.5.5 0 0 1-.5-.43V3.5a.5.5 0 0 1 .5-.5z"/>
              </svg>
              <span>History</span>
            </button>
            <div className="header-badge">Powered by Random Forest</div>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="main-content" ref={mainRef}>

        {/* Hero Banner */}
        <div className="hero-banner anim-in">
          <div className="hero-title">
            <span>Sustainable Finance</span>
            AI Financial<br />Risk Intelligence
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">214</div>
              <div className="hero-stat-label">Countries</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">92.9%</div>
              <div className="hero-stat-label">Model AUC</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">10</div>
              <div className="hero-stat-label">ESG Metrics</div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="card form-card anim-in">
          <div className="card-header">
            <div className="card-title">Risk Parameters</div>
            <span className="card-badge">Credit + ESG</span>
          </div>

          {error && (
            <div className="error-banner">
              ⚠ {error}
            </div>
          )}

          <RiskForm onSubmit={handleSubmit} loading={loading} initialData={selectedInputs} />
        </div>

        {/* Results Panel */}
        <div className="anim-in results-col">
          <ResultsPanel result={result} />
        </div>

      </main>

      {/* ── History Drawer ────────────────────────────────────────── */}
      <div
        className={`drawer-overlay ${showHistory ? 'open' : ''}`}
        onClick={() => setShowHistory(false)}
      />
      <div className={`history-drawer ${showHistory ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">Evaluation History</div>
          <button className="btn-drawer-close" onClick={() => setShowHistory(false)} aria-label="Close drawer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <HistoryPanel refreshKey={refreshKey} onSelectRecord={handleSelectRecord} />
      </div>
    </div>
  );
}
