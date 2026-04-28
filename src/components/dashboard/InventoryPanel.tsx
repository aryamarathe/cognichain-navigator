import { Package, TrendingUp, TrendingDown } from "lucide-react";

const items = [
  { sku: "SKU-A102", name: "Lithium Cells 18650", stock: 82, status: "optimal", action: "Hold", trend: "up" },
  { sku: "SKU-B447", name: "PCB Assemblies",      stock: 23, status: "low",     action: "Reorder 500u", trend: "down" },
  { sku: "SKU-C918", name: "Aluminum Casings",    stock: 67, status: "optimal", action: "Hold", trend: "up" },
  { sku: "SKU-D203", name: "Display Modules",     stock: 12, status: "critical",action: "Urgent reorder", trend: "down" },
];

export function InventoryPanel() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Smart Inventory Decisions</h3>
        <span className="text-[10px] text-muted-foreground">Auto-refreshed 2s ago</span>
      </div>
      <div className="space-y-2">
        {items.map((it) => {
          const color =
            it.status === "critical" ? "bg-destructive" :
            it.status === "low" ? "bg-warning" : "bg-success";
          const textColor =
            it.status === "critical" ? "text-destructive" :
            it.status === "low" ? "text-warning" : "text-success";
          return (
            <div key={it.sku} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                  {it.trend === "up" ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">{it.sku}</p>
              </div>
              <div className="w-24">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${color}`} style={{ width: `${it.stock}%` }} />
                </div>
                <p className={`text-[10px] mt-1 text-right ${textColor}`}>{it.stock}%</p>
              </div>
              <div className="w-28 text-right">
                <p className={`text-xs font-medium ${textColor}`}>{it.action}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
