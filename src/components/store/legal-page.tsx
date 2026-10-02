import { getFormatter, getLocale } from "next-intl/server";
import { LAST_UPDATED, legal, type LegalKey } from "@/content/legal";

export async function legalDoc(key: LegalKey) {
  const locale = (await getLocale()) === "en" ? "en" : "hi";
  return legal[locale][key];
}

/** Renders a policy document, filling {placeholders} from `vars`. */
export async function LegalPage({ docKey, vars = {} }: { docKey: LegalKey; vars?: Record<string, string> }) {
  const doc = await legalDoc(docKey);
  const format = await getFormatter();
  const locale = await getLocale();
  const fill = (text: string) => text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-brand-800 text-3xl font-bold">{doc.title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {locale === "en" ? "Last updated" : "अंतिम अपडेट"}:{" "}
        {format.dateTime(new Date(`${LAST_UPDATED}T00:00:00+05:30`), { dateStyle: "long" })}
      </p>
      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-brand-800 mb-2 text-xl font-semibold">{section.heading}</h2>
          <div className="space-y-3">
            {section.body.map((p, i) => (
              <p key={i} className="leading-relaxed">
                {fill(p)}
              </p>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
