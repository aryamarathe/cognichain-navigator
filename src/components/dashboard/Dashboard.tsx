import { useEffect, useState } from "react";
import { Truck, DollarSign, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { StatCard } from "./StatCard";
import { ShipmentMap } from "./ShipmentMap";
import { DisruptionPanel } from "./DisruptionPanel";
import { ForecastChart } from "./ForecastChart";
import { InventoryPanel } from "./InventoryPanel";
import { ActivityFeed } from "./ActivityFeed";
import { useShipmentSimulation } from "@/hooks/useShipmentSimulation";

export function Dashboard() {
  const [rerouted, setRerouted] = useState(false);
  const { state, alerts } = useShipmentSimulation(rerouted);
  const [clock, setClock] = useState("");
  useEffect(() => {
    const update = () => setClock(new Date().toUTCString().slice(17, 25));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const atRisk = state.status === "at-risk" || state.status === "delayed" ? 1 : 0;

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-50 bg-background/70">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">CogniChain</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Decision Intelligence Suite</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {["Overview", "Logistics", "Inventory", "Forecast", "Simulation"].map((n, i) => (
              <button key={n} className={`px-3 py-1.5 rounded-md transition-colors ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
                {n}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Title */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Unified Command Dashboard</h2>
            <p className="text-sm text-muted-foreground">Real-time visibility across logistics, inventory & AI forecasting</p>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            UTC <span suppressHydrationWarning>{clock || "--:--:--"}</span> · 4 active shipments · {atRisk + 1} advisory
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Shipments" value="247" delta="+12 today" trend="up" icon={Truck} accent="primary" />
          <StatCard label="Logistics Cost (MTD)" value="$1.84M" delta="-8.2% vs forecast" trend="up" icon={DollarSign} accent="secondary" />
          <StatCard label="On-Time Performance" value="96.4%" delta="+1.8 pts" trend="up" icon={Gauge} accent="primary" />
          <StatCard
            label="At-Risk Shipments"
            value={String(2 + atRisk)}
            delta={`Risk score ${state.riskScore}`}
            trend={state.riskScore > 50 ? "down" : "up"}
            icon={ShieldAlert}
            accent="warning"
          />
        </div>

        {/* Map + Disruption */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><ShipmentMap state={state} /></div>
          <div><DisruptionPanel onReroute={setRerouted} /></div>
        </div>

        {/* Forecast + Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ForecastChart />
          <InventoryPanel />
        </div>

        {/* Activity */}
        <ActivityFeed alerts={alerts} />

        <footer className="text-center text-[10px] text-muted-foreground py-4 uppercase tracking-widest">
          CogniChain · Decision Intelligence Engine · v2.0
        </footer>
      </main>
    </div>
  );
}
