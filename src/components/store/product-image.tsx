import Image from "next/image";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product photo in a square frame, or a leaf placeholder when there is none. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  placeholderLabel,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  placeholderLabel?: string;
}) {
  return (
    <div className={cn("bg-brand-50 relative aspect-square overflow-hidden", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-2" />
      ) : (
        <div className="text-brand-200 absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Sprout className="size-1/3" aria-hidden />
          {placeholderLabel && <span className="text-muted-foreground text-xs">{placeholderLabel}</span>}
        </div>
      )}
    </div>
  );
}
