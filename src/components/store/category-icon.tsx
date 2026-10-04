import { FlaskConical, Package, Sprout, Wheat, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  seeds: Sprout,
  "plant-tonic": FlaskConical,
  "animal-fodder": Wheat,
};

/** Icon for a category slug (new categories fall back to a parcel). */
export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Package;
  return <Icon className={className} aria-hidden />;
}
