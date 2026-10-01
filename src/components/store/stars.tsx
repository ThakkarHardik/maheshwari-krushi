import { Star } from "lucide-react";

export function Stars({ rating, label }: { rating: number; label: string }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={i < rounded ? "fill-accent-500 text-accent-500 size-4" : "size-4 text-gray-300"}
          aria-hidden
        />
      ))}
    </span>
  );
}
