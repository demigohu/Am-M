/** Illustrative diagram from stitch-export/am_m_home — not live data */
export function RebalanceDiagram() {
  return (
    <svg className="h-auto w-full" fill="none" viewBox="0 0 460 250" xmlns="http://www.w3.org/2000/svg">
      <line stroke="#000000" strokeDasharray="2 4" strokeOpacity="0.3" strokeWidth="0.75" x1="20" x2="440" y1="30" y2="30" />
      <line stroke="#000000" strokeDasharray="2 4" strokeOpacity="0.3" strokeWidth="0.75" x1="20" x2="440" y1="125" y2="125" />
      <line stroke="#000000" strokeDasharray="2 4" strokeOpacity="0.3" strokeWidth="0.75" x1="20" x2="440" y1="210" y2="210" />
      <rect fill="#fff6d2" height="52" stroke="#000000" strokeDasharray="4 3" strokeWidth="1.5" width="130" x="35" y="45" />
      <text fill="#c23b30" fontFamily="var(--font-mono)" fontSize="9" fontWeight="600" x="45" y="65">
        [RANGE EXPIRED]
      </text>
      <text fill="#000000" fontFamily="var(--font-mono)" fontSize="10" x="45" y="84">
        540.00 – 570.00
      </text>
      <path d="M 165 71 C 210 71, 215 150, 270 150" stroke="#000000" strokeDasharray="3 3" strokeWidth="1.75" />
      <circle cx="218" cy="110" fill="#000000" r="4.5" />
      <text fill="#000000" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" x="180" y="102">
        EXEC_CALL()
      </text>
      <rect fill="#fff6d2" height="68" stroke="#000000" strokeWidth="2" width="165" x="270" y="125" />
      <rect fill="#000000" height="18" width="165" x="270" y="125" />
      <text fill="#ffffff" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" x="278" y="138">
        REBALANCED IN-RANGE
      </text>
      <text fill="#000000" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" x="278" y="160">
        [min 580.00]
      </text>
      <text fill="#000000" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" x="360" y="160">
        [max 620.00]
      </text>
      <text fill="#1f8a5f" fontFamily="var(--font-sans)" fontSize="10" fontWeight="700" x="278" y="178">
        • ACTIVE TICK ACCRUAL (100%)
      </text>
      <line stroke="#000000" strokeWidth="1.5" x1="335" x2="335" y1="110" y2="205" />
      <circle cx="335" cy="155" fill="#000000" r="5" stroke="#ffd801" strokeWidth="2" />
      <text fill="#000000" fontFamily="var(--font-mono)" fontSize="10" fontWeight="700" x="305" y="222">
        SPOT: 602.40
      </text>
    </svg>
  );
}
