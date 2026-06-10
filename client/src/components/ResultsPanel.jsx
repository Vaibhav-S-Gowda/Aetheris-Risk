/**
 * ResultsPanel.jsx – Displays risk evaluation results.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import GaugeChart from './GaugeChart';
import ESGBars    from './ESGBars';

function getRiskClass(label) {
  if (!label) return 'risk-low';
  const l = label.toLowerCase();
  if (l === 'high')   return 'risk-high';
  if (l === 'medium') return 'risk-med';
  return 'risk-low';
}

export default function ResultsPanel({ result }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!result || !panelRef.current) return;
    const cards = panelRef.current.querySelectorAll('.result-card');
    gsap.fromTo(cards,
      { y: 16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out', clearProps: 'all' }
    );
  }, [result]);

  if (!result) {
    return (
      <div className="results-panel">
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="24" cy="24" r="20" />
              <path d="M24 14v12M24 34v1" strokeLinecap="round"/>
            </svg>
            <p>Submit the form to see your risk analysis</p>
          </div>
        </div>
      </div>
    );
  }

  const cls       = getRiskClass(result.composite_label);
  const creditCls = getRiskClass(result.risk_label);
  const creditPct = (result.risk_probability * 100).toFixed(1);
  const esgPct    = (result.esg_score * 100).toFixed(1);
  const compPct   = (result.composite_score * 100).toFixed(1);

  // ── Repayment Feasibility Calculation ──────────────────────────
  const income    = result.inputs?.person_income  ?? null;
  const loanAmnt  = result.inputs?.loan_amnt      ?? null;
  const intRate   = result.inputs?.loan_int_rate   ?? null;

  let repayCard = null;
  if (income && loanAmnt && intRate) {
    // Standard EMI formula: EMI = P * r(1+r)^n / ((1+r)^n - 1)
    // Assume 36-month (3-year) loan term as default
    const n = 36;
    const r = (intRate / 100) / 12;
    let emi;
    if (r === 0) {
      emi = loanAmnt / n;
    } else {
      emi = loanAmnt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }
    const monthlyIncome = income / 12;
    const emiPct        = (emi / monthlyIncome) * 100;

    let verdict, verdictClass, verdictIcon;
    if (emiPct > 50) {
      verdict = 'Repayment Risk'; verdictClass = 'risk-high'; verdictIcon = '⚠';
    } else if (emiPct > 35) {
      verdict = 'Borderline';    verdictClass = 'risk-med';  verdictIcon = '⚡';
    } else {
      verdict = 'Affordable';    verdictClass = 'risk-low';  verdictIcon = '✓';
    }

    const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

    repayCard = (
      <div className="card result-card">
        <div className="card-header">
          <div className="card-title">Repayment Feasibility</div>
          <span className={`risk-pill ${verdictClass}`}>
            <span className={`risk-dot ${verdictClass}`} />
            {verdict}
          </span>
        </div>
        <div className="stat-row" style={{ marginBottom: '0.75rem' }}>
          <div>
            <div className="stat-item-label">Monthly EMI (36 mo.)</div>
            <div className="stat-item-value" style={{ fontSize: '1.4rem' }}>{fmt(emi)}</div>
          </div>
          <div>
            <div className="stat-item-label">Monthly Income</div>
            <div className="stat-item-value" style={{ fontSize: '1.4rem' }}>{fmt(monthlyIncome)}</div>
          </div>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span className="score-bar-label">EMI as % of Monthly Income</span>
            <span className="score-bar-value">{emiPct.toFixed(1)}%</span>
          </div>
          <div className="score-bar-track">
            <div
              className={`score-bar-fill ${emiPct > 50 ? 'negative' : emiPct > 35 ? 'neutral' : 'positive'}`}
              style={{ width: `${Math.min(emiPct, 100)}%` }}
            />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-3)', marginTop: '0.5rem' }}>
          {verdictIcon} Guideline: EMI should be &lt;35% of monthly income. This estimate assumes a 36-month term.
        </p>
      </div>
    );
  }

  return (
    <div className="results-panel" ref={panelRef}>

      {/* ── Composite Score Hero ───────────────────────────────────── */}
      <div className={`score-hero result-card ${cls}`}>
        <div className="score-label">Composite Risk Score</div>
        <GaugeChart value={result.composite_score} riskClass={cls} />
        <span className={`risk-pill ${cls}`}>
          <span className={`risk-dot ${cls}`} />
          {result.composite_label} Risk — {compPct}%
        </span>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-3)', marginTop: '4px' }}>
          Country: <strong style={{ color: 'var(--color-ink)' }}>{result.country}</strong>
        </div>
      </div>

      {/* ── Credit Risk Card ───────────────────────────────────────── */}
      <div className="card result-card">
        <div className="card-header">
          <div className="card-title">Credit Risk (ML Model)</div>
          <span className={`risk-pill ${creditCls}`}>
            <span className={`risk-dot ${creditCls}`} />
            {result.risk_label}
          </span>
        </div>
        <div className="stat-row">
          <div>
            <div className="stat-item-label">Default Probability</div>
            <div className="stat-item-value">{creditPct}%</div>
          </div>
          <div>
            <div className="stat-item-label">ESG Score</div>
            <div className="stat-item-value">{esgPct}</div>
          </div>
        </div>
        <div className="score-bar-track">
          <div
            className={`score-bar-fill ${creditCls === 'risk-high' ? 'negative' : 'positive'}`}
            style={{ width: `${result.risk_probability * 100}%` }}
          />
        </div>
      </div>

      {/* ── Repayment Feasibility ──────────────────────────────────── */}
      {repayCard}

      {/* ── ESG Breakdown ─────────────────────────────────────────── */}
      <div className="card result-card">
        <div className="card-header">
          <div className="card-title">Sustainability Indicators</div>
          <span className="card-badge">ESG Context</span>
        </div>
        <ESGBars esgDetails={result.esg_details} />
      </div>

    </div>
  );
}
