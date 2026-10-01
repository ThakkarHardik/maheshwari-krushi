import type { ExpiryStatus, StockLevel } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";

const LEVEL: Record<StockLevel, string> = {
  OUT: "bg-red-100 text-danger",
  LOW: "bg-accent-300 text-brand-900",
  OK: "bg-brand-50 text-brand-700",
};

const EXPIRY: Record<ExpiryStatus, string> = {
  EXPIRED: "bg-red-100 text-danger",
  NEAR: "bg-accent-300 text-brand-900",
  OK: "bg-brand-50 text-brand-700",
  NONE: "text-muted-foreground",
};

export function LevelBadge({ level, label }: { level: StockLevel; label: string }) {
  return <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", LEVEL[level])}>{label}</span>;
}

export function ExpiryBadge({ status, label }: { status: ExpiryStatus; label: string }) {
  return <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", EXPIRY[status])}>{label}</span>;
}
