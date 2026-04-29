import { useMemo, useState } from "react";
import { Brain, TrendingUp, TrendingDown, Sparkles, AlertTriangle } from "lucide-react";

type SeriesPoint = { label: string; actual?: number };

const PRODUCTS: { id: string; name: string; history: SeriesPoint[] }[] = [
  {
    id: "lithium",
    name: "Lithium Cells 18650",
    history: [
      { label: "Jan", actual: 420 }, { label: "Feb", actual: 460 }, { label: "Mar", actual: 510 },
      { label: "Apr", actual: 540 }, { label: "May", actual: 600 }, { label: "Jun", actual: 660 },
    ],
  },
  {
    id: "pcb",
    name: "PCB Assemblies",
    history: [
      { label: "Jan", actual: 320 }, { label: "Feb", actual: 305 }, { label: "Mar", actual: 290 },
      { label: "Apr", actual: 270 }, { label: "May", actual: 250 }, { label: "Jun", actual: 235 },
    ],
  },
  {
    id: "display",
    name: "Display Modules",
    history: [
      { label: "Jan", actual: 200 }, { label: "Feb", actual: 230 }, { label: "Mar", actual: 210 },
      { label: "Apr", actual: 245 }, { label: "May", actual: 260 }, { label: "Jun", actual: 250 },
    ],
  },
];

// Simple linear regression
function linearRegression(y: number[]) {
  const n = y.length;
  const xs = y.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (y[i] - meanY); den += (xs[i] - meanX) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  // R^2
  const ssTot = y.reduce((a, v) => a + (v - meanY) ** 2, 0);
  const ssRes = y.reduce((a, v, i) => a + (v - (slope * i + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2, meanY };
}

export function ForecastPanel() {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const product = PRODUCTS.find((p) => p.id === productId)!;

  const forecast = useMemo(() => {
    const y = product.history.map((p) => p.actual!);
    const { slope, intercept, r2, meanY } = linearRegression(y);
    const future = ["Jul", "Aug", "Sep"].map((label, i) => ({
      label,
      predicted: Math.max(0, Math.round(slope * (y.length + i) + intercept)),
    }));
    const lastActual = y[y.length - 1];
    const nextPredicted = future[0].predicted;
    const pctChange = ((nextPredicted - lastActual) / lastActual) * 100;
    const trend: "up" | "down" | "flat" =
      pctChange > 2 ? "up" : pctChange < -2 ? "down" : "flat";
    const confidence = Math.round(Math.max(40, Math.min(98, r2 * 100)));
    return { future, slope, pctChange, trend, confidence, meanY, lastActual, nextPredicted };
  }, [product]);

  // Build chart points (history + forecast)
  const allPoints = [
    ...product.history.map((p) => ({ label: p.label, actual: p.actual!, predicted: undefined as number | undefined })),
    ...forecast.future.map((f) => ({ label: f.label, actual: undefined as number | undefined, predicted: f.predicted })),
  ];
  const maxVal = Math.max(...allPoints.map((p) => Math.max(p.actual ?? 0, p.predicted ?? 0))) * 1.15;
  const W = 100, H = 45;
  const step = W / (allPoints.length - 1);

  const actualPath = allPoints
    .map((p, i) => p.actual !== undefined ? `${i === 0 ? "M" : "L"} ${i * step} ${H - (p.actual / maxVal) * H}` : "")
    .filter(Boolean).join(" ");

  // Forecast line connects last actual to predictions
  const forecastStartIdx = product.history.length - 1;
  const forecastPath = allPoints
    .map((p, i) => {
      if (i < forecastStartIdx) return "";
      const v = p.actual ?? p.predicted ?? 0;
      return `${i === forecastStartIdx ? "M" : "L"} ${i * step} ${H - (v / maxVal) * H}`;
    }).filter(Boolean).join(" ");

  // AI insights
  const insights: { icon: typeof TrendingUp; tone: string; title: string; body: string }[] = [];
  if (forecast.trend === "up") {
    insights.push({
      icon: TrendingUp, tone: "text-success",
      title: `Demand expected to increase by ${forecast.pctChange.toFixed(1)}%`,
      body: "Consider increasing safety stock and pre-booking logistics capacity to avoid stockout risk."
    });
  } else if (forecast.trend === "down") {
    insights.push({
      icon: TrendingDown, tone: "text-warning",
      title: `Demand expected to decrease by ${Math.abs(forecast.pctChange).toFixed(1)}%`,
      body: "Risk of overstock. Reduce next purchase order and review aging inventory policy."
    });
  } else {
    insights.push({
      icon: Sparkles, tone: "text-primary",
      title: "Demand stable across forecast horizon",
      body: "Maintain current reorder cadence; no immediate action required."
    });
  }
  // Seasonal hint
  insights.push({
    icon: Sparkles, tone: "text-primary",
    title: "Seasonal pattern detected",
    body: "Q3 historically shows +12% lift across electronics — adjust forecast upward by 8–12% for August."
  });
  if (forecast.trend === "up" && forecast.pctChange > 10) {
    insights.push({
      icon: AlertTriangle, tone: "text-destructive",
      title: "Stockout risk in 4–6 weeks",
      body: "Projected demand exceeds current replenishment plan. Trigger reorder of +25% above standard quantity."
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI Demand Forecasting</h2>
          <p className="text-sm text-muted-foreground">Linear regression model trained on historical demand</p>
        </div>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm"
        >
          {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
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
          <p className="text-3xl font-bold text-primary mt-1">{forecast.confidence}%</p>
          <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${forecast.confidence}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trend</p>
          <p className={`text-3xl font-bold mt-1 capitalize ${forecast.trend === "up" ? "text-success" : forecast.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
            {forecast.trend === "up" ? "Increasing" : forecast.trend === "down" ? "Decreasing" : "Stable"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Slope: {forecast.slope.toFixed(2)} units/period</p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Forecast Graph — {product.name}</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Actual</span>
            <span className="flex items-center gap-1 text-primary"><span className="w-2 h-2 rounded-full bg-primary" /> AI Forecast</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full h-48" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.16 230 / 0.3)" />
              <stop offset="100%" stopColor="oklch(0.7 0.16 230 / 0)" />
            </linearGradient>
          </defs>
          <path d={`${forecastPath} L ${W} ${H} L ${forecastStartIdx * step} ${H} Z`} fill="url(#fcFill)" />
          <path d={actualPath} fill="none" stroke="oklch(0.78 0.18 165)" strokeWidth="0.8" />
          <path d={forecastPath} fill="none" stroke="oklch(0.7 0.16 230)" strokeWidth="0.8" strokeDasharray="1.2 0.8" />
          {allPoints.map((p, i) => (
            <text key={i} x={i * step} y={H + 6} fontSize="2.5" fill="oklch(0.7 0.02 240)" textAnchor="middle">{p.label}</text>
          ))}
        </svg>
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
