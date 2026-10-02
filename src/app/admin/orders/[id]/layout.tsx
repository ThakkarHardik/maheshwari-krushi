import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Bare layout for printable documents (no admin sidebar). */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-gray-100 px-4 py-6 print:bg-white print:p-0">{children}</div>;
}
