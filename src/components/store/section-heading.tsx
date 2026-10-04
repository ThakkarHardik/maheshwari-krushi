import { cn } from "@/lib/utils";

/** The one heading style for every section: centred title, accent bar, optional subtitle. */
export function SectionHeading({
  title,
  text,
  id,
  as: Tag = "h2",
  tone = "dark",
  className,
}: {
  title: string;
  text?: string;
  id?: string;
  as?: "h1" | "h2";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <Tag
        id={id}
        className={cn(
          "font-bold text-balance",
          Tag === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
          tone === "dark" ? "text-brand-800" : "text-white",
        )}
      >
        {title}
      </Tag>
      <span className="bg-accent-400 mx-auto mt-3 block h-1 w-16 rounded-full" aria-hidden />
      {text && (
        <p className={cn("mt-3 text-pretty", tone === "dark" ? "text-muted-foreground" : "text-brand-100")}>
          {text}
        </p>
      )}
    </div>
  );
}
