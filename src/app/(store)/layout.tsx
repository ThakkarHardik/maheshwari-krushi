import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { getCartCount } from "@/lib/cart/server";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
