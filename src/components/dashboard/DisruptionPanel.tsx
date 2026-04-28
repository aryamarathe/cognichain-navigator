import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Brain, Cloud, Anchor, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Stage = "idle" | "detected" | "impact" | "routes" | "ai" | "rerouted";

interface DisruptionPanelProps {
  onReroute: (rerouted: boolean) => void;
}

const ROUTES = [
  { name: "Los Angeles (Original)", time: "18 days", cost: "$10,000", risk: "HIGH", riskClass: "text-destructive bg-destructive/10" },
  { name: "Seattle (Alt 1)",        time: "20 days", cost: "$9,000",  risk: "LOW",  riskClass: "text-success bg-success/10" },
  { name: "Houston (Alt 2)",        time: "22 days", cost: "$8,500",  risk: "MED",  riskClass: "text-warning bg-warning/10" },
];

export function DisruptionPanel({ onReroute }: DisruptionPanelProps) {
  const [stage, setStage] = useState<Stage>("idle");

  useEffect(() => {
    if (stage === "idle" || stage === "rerouted") return;
    const next: Record<Stage, Stage> = {
      idle: "idle", detected: "impact", impact: "routes", routes: "ai", ai: "ai", rerouted: "rerouted",
    };
    if (stage === "ai") return;
    const t = setTimeout(() => setStage(next[stage]), 1500);
    return () => clearTimeout(t);
  }, [stage]);

  const triggerDisruption = () => {
    onReroute(false);
    setStage("detected");
  };

  const acceptReroute = () => {
    setStage("rerouted");
    onReroute(true);
  };

  const reset = () => {
    setStage("idle");
    onReroute(false);
  };

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Disruption Response Engine</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded border border-border">
          PRIE v2
        </span>
      </div>

      {stage === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <p className="font-semibold text-foreground">All routes nominal</p>
            <p className="text-xs text-muted-foreground mt-1">Continuously monitoring weather, congestion & risk signals</p>
          </div>
          <Button onClick={triggerDisruption} variant="outline" size="sm" className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning">
            <Cloud className="h-3.5 w-3.5 mr-2" /> Simulate Disruption
          </Button>
        </div>
      )}

      {stage !== "idle" && (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {/* Step 1: Detection */}
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 animate-slide-up">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-destructive uppercase tracking-wider">Disruption Detected</p>
                <p className="text-sm text-foreground mt-1">High port congestion at LA · Storm cluster in Pacific corridor</p>
                <p className="text-xs text-muted-foreground mt-1">Estimated delay: <span className="text-destructive font-semibold">+72 hours</span></p>
              </div>
            </div>
          </div>

          {/* Step 2: Impact */}
          {(stage === "impact" || stage === "routes" || stage === "ai" || stage === "rerouted") && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 animate-slide-up">
              <p className="text-xs font-bold text-warning uppercase tracking-wider mb-2">Impact Analysis</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-bold text-foreground">+72h</p><p className="text-[10px] text-muted-foreground">Delay</p></div>
                <div><p className="text-lg font-bold text-foreground">+$4K</p><p className="text-[10px] text-muted-foreground">Cost</p></div>
                <div><p className="text-lg font-bold text-destructive">HIGH</p><p className="text-[10px] text-muted-foreground">SLA Risk</p></div>
              </div>
            </div>
          )}

          {/* Step 3: Routes */}
          {(stage === "routes" || stage === "ai" || stage === "rerouted") && (
            <div className="rounded-lg border border-border bg-card/50 p-3 animate-slide-up">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Anchor className="h-3 w-3" /> Alternative Routes
              </p>
              <div className="space-y-1.5">
                {ROUTES.map((r) => {
                  const recommended = stage !== "routes" && r.name.startsWith("Seattle");
                  return (
                    <div
                      key={r.name}
                      className={`flex items-center justify-between text-xs p-2 rounded border ${
                        recommended ? "border-primary/50 bg-primary/10" : "border-border/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">{r.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{r.time}</span>
                        <span className="text-muted-foreground">{r.cost}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.riskClass}`}>{r.risk}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: AI */}
          {(stage === "ai" || stage === "rerouted") && (
            <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 animate-slide-up">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">AI Recommendation</p>
                  <p className="text-sm text-foreground mt-1 font-medium">Divert shipment to Seattle Port</p>
                  <ul className="mt-2 text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>Avoids active storm zone</li>
                    <li>Lower port congestion (12% vs 87%)</li>
                    <li>Acceptable +2 day delay vs original SLA</li>
                  </ul>
                  {stage === "ai" && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={acceptReroute} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Accept & Reroute
                      </Button>
                      <Button size="sm" variant="ghost" onClick={reset}>Dismiss</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Rerouted */}
          {stage === "rerouted" && (
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 animate-slide-up">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-success">Shipment rerouted to Seattle</p>
                  <p className="text-xs text-muted-foreground">New ETA: 20 days · Status updated on map</p>
                </div>
                <Button size="sm" variant="ghost" onClick={reset}>Reset Demo</Button>
              </div>
            </div>
          )}

          {/* Loader between stages */}
          {(stage === "detected" || stage === "impact" || stage === "routes") && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {stage === "detected" && "Calculating impact…"}
              {stage === "impact" && "Generating alternative routes…"}
              {stage === "routes" && "AI evaluating recommendations…"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
