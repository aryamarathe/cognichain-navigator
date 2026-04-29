import { useMemo, useState, useEffect } from "react";
import { TrendingUp, Clock, DollarSign, Brain, AlertTriangle, ArrowRight, RotateCcw, Sparkles, Package, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface SimulationPanelProps {
  seedDemand?: number;
  seedNote?: string;
}

const BASELINE = {
  inventoryDays: 22,
  deliveryDays: 18,
  cost: 1_840_000,
  serviceLevel: 96.4,
  stockoutRisk: 8,
};

function compute(demandPct: number, delayDays: number, costVarPct: number) {
  // Inventory cover shrinks ~1 day per +5% demand and per +1 day delay
  const inventoryDays = Math.max(0, Math.round(BASELINE.inventoryDays - demandPct * 0.4 - delayDays * 1.2));
  const deliveryDays = Math.round(BASELINE.deliveryDays + delayDays + Math.max(0, demandPct * 0.05));
  const cost = Math.round(BASELINE.cost * (1 + costVarPct / 100 + delayDays * 0.012 + Math.max(0, demandPct) * 0.0035));
  const serviceLevel = Math.max(60, Math.min(99.5, BASELINE.serviceLevel - demandPct * 0.18 - delayDays * 0.6));
  const stockoutRisk = Math.max(0, Math.min(95, Math.round(BASELINE.stockoutRisk + demandPct * 0.9 + delayDays * 2.2 - 1.5)));
  return { inventoryDays, deliveryDays, cost, serviceLevel: +serviceLevel.toFixed(1), stockoutRisk };
}

function tone(value: number, threshold: { ok: number; warn: number }, higherIsBetter = false) {
  if (higherIsBetter) {
    if (value >= threshold.ok) return "text-success";
    if (value >= threshold.warn) return "text-warning";
    return "text-destructive";
  }
  if (value <= threshold.ok) return "text-success";
  if (value <= threshold.warn) return "text-warning";
  return "text-destructive";
}

export function SimulationPanel({ seedDemand, seedNote }: SimulationPanelProps) {
  const [demandPct, setDemandPct] = useState(seedDemand ?? 0);
  const [delayDays, setDelayDays] = useState(0);
  const [costVarPct, setCostVarPct] = useState(0);
  const [optimized, setOptimized] = useState(false);

  useEffect(() => {
    if (seedDemand !== undefined) {
      setDemandPct(seedDemand);
      setOptimized(false);
    }
  }, [seedDemand]);

  const sim = useMemo(() => compute(demandPct, delayDays, costVarPct), [demandPct, delayDays, costVarPct]);

  const rows = [
    { label: "Inventory cover (days)", base: BASELINE.inventoryDays, sim: sim.inventoryDays, unit: "d", goodIfHigher: true },
    { label: "Delivery time (days)",   base: BASELINE.deliveryDays,  sim: sim.deliveryDays,  unit: "d", goodIfHigher: false },
    { label: "Logistics cost (MTD)",   base: BASELINE.cost,          sim: sim.cost,          unit: "$", goodIfHigher: false },
    { label: "Service level (%)",      base: BASELINE.serviceLevel,  sim: sim.serviceLevel,  unit: "%", goodIfHigher: true },
    { label: "Stockout risk (%)",      base: BASELINE.stockoutRisk,  sim: sim.stockoutRisk,  unit: "%", goodIfHigher: false },
  ];
  const fmt = (v: number, u: string) => u === "$" ? `$${(v / 1_000_000).toFixed(2)}M` : `${v}${u}`;

  // AI insight
  const aiInsight = useMemo(() => {
    const parts: string[] = [];
    if (demandPct >= 15) parts.push(`Demand increase of ${demandPct}% will cause stock shortage in ~${Math.max(1, sim.inventoryDays)} days.`);
    else if (demandPct <= -10) parts.push(`Demand drop of ${Math.abs(demandPct)}% risks overstock and aged inventory.`);
    if (delayDays >= 3) parts.push(`Supplier delay of ${delayDays}d pushes service level to ${sim.serviceLevel}%.`);
    if (sim.stockoutRisk > 30) parts.push(`Stockout risk elevated to ${sim.stockoutRisk}%.`);
    if (costVarPct >= 5) parts.push(`Cost variation +${costVarPct}% inflates monthly logistics spend by $${((sim.cost - BASELINE.cost) / 1000).toFixed(0)}k.`);
    if (parts.length === 0) parts.push("Scenario within tolerance — current plan remains viable.");
    return parts.join(" ");
  }, [demandPct, delayDays, costVarPct, sim]);

  // Optimize actions
  const optimizeActions = useMemo(() => {
    const acts: { icon: typeof Package; title: string; detail: string }[] = [];
    if (sim.stockoutRisk > 25 || demandPct > 10) {
      acts.push({ icon: Package, title: `Increase safety stock by ${Math.min(40, Math.max(10, demandPct + 5))}%`, detail: "Pre-position inventory in regional DCs to protect service level." });
    }
    if (delayDays >= 3 || sim.deliveryDays > 20) {
      acts.push({ icon: Truck, title: "Reroute via Seattle corridor", detail: "Reduces delivery time exposure by ~2 days versus current lane." });
    }
    if (delayDays >= 5 || sim.serviceLevel < 92) {
      acts.push({ icon: Users, title: "Activate secondary supplier", detail: "Switch SKU-B447 / SKU-D203 to backup vendor; absorb +4% sourcing cost." });
    }
    if (acts.length === 0) {
      acts.push({ icon: Sparkles, title: "Maintain current plan", detail: "All KPIs within target band — no optimization required." });
    }
    return acts;
  }, [sim, demandPct, delayDays]);

  const reset = () => { setDemandPct(0); setDelayDays(0); setCostVarPct(0); setOptimized(false); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Scenario Analysis Engine</h2>
          <p className="text-sm text-muted-foreground">Interactive what-if simulation with live AI feedback</p>
          {seedNote && (
            <p className="text-xs text-primary mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> {seedNote}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Demand change</p>
            <span className={`text-sm font-mono font-bold ${demandPct > 0 ? "text-success" : demandPct < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {demandPct > 0 ? "+" : ""}{demandPct}%
            </span>
          </div>
          <Slider value={[demandPct]} onValueChange={(v) => setDemandPct(v[0])} min={-30} max={50} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>-30%</span><span>+50%</span></div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warning" /> Delay</p>
            <span className={`text-sm font-mono font-bold ${delayDays > 3 ? "text-destructive" : delayDays > 0 ? "text-warning" : "text-muted-foreground"}`}>
              +{delayDays}d
            </span>
          </div>
          <Slider value={[delayDays]} onValueChange={(v) => setDelayDays(v[0])} min={0} max={14} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0d</span><span>+14d</span></div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-secondary" /> Cost variation</p>
            <span className={`text-sm font-mono font-bold ${costVarPct > 0 ? "text-destructive" : costVarPct < 0 ? "text-success" : "text-muted-foreground"}`}>
              {costVarPct > 0 ? "+" : ""}{costVarPct}%
            </span>
          </div>
          <Slider value={[costVarPct]} onValueChange={(v) => setCostVarPct(v[0])} min={-15} max={25} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>-15%</span><span>+25%</span></div>
        </div>
      </div>

      {/* Comparison */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Current vs Simulated Outcome</h3>
          <span className="text-[10px] text-muted-foreground font-mono">LIVE · updates as you adjust sliders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Metric</th>
                <th className="text-left px-3 py-2 font-medium">Current</th>
                <th className="text-left px-3 py-2 font-medium">Simulated</th>
                <th className="text-left px-3 py-2 font-medium">Δ Change</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const delta = r.sim - r.base;
                const pct = r.base === 0 ? 0 : (delta / r.base) * 100;
                const better = r.goodIfHigher ? delta > 0 : delta < 0;
                const t = delta === 0 ? "text-muted-foreground" : better ? "text-success" : "text-destructive";
                return (
                  <tr key={r.label} className="border-t border-border/40">
                    <td className="px-5 py-3 font-medium">{r.label}</td>
                    <td className="px-3 py-3 font-mono text-muted-foreground">{fmt(r.base, r.unit)}</td>
                    <td className="px-3 py-3 font-mono">{fmt(r.sim, r.unit)}</td>
                    <td className={`px-3 py-3 font-mono ${t}`}>
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

      {/* Risk indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stockout Risk</p>
          <p className={`text-2xl font-bold mt-1 ${tone(sim.stockoutRisk, { ok: 15, warn: 35 })}`}>{sim.stockoutRisk}%</p>
          <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${sim.stockoutRisk > 35 ? "bg-destructive" : sim.stockoutRisk > 15 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(100, sim.stockoutRisk)}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Service Level</p>
          <p className={`text-2xl font-bold mt-1 ${tone(sim.serviceLevel, { ok: 95, warn: 90 }, true)}`}>{sim.serviceLevel}%</p>
          <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${sim.serviceLevel >= 95 ? "bg-success" : sim.serviceLevel >= 90 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${sim.serviceLevel}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost Impact</p>
          <p className={`text-2xl font-bold mt-1 ${sim.cost > BASELINE.cost ? "text-destructive" : "text-success"}`}>
            {sim.cost > BASELINE.cost ? "+" : ""}${((sim.cost - BASELINE.cost) / 1000).toFixed(0)}k
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">vs ${(BASELINE.cost / 1_000_000).toFixed(2)}M baseline</p>
        </div>
      </div>

      {/* AI insight + Optimize */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Insight</p>
              <p className="text-sm font-medium mt-1 leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-success">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3 text-success" /> Optimization</p>
            <Button size="sm" variant={optimized ? "outline" : "default"} onClick={() => setOptimized((v) => !v)}>
              {optimized ? "Hide actions" : "Optimize Scenario"}
            </Button>
          </div>
          {optimized ? (
            <div className="space-y-2 mt-3">
              {optimizeActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                    <Icon className="h-4 w-4 text-success mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              Click to generate AI-recommended actions <ArrowRight className="h-3 w-3" />
            </p>
          )}
          {sim.stockoutRisk > 50 && !optimized && (
            <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> Action recommended — stockout risk critical
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
