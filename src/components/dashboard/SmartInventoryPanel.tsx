import { useMemo, useState } from "react";
import { Package, AlertTriangle, CheckCircle2, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = {
  sku: string;
  name: string;
  stock: number;        // current units
  reorderLevel: number; // threshold
  maxCapacity: number;
  dailyUsage: number;
  trend: "up" | "down";
};

const INITIAL: Item[] = [
  { sku: "SKU-A102", name: "Lithium Cells 18650",  stock: 820, reorderLevel: 500, maxCapacity: 1200, dailyUsage: 32, trend: "up" },
  { sku: "SKU-B447", name: "PCB Assemblies",       stock: 180, reorderLevel: 400, maxCapacity: 1000, dailyUsage: 28, trend: "down" },
  { sku: "SKU-C918", name: "Aluminum Casings",     stock: 670, reorderLevel: 300, maxCapacity: 1000, dailyUsage: 15, trend: "up" },
  { sku: "SKU-D203", name: "Display Modules",      stock: 90,  reorderLevel: 350, maxCapacity: 800,  dailyUsage: 22, trend: "down" },
  { sku: "SKU-E551", name: "Power Adapters 65W",   stock: 410, reorderLevel: 450, maxCapacity: 1200, dailyUsage: 18, trend: "down" },
  { sku: "SKU-F702", name: "Thermal Pads",         stock: 950, reorderLevel: 200, maxCapacity: 1500, dailyUsage: 8,  trend: "up" },
];

type Status = "Critical" | "Low" | "Normal";

function classify(item: Item): Status {
  if (item.stock <= item.reorderLevel * 0.5) return "Critical";
  if (item.stock <= item.reorderLevel) return "Low";
  return "Normal";
}

function statusColors(s: Status) {
  if (s === "Critical") return { bar: "bg-destructive", text: "text-destructive", chip: "bg-destructive/10 text-destructive border-destructive/30" };
  if (s === "Low")      return { bar: "bg-warning",     text: "text-warning",     chip: "bg-warning/10 text-warning border-warning/30" };
  return { bar: "bg-success", text: "text-success", chip: "bg-success/10 text-success border-success/30" };
}

function recommendation(item: Item, status: Status) {
  if (status === "Normal") return { text: "Hold", qty: 0 };
  const target = Math.round(item.maxCapacity * 0.85);
  const qty = Math.max(0, target - item.stock);
  return { text: status === "Critical" ? `Urgent reorder ${qty}u` : `Reorder ${qty}u`, qty };
}

export function SmartInventoryPanel() {
  const [items, setItems] = useState<Item[]>(INITIAL);

  const enriched = useMemo(
    () => items.map((it) => {
      const status = classify(it);
      const rec = recommendation(it, status);
      const daysOfCover = Math.floor(it.stock / it.dailyUsage);
      return { ...it, status, rec, daysOfCover };
    }),
    [items]
  );

  const critical = enriched.filter((e) => e.status === "Critical");
  const low = enriched.filter((e) => e.status === "Low");
  const normal = enriched.filter((e) => e.status === "Normal");

  const reorder = (sku: string, qty: number) => {
    setItems((prev) => prev.map((it) => it.sku === sku ? { ...it, stock: Math.min(it.maxCapacity, it.stock + qty) } : it));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Smart Inventory System</h2>
        <p className="text-sm text-muted-foreground">Real-time stock tracking with AI reorder recommendations</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 border-l-4 border-destructive">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
              <p className="text-3xl font-bold text-destructive mt-1">{critical.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Stock ≤ 50% of reorder threshold</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Low</p>
              <p className="text-3xl font-bold text-warning mt-1">{low.length}</p>
            </div>
            <Package className="h-8 w-8 text-warning" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Below reorder threshold</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Normal</p>
              <p className="text-3xl font-bold text-success mt-1">{normal.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Healthy stock levels</p>
        </div>
      </div>

      {/* Critical alerts banner */}
      {critical.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Critical inventory alert</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {critical.length} SKU{critical.length > 1 ? "s" : ""} below 50% of reorder threshold — immediate action required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Inventory Register
          </h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{enriched.length} SKUs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2 font-medium">SKU / Item</th>
                <th className="text-left px-3 py-2 font-medium">Stock vs Capacity</th>
                <th className="text-left px-3 py-2 font-medium">Reorder @</th>
                <th className="text-left px-3 py-2 font-medium">Days Cover</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">AI Recommendation</th>
                <th className="text-right px-5 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((it) => {
                const c = statusColors(it.status);
                const pct = (it.stock / it.maxCapacity) * 100;
                return (
                  <tr key={it.sku} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{it.name}</p>
                        {it.trend === "up"
                          ? <TrendingUp className="h-3 w-3 text-success" />
                          : <TrendingDown className="h-3 w-3 text-destructive" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">{it.sku}</p>
                    </td>
                    <td className="px-3 py-3 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono w-16 text-right">{it.stock}/{it.maxCapacity}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{it.reorderLevel}</td>
                    <td className={`px-3 py-3 text-xs font-mono ${it.daysOfCover < 5 ? "text-destructive" : it.daysOfCover < 15 ? "text-warning" : "text-foreground"}`}>
                      {it.daysOfCover}d
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${c.chip}`}>{it.status.toUpperCase()}</span>
                    </td>
                    <td className={`px-3 py-3 text-xs font-medium ${c.text}`}>{it.rec.text}</td>
                    <td className="px-5 py-3 text-right">
                      {it.rec.qty > 0 ? (
                        <Button size="sm" variant={it.status === "Critical" ? "destructive" : "outline"} onClick={() => reorder(it.sku, it.rec.qty)}>
                          <ShoppingCart className="h-3 w-3 mr-1" /> Reorder
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
