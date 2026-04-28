import type { ShipmentState } from "@/hooks/useShipmentSimulation";

interface ShipmentMapProps {
  state: ShipmentState;
}

export function ShipmentMap({ state }: ShipmentMapProps) {
  const { checkpoints, progress, rerouted, status, speed } = state;

  // Interpolate ship position along checkpoint polyline
  const segCount = checkpoints.length - 1;
  const segPos = progress * segCount;
  const segIdx = Math.min(Math.floor(segPos), segCount - 1);
  const segT = segPos - segIdx;
  const a = checkpoints[segIdx];
  const b = checkpoints[segIdx + 1];
  const shipX = a.x + (b.x - a.x) * segT;
  const shipY = a.y + (b.y - a.y) * segT - Math.sin(segT * Math.PI) * 3;

  const pathD = checkpoints
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const statusColor =
    status === "at-risk" || status === "delayed"
      ? "text-warning"
      : status === "rerouted"
      ? "text-secondary"
      : status === "delivered"
      ? "text-success"
      : "text-success";

  return (
    <div className="glass-card rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Live Shipment Tracking</h3>
          <p className="text-xs text-muted-foreground">{state.id} · Pacific Route</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`uppercase font-bold tracking-wider ${statusColor}`}>{status}</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-success font-medium">LIVE</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-[2/1] rounded-lg overflow-hidden border border-border bg-[oklch(0.12_0.03_230)]">
        <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="oklch(0.78 0.18 165 / 0.06)" strokeWidth="0.2" />
            </pattern>
            <linearGradient id="route" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.7 0.16 230)" />
              <stop offset="100%" stopColor={rerouted ? "oklch(0.78 0.18 165)" : "oklch(0.65 0.24 22)"} />
            </linearGradient>
          </defs>
          <rect width="100" height="60" fill="url(#grid)" />

          {/* Stylized continents */}
          <path d="M 0 25 Q 8 20 18 28 L 22 45 L 12 50 L 0 48 Z" fill="oklch(0.22 0.03 240)" stroke="oklch(0.78 0.18 165 / 0.2)" strokeWidth="0.2" />
          <path d="M 70 35 Q 78 30 88 35 Q 92 45 85 55 L 75 58 L 70 50 Z" fill="oklch(0.22 0.03 240)" stroke="oklch(0.78 0.18 165 / 0.2)" strokeWidth="0.2" />

          {/* Route polyline through checkpoints */}
          <path d={pathD} fill="none" stroke="url(#route)" strokeWidth="0.5" strokeLinejoin="round" />

          {/* Checkpoints */}
          {checkpoints.map((c, i) => (
            <g key={c.name}>
              <circle
                cx={c.x}
                cy={c.y}
                r={i === checkpoints.length - 1 ? 1.2 : 0.7}
                fill={c.reached ? "oklch(0.78 0.18 165)" : "oklch(0.5 0.05 240)"}
              />
              {c.reached && (
                <circle cx={c.x} cy={c.y} r="1.6" fill="oklch(0.78 0.18 165 / 0.25)">
                  <animate attributeName="r" values="1.6;2.6;1.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={c.x + 1.5}
                y={c.y - 1.2}
                fill={c.reached ? "oklch(0.97 0.01 240)" : "oklch(0.6 0.02 240)"}
                fontSize="1.7"
              >
                {c.name}
              </text>
            </g>
          ))}

          {/* Ship */}
          <g transform={`translate(${shipX} ${shipY})`}>
            <circle r="2.5" fill="oklch(0.78 0.18 165 / 0.3)">
              <animate attributeName="r" values="2.5;4;2.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text fontSize="3" textAnchor="middle" y="1">🚢</text>
          </g>
        </svg>

        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground font-mono">
          PROGRESS {(progress * 100).toFixed(1)}% · {speed.toFixed(1)} KN · ETA {state.etaDays}d
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] font-mono">
          <span className="text-muted-foreground">RISK </span>
          <span className={state.riskScore > 65 ? "text-destructive" : state.riskScore > 40 ? "text-warning" : "text-success"}>
            {state.riskScore}
          </span>
          <span className="text-muted-foreground"> · CONG </span>
          <span className={state.congestion === "HIGH" ? "text-destructive" : state.congestion === "MED" ? "text-warning" : "text-success"}>
            {state.congestion}
          </span>
        </div>
      </div>
    </div>
  );
}
