import type { ShipmentState } from "@/hooks/useShipmentSimulation";
import { Navigation, Gauge, Clock, MapPin, ShieldAlert } from "lucide-react";

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

  // Build separate paths: completed (solid) and remaining (dashed)
  // Completed = from origin through all reached checkpoints up to ship position
  const completedPts: { x: number; y: number }[] = [];
  for (let i = 0; i <= segIdx; i++) completedPts.push({ x: checkpoints[i].x, y: checkpoints[i].y });
  completedPts.push({ x: shipX, y: shipY });

  const remainingPts: { x: number; y: number }[] = [{ x: shipX, y: shipY }];
  for (let i = segIdx + 1; i < checkpoints.length; i++) {
    remainingPts.push({ x: checkpoints[i].x, y: checkpoints[i].y });
  }

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  const completedPath = toPath(completedPts);
  const remainingPath = toPath(remainingPts);

  // Risk-based segment color for remaining route
  const remainingColor =
    state.riskScore > 65
      ? "oklch(0.65 0.24 22)" // red
      : state.riskScore > 40
      ? "oklch(0.78 0.18 75)" // yellow/amber
      : "oklch(0.78 0.18 165)"; // green

  const statusLabel =
    status === "at-risk" || status === "delayed"
      ? "DELAY RISK"
      : status === "rerouted"
      ? "REROUTED"
      : status === "delivered"
      ? "DELIVERED"
      : "ON TRACK";

  const statusTone =
    status === "at-risk" || status === "delayed"
      ? "text-destructive bg-destructive/10 border-destructive/30"
      : status === "rerouted"
      ? "text-secondary bg-secondary/10 border-secondary/30"
      : "text-success bg-success/10 border-success/30";

  const currentLocation = checkpoints[segIdx]?.name ?? "—";
  const nextLocation = checkpoints[Math.min(segIdx + 1, checkpoints.length - 1)]?.name ?? "—";

  return (
    <div className="glass-card rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Live Shipment Tracking</h3>
          <p className="text-xs text-muted-foreground">{state.id} · {rerouted ? "Seattle Corridor" : "Pacific Route"}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusTone}`}>{statusLabel}</span>
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
          </defs>
          <rect width="100" height="60" fill="url(#grid)" />

          {/* Stylized continents */}
          <path d="M 0 25 Q 8 20 18 28 L 22 45 L 12 50 L 0 48 Z" fill="oklch(0.22 0.03 240)" stroke="oklch(0.78 0.18 165 / 0.2)" strokeWidth="0.2" />
          <path d="M 70 35 Q 78 30 88 35 Q 92 45 85 55 L 75 58 L 70 50 Z" fill="oklch(0.22 0.03 240)" stroke="oklch(0.78 0.18 165 / 0.2)" strokeWidth="0.2" />

          {/* Completed path — solid */}
          <path d={completedPath} fill="none" stroke="oklch(0.78 0.18 165)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />

          {/* Remaining path — dashed, risk-colored */}
          <path d={remainingPath} fill="none" stroke={remainingColor} strokeWidth="0.5" strokeDasharray="1.4 1" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />

          {/* Risk badge on remaining segment midpoint when high */}
          {state.riskScore > 40 && remainingPts.length >= 2 && (() => {
            const mid = remainingPts[Math.floor(remainingPts.length / 2)];
            return (
              <g transform={`translate(${mid.x} ${mid.y - 3})`}>
                <circle r="1.6" fill={remainingColor} opacity="0.25">
                  <animate attributeName="r" values="1.6;2.8;1.6" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle r="1" fill={remainingColor} />
              </g>
            );
          })()}

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

          {/* Ship — smooth transition between coords */}
          <g
            style={{ transition: "transform 1.8s cubic-bezier(0.4,0,0.2,1)" }}
            transform={`translate(${shipX} ${shipY})`}
          >
            <circle r="2.5" fill="oklch(0.78 0.18 165 / 0.3)">
              <animate attributeName="r" values="2.5;4;2.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text fontSize="3" textAnchor="middle" y="1">🚢</text>
          </g>
        </svg>

        {/* Risk legend */}
        <div className="absolute top-2 left-2 flex items-center gap-2 text-[9px] font-mono bg-background/60 backdrop-blur px-2 py-1 rounded border border-border/50">
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-success" />Safe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5" style={{ background: "oklch(0.78 0.18 75)" }} />Med</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-destructive" />High</span>
        </div>
      </div>

      {/* Live Status Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="glass-card rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Current</p>
          <p className="text-sm font-semibold mt-1 truncate">{currentLocation}</p>
          <p className="text-[10px] text-muted-foreground truncate">→ {nextLocation}</p>
        </div>
        <div className="glass-card rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> ETA</p>
          <p className="text-sm font-semibold mt-1">{state.etaDays}d</p>
          <p className="text-[10px] text-muted-foreground">{(progress * 100).toFixed(1)}% complete</p>
        </div>
        <div className="glass-card rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> Speed</p>
          <p className="text-sm font-semibold mt-1">{state.speed.toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">kn</span></p>
          <p className="text-[10px] text-muted-foreground">Cong: <span className={state.congestion === "HIGH" ? "text-destructive" : state.congestion === "MED" ? "text-warning" : "text-success"}>{state.congestion}</span></p>
        </div>
        <div className="glass-card rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Risk</p>
          <p className={`text-sm font-semibold mt-1 ${state.riskScore > 65 ? "text-destructive" : state.riskScore > 40 ? "text-warning" : "text-success"}`}>
            {state.riskScore} <span className="text-[10px] font-normal text-muted-foreground">/100</span>
          </p>
          <p className="text-[10px] text-muted-foreground">{state.riskScore > 65 ? "High" : state.riskScore > 40 ? "Medium" : "Safe"}</p>
        </div>
      </div>
    </div>
  );
}
