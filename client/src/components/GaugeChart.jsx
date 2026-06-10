/**
 * GaugeChart.jsx – Animated SVG semicircle gauge using GSAP.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const RADIUS  = 80;
const CX      = 100;
const CY      = 100;
const ARC_LEN = Math.PI * RADIUS; // ≈ 251.3

export default function GaugeChart({ value = 0, riskClass = 'risk-low' }) {
  const fillRef   = useRef(null);
  const numRef    = useRef(null);
  const countObj  = useRef({ val: 0 });

  useEffect(() => {
    const target = Math.max(0, Math.min(1, value));
    const dashOffset = ARC_LEN * (1 - target);

    // Animate the arc stroke
    gsap.to(fillRef.current, {
      strokeDashoffset: dashOffset,
      duration: 1.4,
      ease: 'power3.out',
    });

    // Animate the number display
    gsap.to(countObj.current, {
      val: Math.round(target * 100),
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.textContent = Math.round(countObj.current.val);
        }
      },
    });
  }, [value]);

  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" viewBox="0 0 200 110">
        {/* Track arc */}
        <path
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth="16"
          strokeLinecap="round"
          d={`M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`}
        />
        {/* Fill arc */}
        <path
          ref={fillRef}
          className={`gauge-fill ${riskClass}`}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={ARC_LEN}
          d={`M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`}
        />
      </svg>
      <div className="gauge-center">
        <span ref={numRef} className={`gauge-value ${riskClass}`}>0</span>
        <div className="gauge-sub">Risk Score</div>
      </div>
    </div>
  );
}
