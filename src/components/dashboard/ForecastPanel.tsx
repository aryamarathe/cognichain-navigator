import { useMemo, useState } from "react";
import { Brain, TrendingUp, TrendingDown, Sparkles, AlertTriangle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

type Range = "weekly" | "monthly" | "quarterly";

interface ForecastPanelProps {
  onSimulate?: (demandPct: number, note: string) => void;
}

const PRODUCTS: { id: string; name: string; weekly: number[]; monthly: number[]; quarterly: number[] }[] = [
  {
    id: "lithium",
    name: "Lithium Cells 18650",
    weekly:    [98, 105, 110, 108, 115, 120, 125, 130, 135, 138, 142, 150],
    monthly:   [420, 460, 510, 540, 600, 660],
    quarterly: [1390, 1800, 2100, 2450],
  },
  {
    id: "pcb",
    name: "PCB Assemblies",
    weekly:    [82, 80, 78, 75, 72, 70, 68, 66, 64, 62, 60, 58],
    monthly:   [320, 305, 290, 270, 250, 235],
    quarterly: [915, 795, 720, 650],
  },
  {
    id: "display",
    name: "Display Modules",
    weekly:    [50, 55, 52, 58, 60, 56, 62, 65, 64, 68, 70, 67],
    monthly:   [200, 230, 210, 245, 260, 250],
    quarterly: [640, 720, 760, 810],
  },
];

const RANGE_LABELS: Record<Range, { hist: string[]; fut: string[] }> = {
  weekly:    { hist: ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"], fut: ["W13","W14","W15"] },
  monthly:   { hist: ["Jan","Feb","Mar","Apr","May","Jun"],                              fut: ["Jul","Aug","Sep"] },
  quarterly: { hist: ["Q1","Q2","Q3","Q4"],                                              fut: ["Q5","Q6","Q7"] },
};

function linearRegression(y: number[]) {
  const n = y.length;
  const xs = y.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (y[i] - meanY); den += (xs[i] - meanX) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const ssTot = y.reduce((a, v) => a + (v - meanY) ** 2, 0);
  const ssRes = y.reduce((a, v, i) => a + (v - (slope * i + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2, meanY };
}

export function ForecastPanel({ onSimulate }: ForecastPanelProps) {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [range, setRange] = useState<Range>("monthly");
  const [hover, setHover] = useState<number | null>(null);

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const history = product[range];
  const labels = RANGE_LABELS[range];

  const forecast = useMemo(() => {
    const { slope, intercept, r2 } = linearRegression(history);
    const future = labels.fut.map((label, i) => ({
      label,
      predicted: Math.max(0, Math.round(slope * (history.length + i) + intercept)),
    }));
    const lastActual = history[history.length - 1];
    const nextPredicted = future[0].predicted;
    const pctChange = ((nextPredicted - lastActual) / lastActual) * 100;
    const trend: "up" | "down" | "flat" = pctChange > 2 ? "up" : pctChange < -2 ? "down" : "flat";
    const confidence = Math.round(Math.max(40, Math.min(98, r2 * 100)));
    return { future, slope, pctChange, trend, confidence, lastActual, nextPredicted };
  }, [history, labels]);

  const allPoints = [
    ...history.map((v, i) => ({ label: labels.hist[i], actual: v as number | undefined, predicted: undefined as number | undefined })),
    ...forecast.future.map((f) => ({ label: f.label, actual: undefined, predicted: f.predicted })),
  ];
  const maxVal = Math.max(...allPoints.map((p) => Math.max(p.actual ?? 0, p.predicted ?? 0))) * 1.15;
  const W = 100, H = 45;
  const step = W / (allPoints.length - 1);

  const actualPath = allPoints
    .map((p, i) => p.actual !== undefined ? `${i === 0 ? "M" : "L"} ${i * step} ${H - (p.actual / maxVal) * H}` : "")
    .filter(Boolean).join(" ");

  const forecastStartIdx = history.length - 1;
  const forecastPath = allPoints
    .map((p, i) => {
      if (i < forecastStartIdx) return "";
      const v = p.actual ?? p.predicted ?? 0;
      return `${i === forecastStartIdx ? "M" : "L"} ${i * step} ${H - (v / maxVal) * H}`;
    }).filter(Boolean).join(" ");

  const confidenceTone = forecast.confidence >= 80 ? "text-success" : forecast.confidence >= 60 ? "text-warning" : "text-destructive";
  const confidenceBar = forecast.confidence >= 80 ? "bg-success" : forecast.confidence >= 60 ? "bg-warning" : "bg-destructive";

  // Hover insight
  const hoverPoint = hover !== null ? allPoints[hover] : null;
  const hoverValue = hoverPoint ? (hoverPoint.actual ?? hoverPoint.predicted ?? 0) : 0;
  const hoverPrev = hover !== null && hover > 0 ? allPoints[hover - 1] : null;
  const hoverPrevVal = hoverPrev ? (hoverPrev.actual ?? hoverPrev.predicted ?? 0) : 0;
  const hoverPct = hoverPrevVal > 0 ? ((hoverValue - hoverPrevVal) / hoverPrevVal) * 100 : 0;

  // AI insights
  const insights: { icon: typeof TrendingUp; tone: string; title: string; body: string }[] = [];
  if (forecast.trend === "up") {
    insights.push({ icon: TrendingUp, tone: "text-success",
      title: `Demand expected to rise by ${forecast.pctChange.toFixed(1)}%, increase inventory accordingly`,
      body: "Pre-book logistics capacity and lift safety stock to protect service level." });
  } else if (forecast.trend === "down") {
    insights.push({ icon: TrendingDown, tone: "text-warning",
      title: `Demand expected to fall by ${Math.abs(forecast.pctChange).toFixed(1)}%`,
      body: "Reduce next purchase order and review aging inventory policy." });
  } else {
    insights.push({ icon: Sparkles, tone: "text-primary",
      title: "Demand stable across forecast horizon",
      body: "Maintain current reorder cadence; no immediate action required." });
  }
  if (forecast.trend === "up" && forecast.pctChange > 10) {
    insights.push({ icon: AlertTriangle, tone: "text-destructive",
      title: "Stockout risk in next replenishment cycle",
      body: "Trigger reorder of +25% above standard quantity to avoid shortage." });
  }

  const handleSimulate = () => {
    if (!onSimulate) return;
    onSimulate(
      Math.round(forecast.pctChange),
      `Forecast loaded: ${product.name} — ${forecast.pctChange > 0 ? "+" : ""}${forecast.pctChange.toFixed(1)}% demand`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI Demand Forecasting</h2>
          <p className="text-sm text-muted-foreground">Linear regression model with interactive horizon</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm"
          >
            {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {/* Range selector */}
          <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5">
            {(["weekly", "monthly", "quarterly"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs rounded capitalize transition-colors ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next Period Forecast</p>
          <p className="text-3xl font-bold mt-1">{forecast.nextPredicted.toLocaleString()}<span className="text-sm font-normal text-muted-foreground"> units</span></p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${forecast.trend === "up" ? "text-success" : forecast.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
            {forecast.trend === "up" ? <TrendingUp className="h-3 w-3" /> : forecast.trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            {forecast.pctChange > 0 ? "+" : ""}{forecast.pctChange.toFixed(1)}% vs last period
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence Score</p>
          <p className={`text-3xl font-bold mt-1 ${confidenceTone}`}>{forecast.confidence}%</p>
          <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${confidenceBar}`} style={{ width: `${forecast.confidence}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {forecast.confidence >= 80 ? "High reliability" : forecast.confidence >= 60 ? "Moderate reliability" : "Low reliability"}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trend</p>
            <p className={`text-xl font-bold mt-1 capitalize ${forecast.trend === "up" ? "text-success" : forecast.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
              {forecast.trend === "up" ? "Increasing" : forecast.trend === "down" ? "Decreasing" : "Stable"}
            </p>
          </div>
          <Button size="sm" onClick={handleSimulate} disabled={!onSimulate} className="mt-2">
            <FlaskConical className="h-3 w-3 mr-1" /> Simulate This Forecast
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Forecast Graph — {product.name} <span className="text-muted-foreground font-normal capitalize">· {range}</span></h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-secondary"><span className="w-3 h-0.5 bg-secondary" /> Actual (solid)</span>
            <span className="flex items-center gap-1 text-primary"><span className="w-3 h-0.5 border-t-2 border-dotted border-primary" /> Predicted (dotted)</span>
          </div>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full h-56" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.16 230 / 0.3)" />
                <stop offset="100%" stopColor="oklch(0.7 0.16 230 / 0)" />
              </linearGradient>
            </defs>
            <path d={`${forecastPath} L ${W} ${H} L ${forecastStartIdx * step} ${H} Z`} fill="url(#fcFill)" />
            <path d={actualPath} fill="none" stroke="oklch(0.78 0.18 165)" strokeWidth="0.8" />
            <path d={forecastPath} fill="none" stroke="oklch(0.7 0.16 230)" strokeWidth="0.8" strokeDasharray="1.2 0.8" />
            {allPoints.map((p, i) => {
              const v = p.actual ?? p.predicted ?? 0;
              const cy = H - (v / maxVal) * H;
              const cx = i * step;
              const isForecast = p.predicted !== undefined;
              return (
                <g key={i}>
                  {hover === i && (
                    <line x1={cx} y1={0} x2={cx} y2={H} stroke="oklch(0.7 0.02 240 / 0.3)" strokeWidth="0.2" strokeDasharray="0.5 0.5" />
                  )}
                  <circle cx={cx} cy={cy} r={hover === i ? 1.2 : 0.7} fill={isForecast ? "oklch(0.7 0.16 230)" : "oklch(0.78 0.18 165)"} />
                  {/* Hover hit area */}
                  <rect
                    x={cx - step / 2} y={0} width={step} height={H + 8}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer" }}
                  />
                  <text x={cx} y={H + 6} fontSize="2.5" fill="oklch(0.7 0.02 240)" textAnchor="middle">{p.label}</text>
                </g>
              );
            })}
          </svg>
          {/* Tooltip */}
          {hoverPoint && (
            <div
              className="absolute top-2 pointer-events-none glass-card rounded-md px-3 py-2 text-xs shadow-lg"
              style={{ left: `min(calc(${(hover! / (allPoints.length - 1)) * 100}% + 8px), calc(100% - 160px))`, minWidth: "140px" }}
            >
              <p className="font-semibold">{hoverPoint.label}</p>
              <p className="text-muted-foreground">
                {hoverPoint.actual !== undefined ? "Actual" : "Predicted"}: <span className="text-foreground font-mono font-semibold">{hoverValue.toLocaleString()}</span>
              </p>
              {hoverPrev && (
                <p className={`flex items-center gap-1 ${hoverPct > 0 ? "text-success" : hoverPct < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {hoverPct > 0 ? <TrendingUp className="h-3 w-3" /> : hoverPct < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                  {hoverPct > 0 ? "+" : ""}{hoverPct.toFixed(1)}% vs prev
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" /> AI-Generated Insights
        </h3>
        <div className="space-y-3">
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <Icon className={`h-4 w-4 mt-0.5 ${ins.tone}`} />
                <div>
                  <p className={`text-sm font-medium ${ins.tone}`}>{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ins.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
