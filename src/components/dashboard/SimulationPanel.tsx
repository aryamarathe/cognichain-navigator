import { useMemo, useState } from "react";
import { FlaskConical, TrendingUp, Clock, Route, Brain, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScenarioId = "demand_spike" | "supply_delay" | "route_disruption";

const SCENARIOS: { id: ScenarioId; label: string; desc: string; icon: typeof TrendingUp }[] = [
  { id: "demand_spike",     label: "Demand spike +20%",      desc: "Sudden increase in customer orders",         icon: TrendingUp },
  { id: "supply_delay",     label: "Supply delay +3 days",   desc: "Supplier lead time extends by 3 days",       icon: Clock },
  { id: "route_disruption", label: "Route disruption",       desc: "Primary shipping lane becomes unviable",     icon: Route },
];

// Baseline state of the supply chain
const BASELINE = {
  inventoryDays: 22,
  deliveryDays: 18,
  cost: 1_840_000,
  serviceLevel: 96.4,
  stockoutRisk: 8,
};

function simulate(id: ScenarioId) {
  switch (id) {
    case "demand_spike":
      return {
        inventoryDays: 14,
        deliveryDays: 18,
        cost: 2_010_000,
        serviceLevel: 91.0,
        stockoutRisk: 32,
        impact: "Stock shortage projected in 5 days",
        recommendation: "Increase stock by 15% across critical SKUs and expedite next replenishment order.",
      };
    case "supply_delay":
      return {
        inventoryDays: 19,
        deliveryDays: 21,
        cost: 1_915_000,
        serviceLevel: 93.5,
        stockoutRisk: 18,
        impact: "Service level drops 2.9 pts; 3 SKUs at risk",
        recommendation: "Activate secondary supplier for SKU-B447 and SKU-D203; absorb +4% logistics cost.",
      };
    case "route_disruption":
      return {
        inventoryDays: 22,
        deliveryDays: 20,
        cost: 1_762_000,
        serviceLevel: 95.1,
        stockoutRisk: 12,
        impact: "Reroute via Seattle adds 2 days but reduces cost",
        recommendation: "Switch 60% of volume to Seattle corridor; retain LA for time-critical cargo.",
      };
  }
}

export function SimulationPanel() {
  const [active, setActive] = useState<ScenarioId | null>(null);
  const sim = useMemo(() => (active ? simulate(active) : null), [active]);

  const compareRows = sim ? [
    { label: "Inventory cover (days)", base: BASELINE.inventoryDays, sim: sim.inventoryDays, unit: "d", goodIfHigher: true },
    { label: "Delivery time (days)",   base: BASELINE.deliveryDays,  sim: sim.deliveryDays,  unit: "d", goodIfHigher: false },
    { label: "Logistics cost (MTD)",   base: BASELINE.cost,          sim: sim.cost,          unit: "$", goodIfHigher: false },
    { label: "Service level (%)",      base: BASELINE.serviceLevel,  sim: sim.serviceLevel,  unit: "%", goodIfHigher: true },
    { label: "Stockout risk (%)",      base: BASELINE.stockoutRisk,  sim: sim.stockoutRisk,  unit: "%", goodIfHigher: false },
  ] : [];

  const fmt = (v: number, unit: string) => unit === "$" ? `$${(v / 1_000_000).toFixed(2)}M` : `${v}${unit}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Scenario Analysis Engine</h2>
          <p className="text-sm text-muted-foreground">What-if simulation for proactive decision making</p>
        </div>
        {active && (
          <Button variant="outline" size="sm" onClick={() => setActive(null)}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Scenario picker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`glass-card rounded-xl p-5 text-left transition-all hover:scale-[1.02] ${isActive ? "ring-2 ring-primary border-primary/50" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/20" : "bg-muted/50"}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                {isActive && <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Active</span>}
              </div>
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {!sim && (
        <div className="glass-card rounded-xl p-12 text-center">
          <FlaskConical className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a scenario above to run a what-if simulation</p>
        </div>
      )}

      {sim && active && (
        <>
          {/* Comparison table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50">
              <h3 className="text-sm font-semibold">Current vs Simulated Outcome</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2 font-medium">Metric</th>
                    <th className="text-left px-3 py-2 font-medium">Current</th>
                    <th className="text-left px-3 py-2 font-medium">Simulated</th>
                    <th className="text-left px-3 py-2 font-medium">Δ Change</th>
                    <th className="text-left px-5 py-2 font-medium">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r) => {
                    const delta = r.sim - r.base;
                    const pct = (delta / r.base) * 100;
                    const better = r.goodIfHigher ? delta > 0 : delta < 0;
                    const tone = delta === 0 ? "text-muted-foreground" : better ? "text-success" : "text-destructive";
                    return (
                      <tr key={r.label} className="border-t border-border/40">
                        <td className="px-5 py-3 font-medium">{r.label}</td>
                        <td className="px-3 py-3 font-mono text-muted-foreground">{fmt(r.base, r.unit)}</td>
                        <td className="px-3 py-3 font-mono">{fmt(r.sim, r.unit)}</td>
                        <td className={`px-3 py-3 font-mono ${tone}`}>
                          {delta > 0 ? "+" : ""}{r.unit === "$" ? `$${(delta/1000).toFixed(0)}k` : delta.toFixed(1)}{r.unit !== "$" ? r.unit : ""}
                          <span className="text-[10px] ml-1">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${better ? "bg-success/10 text-success" : delta === 0 ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                            {delta === 0 ? "NO CHANGE" : better ? "IMPROVED" : "DEGRADED"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Impact + AI recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5 border-l-4 border-warning">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Impact Summary</p>
                  <p className="text-sm font-semibold mt-1">{sim.impact}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="text-muted-foreground">Stockout risk: <span className="text-destructive font-semibold">{sim.stockoutRisk}%</span></span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Service: <span className={sim.serviceLevel < 95 ? "text-warning font-semibold" : "text-success font-semibold"}>{sim.serviceLevel}%</span></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Recommendation</p>
                  <p className="text-sm font-semibold mt-1">{sim.recommendation}</p>
                  <Button size="sm" className="mt-3" variant="default">
                    Apply recommendation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
