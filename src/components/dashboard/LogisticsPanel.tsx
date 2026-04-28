import { useState } from "react";
import { Truck, Ship, Plane, Package, MapPin, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ShipmentState } from "@/hooks/useShipmentSimulation";

type Mode = "sea" | "air" | "road";
type Status = "in-transit" | "at-risk" | "delayed" | "delivered" | "loading";

interface Shipment {
  id: string;
  mode: Mode;
  origin: string;
  destination: string;
  cargo: string;
  status: Status;
  progress: number; // 0-100
  etaHours: number;
  carrier: string;
}

const seed: Shipment[] = [
  { id: "SH-10241", mode: "sea", origin: "Singapore", destination: "Los Angeles", cargo: "Electronics · 1,240 units", status: "in-transit", progress: 62, etaHours: 84, carrier: "Maersk Line" },
  { id: "SH-10242", mode: "air", origin: "Frankfurt", destination: "New York", cargo: "Pharma · 480 kg", status: "in-transit", progress: 38, etaHours: 11, carrier: "Lufthansa Cargo" },
  { id: "SH-10243", mode: "road", origin: "Chicago", destination: "Dallas", cargo: "Auto Parts · 18 pallets", status: "delayed", progress: 71, etaHours: 9, carrier: "FedEx Freight" },
  { id: "SH-10244", mode: "sea", origin: "Shanghai", destination: "Rotterdam", cargo: "Apparel · 2,100 units", status: "at-risk", progress: 45, etaHours: 192, carrier: "COSCO" },
  { id: "SH-10245", mode: "road", origin: "Mumbai", destination: "Delhi", cargo: "FMCG · 32 pallets", status: "delivered", progress: 100, etaHours: 0, carrier: "DHL Supply" },
  { id: "SH-10246", mode: "air", origin: "Tokyo", destination: "San Francisco", cargo: "Semiconductors · 90 kg", status: "loading", progress: 5, etaHours: 14, carrier: "ANA Cargo" },
];

const modeIcon = { sea: Ship, air: Plane, road: Truck } as const;

const statusStyles: Record<Status, { dot: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  "in-transit": { dot: "bg-primary", text: "text-primary", label: "In Transit", icon: Truck },
  "at-risk":    { dot: "bg-warning", text: "text-warning", label: "At Risk", icon: AlertTriangle },
  "delayed":    { dot: "bg-destructive", text: "text-destructive", label: "Delayed", icon: Clock },
  "delivered":  { dot: "bg-success", text: "text-success", label: "Delivered", icon: CheckCircle2 },
  "loading":    { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Loading", icon: Package },
};

export function LogisticsPanel({ liveState }: { liveState: ShipmentState }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [selected, setSelected] = useState<string>(seed[0].id);

  // Bind first shipment to the live simulation so the table reflects real-time data
  const shipments: Shipment[] = seed.map((s, i) =>
    i === 0
      ? { ...s, status: liveState.status as Status, progress: Math.round(liveState.progress * 100), etaHours: Math.round(liveState.etaHours) }
      : s
  );

  const filtered = filter === "all" ? shipments : shipments.filter((s) => s.status === filter);
  const active = shipments.find((s) => s.id === selected) ?? shipments[0];

  const counts = {
    all: shipments.length,
    "in-transit": shipments.filter((s) => s.status === "in-transit").length,
    "at-risk": shipments.filter((s) => s.status === "at-risk").length,
    "delayed": shipments.filter((s) => s.status === "delayed").length,
    "delivered": shipments.filter((s) => s.status === "delivered").length,
    "loading": shipments.filter((s) => s.status === "loading").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Logistics Operations</h2>
          <p className="text-sm text-muted-foreground">Live tracking of {shipments.length} shipments across sea, air & road</p>
        </div>
        <div className="flex items-center gap-1 text-xs flex-wrap">
          {(["all", "in-transit", "at-risk", "delayed", "delivered", "loading"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                filter === k ? "bg-primary/15 border-primary/40 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "all" ? "All" : statusStyles[k].label} <span className="opacity-60">({counts[k]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 text-xs uppercase tracking-widest text-muted-foreground">Shipment Register</div>
          <div className="divide-y divide-border/40">
            {filtered.map((s) => {
              const Icon = modeIcon[s.mode];
              const st = statusStyles[s.status];
              const isActive = s.id === active.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`w-full text-left px-4 py-3 grid grid-cols-12 gap-3 items-center transition-colors hover:bg-muted/30 ${isActive ? "bg-primary/5" : ""}`}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-muted/40 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-foreground/80" />
                    </div>
                    <div>
                      <div className="text-sm font-mono">{s.id}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{s.mode}</div>
                    </div>
                  </div>
                  <div className="col-span-4 text-xs">
                    <div className="flex items-center gap-1 text-foreground/90"><MapPin className="h-3 w-3" />{s.origin} → {s.destination}</div>
                    <div className="text-muted-foreground mt-0.5 truncate">{s.cargo}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className={`h-full ${st.dot}`} style={{ width: `${s.progress}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{s.progress}% complete</div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${st.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">ETA {s.etaHours}h</div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No shipments match this filter.</div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Shipment Detail</div>
          <div>
            <div className="text-lg font-bold font-mono">{active.id}</div>
            <div className="text-xs text-muted-foreground">{active.carrier}</div>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Origin" value={active.origin} />
            <Row label="Destination" value={active.destination} />
            <Row label="Cargo" value={active.cargo} />
            <Row label="Mode" value={active.mode.toUpperCase()} />
            <Row label="ETA" value={`${active.etaHours} hours`} />
            <Row label="Progress" value={`${active.progress}%`} />
          </div>
          <div className="pt-3 border-t border-border/60">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Status</div>
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/40 ${statusStyles[active.status].text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[active.status].dot}`} />
              <span className="text-xs font-medium">{statusStyles[active.status].label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-foreground/90 text-right">{value}</span>
    </div>
  );
}
