/**
 * HistoryPanel.jsx – Displays past evaluations from MongoDB.
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchHistory, deleteHistory, clearHistory } from '../api';

function riskClass(label) {
  if (!label) return 'risk-low';
  const l = label.toLowerCase();
  if (l === 'high')   return 'risk-high';
  if (l === 'medium') return 'risk-med';
  return 'risk-low';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + '  ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPanel({ refreshKey, onSelectRecord }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchHistory(20)
      .then(setRecords)
      .catch((err) => {
        console.error('Failed to load history:', err);
        setError(err.message || 'Failed to fetch history');
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleDelete = async (id) => {
    try {
      setError(null);
      await deleteHistory(id);
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete record');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all evaluation history?')) return;
    try {
      setError(null);
      await clearHistory();
      setRecords([]);
    } catch (err) {
      setError(err.message || 'Failed to clear history');
    }
  };

  return (
    <div className="history-panel card">
      <div className="card-header">
        <div className="card-title">Evaluation History</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="card-badge">{records.length} records</span>
          {records.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--color-ink-3)',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#dc2626'; e.target.style.color = '#dc2626'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-ink-3)'; }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ margin: '1rem' }}>
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div className="empty-state" style={{ padding: '1.5rem' }}>
          <div className="spinner" style={{ border: '2px solid var(--color-border)', borderTopColor: 'var(--color-ink)', width: 20, height: 20 }} />
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="empty-state">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="6" y="8" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 14h12M12 19h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>No evaluations yet. Run your first analysis above.</p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="history-list">
          {records.map((r, i) => {
            const cls = riskClass(r.composite_label || r.risk_label);
            return (
              <div
                className="history-item"
                key={r._id || i}
                onClick={(e) => {
                  if (e.target.closest('.history-delete')) return;
                  if (onSelectRecord) onSelectRecord(r);
                }}
                style={{ cursor: 'pointer' }}
                title="Click to load this record on screen"
              >
                <span className="history-rank">#{i + 1}</span>
                <div className="history-meta">
                  <span className="history-country">
                    {r.inputs?.country || '—'}
                  </span>
                  <span className="history-date">{formatDate(r.createdAt)}</span>
                </div>
                <span className={`risk-pill ${cls}`} style={{ margin: 0 }}>
                  <span className="risk-dot" />
                  {r.composite_label || r.risk_label || '—'}
                </span>
                <span className="history-score" style={{
                  color: cls === 'risk-high' ? 'var(--color-risk-high)'
                       : cls === 'risk-med'  ? 'var(--color-risk-med)'
                       : 'var(--color-risk-low)'
                }}>
                  {r.composite_score != null ? (r.composite_score * 100).toFixed(0) : '–'}%
                </span>
                <button
                  className="history-delete"
                  onClick={() => handleDelete(r._id)}
                  title="Delete this record"
                  aria-label="Delete record"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3h10M5 3V2h4v1M6 6v4M8 6v4M3 3l1 9h6l1-9"
                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
