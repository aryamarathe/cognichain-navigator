import { Activity } from "lucide-react";

const events = [
  { t: "12:42:08", msg: "PRIE: Storm cluster forming at 28°N 150°W", level: "warn" },
  { t: "12:41:55", msg: "Inventory: SKU-D203 hit critical threshold", level: "danger" },
  { t: "12:41:31", msg: "Forecast model retrained · accuracy 94.2%", level: "info" },
  { t: "12:40:12", msg: "Shipment SHP-2046 entered Pacific corridor", level: "ok" },
  { t: "12:39:01", msg: "Simulation complete: scenario S-14 viable", level: "ok" },
  { t: "12:37:44", msg: "Carrier Maersk: capacity adjusted +8%", level: "info" },
];

const colorMap = {
  warn: "text-warning",
  danger: "text-destructive",
  info: "text-secondary",
  ok: "text-success",
} as const;

export function ActivityFeed() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Real-Time Activity</h3>
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
      </div>
      <div className="space-y-1.5 font-mono text-xs">
        {events.map((e, i) => (
          <div key={i} className="flex gap-3 py-1 border-b border-border/40 last:border-0">
            <span className="text-muted-foreground">{e.t}</span>
            <span className={`${colorMap[e.level as keyof typeof colorMap]} flex-1`}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
