import type { WatchConfig } from '../types/watch';

interface WatchPreviewProps {
  config: WatchConfig;
}

export default function WatchPreview({ config }: WatchPreviewProps) {
  const { mecanismo, esfera, caja } = config;

  const cajaColor = caja?.color ?? '#3a3a3a';
  const esferaColor = esfera?.color ?? '#1a1a1a';
  const accentColor = esfera?.accentColor ?? '#c9a84c';
  const outerRingColor = caja?.color ?? '#555555';

  const totalPrice = (mecanismo?.price ?? 0) + (esfera?.price ?? 0) + (caja?.price ?? 0);
  const hasAny = mecanismo || esfera || caja;

  // Generate hour marker positions
  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const innerR = 100;
    const outerR = i % 3 === 0 ? 112 : 108;
    return {
      x1: 140 + innerR * Math.cos(angle),
      y1: 140 + innerR * Math.sin(angle),
      x2: 140 + outerR * Math.cos(angle),
      y2: 140 + outerR * Math.sin(angle),
      isMajor: i % 3 === 0,
    };
  });

  return (
    <div className="watch-preview-container">
      <div className="watch-preview-title">Vista Previa</div>

      <div className="watch-svg-wrapper">
        <svg
          viewBox="0 0 280 280"
          width="280"
          height="280"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Vista previa del reloj configurado"
        >
          <defs>
            {/* Lug/strap gradient */}
            <linearGradient id="lugGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={outerRingColor} stopOpacity="0.6" />
              <stop offset="50%" stopColor={outerRingColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={outerRingColor} stopOpacity="0.6" />
            </linearGradient>

            {/* Case gradient */}
            <radialGradient id="caseGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="60%" stopColor={cajaColor} stopOpacity="1" />
              <stop offset="100%" stopColor={cajaColor} stopOpacity="0.8" />
            </radialGradient>

            {/* Dial gradient */}
            <radialGradient id="dialGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
              <stop offset="50%" stopColor={esferaColor} stopOpacity="1" />
              <stop offset="100%" stopColor={esferaColor} stopOpacity="0.9" />
            </radialGradient>

            {/* Glass reflection */}
            <radialGradient id="glassReflect" cx="35%" cy="25%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            {/* Seconds hand animation */}
            <style>{`
              @keyframes rotateSeconds {
                from { transform: rotate(0deg); transform-origin: 140px 140px; }
                to   { transform: rotate(360deg); transform-origin: 140px 140px; }
              }
              .seconds-hand {
                animation: rotateSeconds 60s linear infinite;
                transform-origin: 140px 140px;
              }
            `}</style>
          </defs>

          {/* Top lug */}
          <rect x="120" y="30" width="40" height="30" rx="6" fill="url(#lugGrad)" />
          {/* Bottom lug */}
          <rect x="120" y="220" width="40" height="30" rx="6" fill="url(#lugGrad)" />

          {/* Crown */}
          <rect x="236" y="128" width="18" height="24" rx="4" fill={cajaColor} stroke={accentColor} strokeWidth="1" />

          {/* Outer case bezel */}
          <circle cx="140" cy="140" r="118" fill={cajaColor} stroke={accentColor} strokeWidth="1.5" />

          {/* Case body */}
          <circle cx="140" cy="140" r="110" fill="url(#caseGrad)" />

          {/* Bezel inner ring */}
          <circle cx="140" cy="140" r="108" fill="none" stroke={accentColor} strokeWidth="1" strokeOpacity="0.5" />
          <circle cx="140" cy="140" r="104" fill="none" stroke={accentColor} strokeWidth="0.5" strokeOpacity="0.3" />

          {/* Bezel minute markers (60 ticks) */}
          {Array.from({ length: 60 }, (_, i) => {
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const isHour = i % 5 === 0;
            const r1 = isHour ? 99 : 101;
            const r2 = 105;
            return (
              <line
                key={i}
                x1={140 + r1 * Math.cos(angle)}
                y1={140 + r1 * Math.sin(angle)}
                x2={140 + r2 * Math.cos(angle)}
                y2={140 + r2 * Math.sin(angle)}
                stroke={accentColor}
                strokeWidth={isHour ? 1.5 : 0.5}
                strokeOpacity={isHour ? 0.8 : 0.4}
              />
            );
          })}

          {/* Dial face */}
          <circle cx="140" cy="140" r="96" fill="url(#dialGrad)" />

          {/* Hour index marks */}
          {hourMarkers.map((m, i) => (
            <line
              key={i}
              x1={m.x1}
              y1={m.y1}
              x2={m.x2}
              y2={m.y2}
              stroke={accentColor}
              strokeWidth={m.isMajor ? 3 : 1.5}
              strokeLinecap="round"
            />
          ))}

          {/* Brand text */}
          <text
            x="140"
            y="118"
            textAnchor="middle"
            fill={accentColor}
            fontSize="10"
            fontFamily="Georgia, serif"
            fontWeight="bold"
            letterSpacing="3"
          >
            SEIKO
          </text>
          <text
            x="140"
            y="132"
            textAnchor="middle"
            fill={accentColor}
            fontSize="7"
            fontFamily="Georgia, serif"
            letterSpacing="2"
            fillOpacity="0.7"
          >
            MOD STUDIO
          </text>

          {/* Automatic text */}
          {mecanismo && (
            <text
              x="140"
              y="165"
              textAnchor="middle"
              fill={accentColor}
              fontSize="6"
              fontFamily="Georgia, serif"
              letterSpacing="1.5"
              fillOpacity="0.6"
            >
              AUTOMATIC
            </text>
          )}

          {/* Date window (only if mecanismo has date) */}
          {mecanismo && (mecanismo.id === 'nh35' || mecanismo.id === 'nh36' || mecanismo.id === '4r36' || mecanismo.id === '6r35') && (
            <g transform="translate(175, 134)">
              <rect x="-9" y="-7" width="18" height="14" rx="2" fill="#f0f0e8" stroke={accentColor} strokeWidth="0.8" />
              <text x="0" y="4" textAnchor="middle" fill="#222" fontSize="7" fontFamily="Arial, sans-serif" fontWeight="bold">14</text>
            </g>
          )}

          {/* Hour hand */}
          <g style={{ transformOrigin: '140px 140px', transform: 'rotate(0deg)' }}>
            <rect
              x="137.5"
              y="85"
              width="5"
              height="60"
              rx="2.5"
              fill={accentColor}
              fillOpacity="0.95"
            />
          </g>

          {/* Minute hand */}
          <g style={{ transformOrigin: '140px 140px', transform: 'rotate(45deg)' }}>
            <rect
              x="138.5"
              y="68"
              width="3"
              height="76"
              rx="1.5"
              fill="#f0f0f0"
              fillOpacity="0.9"
            />
          </g>

          {/* Seconds hand (animated) */}
          <g className="seconds-hand">
            {/* Counter-balance tail */}
            <rect x="139.2" y="148" width="1.6" height="18" rx="0.8" fill="#e74c3c" />
            {/* Main seconds hand */}
            <rect x="139.2" y="62" width="1.6" height="80" rx="0.8" fill="#e74c3c" />
          </g>

          {/* Center cap */}
          <circle cx="140" cy="140" r="5" fill={accentColor} />
          <circle cx="140" cy="140" r="3" fill="#222" />
          <circle cx="140" cy="140" r="1.5" fill={accentColor} />

          {/* Glass reflection overlay */}
          <circle cx="140" cy="140" r="96" fill="url(#glassReflect)" />

          {/* Crystal edge highlight */}
          <circle cx="140" cy="140" r="96" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.15" />

          {/* Empty state message */}
          {!hasAny && (
            <text
              x="140"
              y="196"
              textAnchor="middle"
              fill={accentColor}
              fontSize="8"
              fontFamily="Georgia, serif"
              fillOpacity="0.5"
              letterSpacing="0.5"
            >
              Configura tu reloj
            </text>
          )}
        </svg>
      </div>

      {/* Price display */}
      <div className="preview-price">
        {hasAny ? (
          <>
            <span className="preview-price-label">Total configuración</span>
            <span className="preview-price-amount">€{totalPrice}</span>
          </>
        ) : (
          <span className="preview-price-label">Selecciona los componentes</span>
        )}
      </div>

      {/* Parts summary */}
      <div className="preview-parts">
        <div className={`preview-part-item ${mecanismo ? 'preview-part-item--selected' : ''}`}>
          <span className="preview-part-dot" style={{ background: mecanismo ? mecanismo.color : 'var(--text-muted)' }} />
          <span className="preview-part-label">{mecanismo?.name ?? 'Sin mecanismo'}</span>
          {mecanismo && <span className="preview-part-price">€{mecanismo.price}</span>}
        </div>
        <div className={`preview-part-item ${esfera ? 'preview-part-item--selected' : ''}`}>
          <span className="preview-part-dot" style={{ background: esfera ? (esfera.accentColor ?? esfera.color) : 'var(--text-muted)' }} />
          <span className="preview-part-label">{esfera?.name ?? 'Sin esfera'}</span>
          {esfera && <span className="preview-part-price">€{esfera.price}</span>}
        </div>
        <div className={`preview-part-item ${caja ? 'preview-part-item--selected' : ''}`}>
          <span className="preview-part-dot" style={{ background: caja ? caja.color : 'var(--text-muted)' }} />
          <span className="preview-part-label">{caja?.name ?? 'Sin caja'}</span>
          {caja && <span className="preview-part-price">€{caja.price}</span>}
        </div>
      </div>
    </div>
  );
}
