/**
 * ModelComparisonPanel.jsx – Detailed model evaluation and selection comparison.
 * Optimized for a full-width dashboard methodology section.
 */
import React from 'react';

export default function ModelComparisonPanel() {
  const models = [
    {
      name: 'Random Forest (Selected)',
      auc: '92.2%',
      accuracy: '91.3%',
      tuningSpeed: 'Ultra-Fast (~30-150ms)',
      robustness: 'High (Outlier & Imputation Robust)',
      interpretability: 'High (Feature Importances)',
      selected: true
    },
    {
      name: 'Gradient Boosting (XGBoost)',
      auc: '92.5%',
      accuracy: '91.5%',
      tuningSpeed: 'Slow (~1.5-3.0s)',
      robustness: 'High (Robust to Outliers)',
      interpretability: 'Medium (SHAP Values)',
      selected: false
    },
    {
      name: 'Support Vector Machine (SVM)',
      auc: '86.1%',
      accuracy: '87.8%',
      tuningSpeed: 'Very Slow (>5.0s)',
      robustness: 'Low (Sensitive to Scaling/Outliers)',
      interpretability: 'Low (Black Box)',
      selected: false
    },
    {
      name: 'Logistic Regression',
      auc: '78.4%',
      accuracy: '82.1%',
      tuningSpeed: 'Instant (~5-15ms)',
      robustness: 'Low (Highly Outlier-Sensitive)',
      interpretability: 'High (Coefficients)',
      selected: false
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Intro Context */}
      <div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-3)', lineHeight: 1.5, maxWidth: '800px' }}>
          To assess credit risk alongside country ESG factors, Aetheris Risk benchmarks multiple candidate algorithms. The selected model must handle high-dimensional collinear parameters and remain computationally efficient for real-time interactive user hyperparameter tuning.
        </p>
      </div>

      {/* Model Cards Grid - Horizontal layout on wide screens */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        width: '100%'
      }}>
        {models.map((m) => (
          <div
            key={m.name}
            style={{
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${m.selected ? 'var(--color-ink)' : 'var(--color-border)'}`,
              backgroundColor: m.selected ? 'var(--color-ink)' : 'var(--color-bg-alt)',
              color: m.selected ? 'var(--color-bg)' : 'var(--color-ink)',
              padding: '1rem',
              boxShadow: m.selected ? 'var(--shadow-md)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'var(--transition)',
            }}
          >
            <div>
              {/* Model Name & Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-head)' }}>
                  {m.name}
                </span>
                {m.selected && (
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: '#ffffff', color: '#111111', textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>
                    Selected
                  </span>
                )}
              </div>

              {/* Metrics List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', opacity: m.selected ? 0.9 : 1 }}>
                <div>
                  <span style={{ color: m.selected ? 'rgba(255,255,255,0.65)' : 'var(--color-ink-3)' }}>Test AUC: </span>
                  <strong style={{ fontWeight: 600 }}>{m.auc}</strong>
                </div>
                <div>
                  <span style={{ color: m.selected ? 'rgba(255,255,255,0.65)' : 'var(--color-ink-3)' }}>Accuracy: </span>
                  <strong style={{ fontWeight: 600 }}>{m.accuracy}</strong>
                </div>
                <div>
                  <span style={{ color: m.selected ? 'rgba(255,255,255,0.65)' : 'var(--color-ink-3)' }}>Tuning Latency: </span>
                  <strong style={{ fontWeight: 600 }}>{m.tuningSpeed}</strong>
                </div>
                <div>
                  <span style={{ color: m.selected ? 'rgba(255,255,255,0.65)' : 'var(--color-ink-3)' }}>Outlier Handling: </span>
                  <strong style={{ fontWeight: 600 }}>{m.robustness}</strong>
                </div>
                <div>
                  <span style={{ color: m.selected ? 'rgba(255,255,255,0.65)' : 'var(--color-ink-3)' }}>Explainability: </span>
                  <strong style={{ fontWeight: 600 }}>{m.interpretability}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rationale Breakdown in 2 Columns on wide screens */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginTop: '0.5rem'
      }}>
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-head)' }}>
            Selected Architecture Justification
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-2)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            We chose <strong>Random Forest</strong> because it represents the optimal trade-off between predictive accuracy and real-time execution feasibility.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-2)', lineHeight: 1.5 }}>
            While Gradient Boosting (XGBoost) offers a marginal AUC gain (+0.3%), it introduces significant latency overhead that renders it unsuitable for on-the-fly interactive user tuning. Linear algorithms like Logistic Regression perform poorly due to the complex, non-linear thresholds inherent in financial credit ratios.
          </p>
        </div>
        
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-head)' }}>
            Key Technical Rationale
          </h4>
          <ul style={{ paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--color-ink-2)', display: 'flex', flexDirection: 'column', gap: '0.6rem', lineHeight: 1.45 }}>
            <li>
              <strong>Interactive Tuning:</strong> Runs parallelized training in $\sim 30\text{--}150\text{ ms}$, ensuring instant responsiveness during hyperparameter adjustments.
            </li>
            <li>
              <strong>Outlier Resilience:</strong> Rank-based decision splitting is naturally invariant to extreme income or age values common in real-world credit datasets.
            </li>
            <li>
              <strong>Non-linear Modeling:</strong> Naturally maps threshold-based constraints (e.g. debt-to-income limits) without manual feature engineering.
            </li>
            <li>
              <strong>Variance Control:</strong> The bagging ensemble mechanism averages multiple bootstrap trees, reducing overfitting risks.
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
