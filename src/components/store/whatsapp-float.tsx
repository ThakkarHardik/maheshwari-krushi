import { MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function WhatsAppFloat() {
  const t = await getTranslations("whatsapp");
  return (
    <a
      href={buildWhatsAppLink(storeConfig.whatsapp, t("defaultMessage"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("floatingLabel")}
      className="bg-whatsapp fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 font-semibold text-white shadow-lg hover:brightness-95"
    >
      <MessageCircle className="size-6" aria-hidden />
      <span className="hidden sm:inline">{t("floatingLabel")}</span>
    </a>
  );
}
