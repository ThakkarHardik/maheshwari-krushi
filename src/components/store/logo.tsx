import Link from "next/link";
import { Sprout } from "lucide-react";
import { storeConfig } from "@/config/store";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label={storeConfig.nameHi}>
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          inverted ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600",
        )}
      >
        <Sprout className="size-6" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("text-lg font-bold", inverted ? "text-white" : "text-brand-800")}>
          {storeConfig.shortNameHi}
        </span>
        <span className={cn("text-xs font-medium", inverted ? "text-brand-100" : "text-brand-600")}>
          {storeConfig.taglineHi}
        </span>
      </span>
    </Link>
  );
}
