import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AdviceIllustration, FieldsIllustration, ShopIllustration } from "./illustrations";

const FALLBACK = { field: FieldsIllustration, shop: ShopIllustration, advice: AdviceIllustration } as const;
export type AboutPhotoName = keyof typeof FALLBACK;

/**
 * Shows the shop's real photo from public/images/about/<name>.jpg (or .webp/.png)
 * when it has been added, otherwise a brand illustration.
 */
export function AboutPhoto({
  name,
  alt,
  className,
}: {
  name: AboutPhotoName;
  alt: string;
  className?: string;
}) {
  const file = ["jpg", "webp", "png"]
    .map((ext) => `/images/about/${name}.${ext}`)
    .find((p) => existsSync(path.join(process.cwd(), "public", p)));
  const Fallback = FALLBACK[name];

  return (
    <div className={cn("rounded-card relative aspect-[3/2] overflow-hidden shadow-md", className)}>
      {file ? (
        <Image src={file} alt={alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      ) : (
        <Fallback title={alt} className="size-full" />
      )}
    </div>
  );
}
