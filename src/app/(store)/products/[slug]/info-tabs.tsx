"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type InfoTab = { key: string; label: string; content: React.ReactNode };

/** Accessible tabs (arrow keys move between tabs) for the product information. */
export function InfoTabs({ tabs }: { tabs: InfoTab[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  }

  if (tabs.length === 0) return null;
  return (
    <div className="rounded-card bg-white shadow-sm ring-1 ring-black/5">
      <div
        role="tablist"
        // Auto margins centre the tabs when they fit, and keep them scrollable when they don't.
        className="border-border flex gap-1 overflow-x-auto border-b px-2 pt-2 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${baseId}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative shrink-0 rounded-t-md px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors sm:text-base",
              "after:bg-brand-700 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-transform after:duration-300",
              i === active
                ? "text-brand-800 after:scale-x-100"
                : "text-muted-foreground hover:text-brand-700 after:scale-x-0",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${baseId}-panel-${i}`}
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== active}
          className="animate-fade-in px-5 py-6 text-center sm:px-8"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
