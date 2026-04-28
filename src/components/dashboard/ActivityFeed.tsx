import { Activity } from "lucide-react";
import type { SimAlert } from "@/hooks/useShipmentSimulation";

const SEED: SimAlert[] = [
  { id: "s1", t: "12:41:31", msg: "Forecast model retrained · accuracy 94.2%", level: "info" },
  { id: "s2", t: "12:40:12", msg: "Shipment SHP-2046 entered Pacific corridor", level: "ok" },
  { id: "s3", t: "12:39:01", msg: "Simulation complete: scenario S-14 viable", level: "ok" },
  { id: "s4", t: "12:37:44", msg: "Carrier Maersk: capacity adjusted +8%", level: "info" },
];

const colorMap = {
  warn: "text-warning",
  danger: "text-destructive",
  info: "text-secondary",
  ok: "text-success",
} as const;

export function ActivityFeed({ alerts = [] }: { alerts?: SimAlert[] }) {
  const events = [...alerts, ...SEED].slice(0, 14);
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Event Stream · Real-Time Alerts
        </h3>
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
      </div>
      <div className="space-y-1.5 font-mono text-xs max-h-72 overflow-y-auto">
        {events.map((e) => (
          <div key={e.id} className="flex gap-3 py-1 border-b border-border/40 last:border-0">
            <span className="text-muted-foreground">{e.t}</span>
            <span className={`${colorMap[e.level]} flex-1`}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
