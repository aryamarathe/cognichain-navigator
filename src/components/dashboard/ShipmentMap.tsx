import { useEffect, useState } from "react";

interface ShipmentMapProps {
  rerouted: boolean;
}

// Approx coords (percent of viewbox) — Singapore → LA via Pacific, Seattle alt
const SINGAPORE = { x: 78, y: 56 };
const LA = { x: 20, y: 42 };
const SEATTLE = { x: 19, y: 32 };

export function ShipmentMap({ rerouted }: ShipmentMapProps) {
  const [progress, setProgress] = useState(0.4); // mid-pacific

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 0.95 ? 0.4 : p + 0.005));
    }, 200);
    return () => clearInterval(id);
  }, []);

  const target = rerouted ? SEATTLE : LA;
  const shipX = SINGAPORE.x + (target.x - SINGAPORE.x) * progress;
  const shipY = SINGAPORE.y + (target.y - SINGAPORE.y) * progress - Math.sin(progress * Math.PI) * 8;

  return (
    <div className="glass-card rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Live Shipment Tracking</h3>
          <p className="text-xs text-muted-foreground">SHP-2046 · Pacific Route</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-medium">LIVE</span>
        </div>
      </div>

      <div className="relative aspect-[2/1] rounded-lg overflow-hidden border border-border bg-[oklch(0.12_0.03_230)]">
        <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid */}
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="oklch(0.78 0.18 165 / 0.06)" strokeWidth="0.2" />
            </pattern>
            <linearGradient id="origRoute" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.7 0.16 230)" />
              <stop offset="100%" stopColor="oklch(0.65 0.24 22)" />
            </linearGradient>
            <linearGradient id="newRoute" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.7 0.16 230)" />
              <stop offset="100%" stopColor="oklch(0.78 0.18 165)" />
            </linearGradient>
          </defs>
          <rect width="100" height="60" fill="url(#grid)" />

          {/* Stylized continents */}
          <path d="M 0 25 Q 8 20 18 28 L 22 45 L 12 50 L 0 48 Z" fill="oklch(0.22 0.03 240)" stroke="oklch(0.78 0.18 165 / 0.2)" strokeWidth="0.2" />
          <path d="M 70 35 Q 78 30 88 35 Q 92 45 85 55 L 75 58 L 70 50 Z" fill="oklch(0.22 0.03 240)" stroke="oklch(0.78 0.18 165 / 0.2)" strokeWidth="0.2" />

          {/* Original route (LA) */}
          <path
            d={`M ${SINGAPORE.x} ${SINGAPORE.y} Q 50 30 ${LA.x} ${LA.y}`}
            fill="none"
            stroke="url(#origRoute)"
            strokeWidth="0.4"
            strokeDasharray={rerouted ? "1 1" : "0"}
            opacity={rerouted ? 0.35 : 1}
          />

          {/* Rerouted (Seattle) */}
          {rerouted && (
            <path
              d={`M ${SINGAPORE.x} ${SINGAPORE.y} Q 50 22 ${SEATTLE.x} ${SEATTLE.y}`}
              fill="none"
              stroke="url(#newRoute)"
              strokeWidth="0.5"
              className="animate-fade-in"
            />
          )}

          {/* Origin */}
          <circle cx={SINGAPORE.x} cy={SINGAPORE.y} r="0.9" fill="oklch(0.7 0.16 230)" />
          <circle cx={SINGAPORE.x} cy={SINGAPORE.y} r="2" fill="oklch(0.7 0.16 230 / 0.3)" />
          <text x={SINGAPORE.x + 2} y={SINGAPORE.y + 1} fill="oklch(0.97 0.01 240)" fontSize="2">Singapore</text>

          {/* LA */}
          <circle cx={LA.x} cy={LA.y} r="0.9" fill={rerouted ? "oklch(0.65 0.24 22)" : "oklch(0.78 0.18 165)"} />
          <circle cx={LA.x} cy={LA.y} r="2" fill={rerouted ? "oklch(0.65 0.24 22 / 0.3)" : "oklch(0.78 0.18 165 / 0.3)"}>
            {!rerouted && <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />}
          </circle>
          <text x={LA.x - 8} y={LA.y + 4} fill="oklch(0.97 0.01 240)" fontSize="2">Los Angeles</text>

          {/* Seattle */}
          {rerouted && (
            <>
              <circle cx={SEATTLE.x} cy={SEATTLE.y} r="0.9" fill="oklch(0.78 0.18 165)" />
              <circle cx={SEATTLE.x} cy={SEATTLE.y} r="2" fill="oklch(0.78 0.18 165 / 0.3)">
                <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x={SEATTLE.x - 5} y={SEATTLE.y - 1.5} fill="oklch(0.78 0.18 165)" fontSize="2">Seattle</text>
            </>
          )}

          {/* Ship */}
          <g transform={`translate(${shipX} ${shipY})`}>
            <circle r="2.5" fill="oklch(0.78 0.18 165 / 0.25)">
              <animate attributeName="r" values="2.5;4;2.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text fontSize="3" textAnchor="middle" y="1">🚢</text>
          </g>
        </svg>

        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground font-mono">
          LAT 28.4°N · LON 152.7°W · 18.2 KN
        </div>
      </div>
    </div>
  );
}
