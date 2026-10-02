import type { Metadata } from "next";
import { LegalPage, legalDoc } from "@/components/store/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await legalDoc("terms")).title };
}

export default function Page() {
  return <LegalPage docKey="terms" />;
}
