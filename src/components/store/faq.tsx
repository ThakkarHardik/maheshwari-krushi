import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const FAQ_KEYS = ["delivery", "payment", "genuine", "track", "damaged", "advice"] as const;
export type FaqKey = (typeof FAQ_KEYS)[number];

/** Accessible accordion built on <details>, works without JavaScript. */
export async function Faq({ keys = FAQ_KEYS }: { keys?: readonly FaqKey[] }) {
  const t = await getTranslations("faq");
  return (
    <div className="divide-border border-border rounded-card divide-y border bg-white">
      {keys.map((key) => (
        <details key={key} className="group/faq open:bg-brand-50/50 px-5 transition-colors">
          <summary className="hover:text-brand-700 flex cursor-pointer items-center justify-between gap-4 py-4 font-semibold transition-colors">
            {t(`${key}.q`)}
            <ChevronDown
              className="text-brand-600 size-5 shrink-0 transition-transform duration-300 group-open/faq:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="text-muted-foreground animate-fade-in pb-4 leading-relaxed">{t(`${key}.a`)}</p>
        </details>
      ))}
    </div>
  );
}
