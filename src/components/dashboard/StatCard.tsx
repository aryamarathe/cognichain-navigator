import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "warning" | "destructive";
}

export function StatCard({ label, value, delta, trend = "neutral", icon: Icon, accent = "primary" }: StatCardProps) {
  const accentMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
  };
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="glass-card rounded-xl p-5 animate-slide-up hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {delta && <p className={`mt-1 text-xs font-medium ${trendColor}`}>{delta}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
