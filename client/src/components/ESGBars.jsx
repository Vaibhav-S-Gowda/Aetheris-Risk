/**
 * ESGBars.jsx – Animated horizontal bars for ESG indicator breakdown.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const INDICATORS = [
  { key: 'renewable_energy',    label: 'Renewable Energy (%)',    positive: true,  max: 100 },
  { key: 'access_electricity',  label: 'Electricity Access (%)',  positive: true,  max: 100 },
  { key: 'corruption_control',  label: 'Corruption Control',      positive: true,  max: 2.5, min: -2.5 },
  { key: 'political_stability', label: 'Political Stability',     positive: true,  max: 2.5, min: -2.5 },
  { key: 'rule_of_law',         label: 'Rule of Law',             positive: true,  max: 2.5, min: -2.5 },
  { key: 'forest_area',         label: 'Forest Area (%)',         positive: true,  max: 100 },
  { key: 'fossil_fuel',         label: 'Fossil Fuel Use (%)',     positive: false, max: 100 },
  { key: 'ghg_per_capita',      label: 'GHG per Capita (t CO2e)', positive: false, max: 50 },
  { key: 'unemployment',        label: 'Unemployment (%)',        positive: false, max: 40 },
  { key: 'pm25',                label: 'PM2.5 Pollution',         positive: false, max: 100 },
];

export default function ESGBars({ esgDetails = {} }) {
  const barsRef = useRef([]);

  useEffect(() => {
    barsRef.current.forEach((el, i) => {
      if (!el) return;
      const ind = INDICATORS[i];
      const raw = esgDetails[ind.key] || 0;
      const min = ind.min || 0;
      const pct = Math.min(100, Math.max(0, ((raw - min) / (ind.max - min)) * 100));

      gsap.fromTo(el,
        { width: '0%' },
        { width: `${pct}%`, duration: 1.1 + i * 0.07, ease: 'power3.out', delay: 0.05 * i }
      );
    });
  }, [esgDetails]);

  return (
    <div className="score-bars">
      {INDICATORS.map((ind, i) => {
        const raw = esgDetails[ind.key];
        const displayVal = raw != null ? raw.toFixed(1) : '–';
        return (
          <div className="score-bar-row" key={ind.key}>
            <div className="score-bar-header">
              <span className="score-bar-label">{ind.label}</span>
              <span className="score-bar-value">{displayVal}</span>
            </div>
            <div className="score-bar-track">
              <div
                ref={el => (barsRef.current[i] = el)}
                className={`score-bar-fill ${ind.positive ? 'positive' : 'negative'}`}
                style={{ width: '0%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
