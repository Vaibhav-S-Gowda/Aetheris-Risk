/**
 * ModelRunsPanel.jsx – Displays all hyperparameter tuning runs stored in localStorage.
 * Only shows when tuning was enabled (result.tuning !== null).
 */
import { useState } from 'react';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getRiskClass(label) {
  if (!label) return 'risk-low';
  const l = label.toLowerCase();
  if (l === 'high') return 'risk-high';
  if (l === 'medium') return 'risk-med';
  return 'risk-low';
}

export function saveModelRun(result, hyperparameters) {
  try {
    const runs = loadModelRuns();
    const newRun = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      hyperparameters,
      metrics: result.tuning,
      risk_probability: result.risk_probability,
      risk_label: result.risk_label,
      composite_score: result.composite_score,
      result,
    };
    // Keep latest 20 runs
    const updated = [newRun, ...runs].slice(0, 20);
    localStorage.setItem('aetheris_model_runs', JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function loadModelRuns() {
  try {
    const saved = localStorage.getItem('aetheris_model_runs');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function ModelRunsPanel({ runs, onClear, onSelectRun }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  // Find best AUC index for highlighting
  const bestIdx = runs.reduce((bestI, r, i) =>
    (r.metrics?.auc ?? 0) > (runs[bestI]?.metrics?.auc ?? 0) ? i : bestI, 0);

  if (runs.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="6" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 12h28M10 18h4M10 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
          No model runs yet. Enable <strong>Advanced Hyperparameters</strong> and run an evaluation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem 0.75rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-3)' }}>
          {runs.length} run{runs.length !== 1 ? 's' : ''} · Click card to load evaluation
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
          style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '3px 9px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--color-ink-3)', transition: 'var(--transition)' }}
          onMouseEnter={e => { e.target.style.borderColor = '#dc2626'; e.target.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-ink-3)'; }}
        >
          Clear all
        </button>
      </div>

      {/* Scrollable runs list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 1rem 1rem' }}>
        {runs.map((run, i) => {
          const isBest = i === bestIdx;
          const isHovered = hoveredId === run.id;
          const hp = run.hyperparameters || {};
          return (
            <div
              key={run.id}
              onClick={() => onSelectRun && onSelectRun(run)}
              onMouseEnter={() => setHoveredId(run.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isBest ? (isHovered ? 'var(--color-ink)' : 'rgba(0,0,0,0.35)') : (isHovered ? 'var(--color-ink-2)' : 'var(--color-border)')}`,
                backgroundColor: isBest ? 'var(--color-ink)' : 'var(--color-bg)',
                color: isBest ? 'var(--color-bg)' : 'var(--color-ink)',
                padding: '0.75rem',
                marginBottom: '0.6rem',
                position: 'relative',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              }}
            >
              {isBest && (
                <span style={{ position: 'absolute', top: '-9px', left: '10px', backgroundColor: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: '0.58rem', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', letterSpacing: '0.05em', textTransform: 'uppercase', border: isBest && isHovered ? '1px solid var(--color-bg)' : 'none' }}>
                  ★ Best AUC
                </span>
              )}

              {/* Run meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', opacity: isBest ? 0.65 : 1, color: isBest ? 'inherit' : 'var(--color-ink-3)' }}>
                  Run #{runs.length - i} · {formatDate(run.timestamp)}
                </span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: '99px',
                  backgroundColor: isBest ? 'rgba(255,255,255,0.15)' : 'var(--color-bg-2)',
                  border: `1px solid ${isBest ? 'rgba(255,255,255,0.2)' : 'var(--color-border)'}`,
                }}>
                  {run.risk_label} Risk
                </span>
              </div>

              {/* Hyperparameters */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                {[
                  ['Trees', hp.n_estimators ?? '—'],
                  ['Depth', hp.max_depth === 'None' || hp.max_depth == null ? '∞' : hp.max_depth],
                  ['Min Split', hp.min_samples_split ?? '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    fontSize: '0.68rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: isBest ? 'rgba(255,255,255,0.12)' : 'var(--color-bg-2)',
                    border: `1px dashed ${isBest ? 'rgba(255,255,255,0.2)' : 'var(--color-border)'}`,
                    opacity: isBest ? 1 : undefined,
                  }}>
                    <span style={{ opacity: 0.65 }}>{label}: </span>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  ['Val AUC', run.metrics?.auc != null ? `${(run.metrics.auc * 100).toFixed(1)}%` : '—'],
                  ['Accuracy', run.metrics?.accuracy != null ? `${(run.metrics.accuracy * 100).toFixed(1)}%` : '—'],
                  ['Train ms', run.metrics?.training_time_ms != null ? `${run.metrics.training_time_ms}` : '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.58rem', opacity: 0.6, marginBottom: '1px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm clear modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.6rem', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--color-ink)' }}>Clear Model Runs?</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-3)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>All saved tuning runs will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '9px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-ink)' }}>Cancel</button>
              <button onClick={() => { onClear(); setShowConfirm(false); }} style={{ flex: 1, padding: '9px', backgroundColor: '#dc2626', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
