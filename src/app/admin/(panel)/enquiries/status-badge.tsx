import type { EnquiryStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-accent-300 text-brand-900",
  CONTACTED: "bg-brand-100 text-brand-800",
  CONVERTED: "bg-brand-700 text-white",
  CLOSED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, label }: { status: EnquiryStatus; label: string }) {
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap", STYLES[status])}>
      {label}
    </span>
  );
}
