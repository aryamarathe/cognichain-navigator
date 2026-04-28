const data = [
  { m: "Jan", a: 42, f: 40 },
  { m: "Feb", a: 48, f: 46 },
  { m: "Mar", a: 55, f: 53 },
  { m: "Apr", a: 51, f: 58 },
  { m: "May", a: 63, f: 62 },
  { m: "Jun", a: 68, f: 70 },
  { m: "Jul", a: 0,  f: 76 },
  { m: "Aug", a: 0,  f: 82 },
  { m: "Sep", a: 0,  f: 79 },
];

export function ForecastChart() {
  const max = 100;
  const w = 100, h = 40;
  const step = w / (data.length - 1);

  const actualPath = data
    .filter((d) => d.a > 0)
    .map((d, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (d.a / max) * h}`)
    .join(" ");

  const forecastPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (d.f / max) * h}`)
    .join(" ");

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Demand Forecast</h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Actual</span>
          <span className="flex items-center gap-1 text-primary"><span className="w-2 h-2 rounded-full bg-primary" /> AI Forecast</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Next-quarter accuracy: <span className="text-success font-semibold">94.2%</span></p>
      <svg viewBox={`0 0 ${w} ${h + 8}`} className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 165 / 0.4)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 165 / 0)" />
          </linearGradient>
        </defs>
        <path d={`${forecastPath} L ${w} ${h} L 0 ${h} Z`} fill="url(#forecastFill)" />
        <path d={forecastPath} fill="none" stroke="oklch(0.78 0.18 165)" strokeWidth="0.6" strokeDasharray="1 0.8" />
        <path d={actualPath} fill="none" stroke="oklch(0.7 0.16 230)" strokeWidth="0.8" />
        {data.map((d, i) => (
          <text key={d.m} x={i * step} y={h + 6} fontSize="2.5" fill="oklch(0.7 0.02 240)" textAnchor="middle">{d.m}</text>
        ))}
      </svg>
    </div>
  );
}
