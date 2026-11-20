/** Fondo decorativo: césped en perspectiva, líneas del campo y focos del estadio. */
export function PitchBackdrop() {
  return (
    <div className="pitch-backdrop" aria-hidden="true">
      <div className="floodlight floodlight-left" />
      <div className="floodlight floodlight-right" />
      <svg className="pitch-lines" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d3b24" stopOpacity="0" />
            <stop offset="0.45" stopColor="#0f4a2c" stopOpacity="0.55" />
            <stop offset="1" stopColor="#127a45" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g transform="translate(500 600) scale(1 0.42) translate(-500 -600)">
          <rect x="-200" y="0" width="1400" height="600" fill="url(#grass)" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={-200 + i * 175} y="0" width="88" height="600" fill="#ffffff" opacity="0.025" />
          ))}
          <g fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="4">
            <rect x="80" y="40" width="840" height="560" />
            <line x1="80" y1="320" x2="920" y2="320" />
            <circle cx="500" cy="320" r="90" />
            <rect x="300" y="40" width="400" height="120" />
            <rect x="300" y="480" width="400" height="120" />
          </g>
        </g>
      </svg>
      <div className="vignette" />
    </div>
  );
}
