"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintToolbar({
  backHref,
  backLabel,
  printLabel,
}: {
  backHref: string;
  backLabel: string;
  printLabel: string;
}) {
  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between print:hidden">
      <Link href={backHref} className="text-brand-700 text-sm hover:underline">
        {backLabel}
      </Link>
      <Button onClick={() => window.print()}>
        <Printer /> {printLabel}
      </Button>
    </div>
  );
}
