import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tContact = await getTranslations("contact");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-800 text-brand-50 mt-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-center sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center space-y-3">
          <Logo inverted />
          <p className="text-brand-100 text-sm">{t("about")}</p>
          <dl className="text-brand-100 flex flex-col items-center space-y-1 text-sm">
            <div className="flex gap-2">
              <dt>{t("licence")}:</dt>
              <dd className="font-semibold text-white">{storeConfig.licenceNo}</dd>
            </div>
            <div className="flex gap-2">
              <dt>{t("gstin")}:</dt>
              <dd className="font-semibold text-white">{storeConfig.gstin}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-white">{t("quickLinks")}</h2>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-brand-100 hover:text-white">
                  {tNav(link.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/track" className="text-brand-100 hover:text-white">
                {tNav("track")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-white">{t("contactUs")}</h2>
          <ul className="text-brand-100 flex flex-col items-center space-y-3 text-sm">
            <li className="flex justify-center gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <address className="not-italic">{storeConfig.addressHi}</address>
            </li>
            <li>
              <a href={`tel:+91${storeConfig.phone}`} className="flex items-center gap-2 hover:text-white">
                <Phone className="size-4" aria-hidden />
                <span className="sr-only">{tContact("phone")}: </span>+91 {storeConfig.phone}
              </a>
            </li>
            <li>
              <a
                href={buildWhatsAppLink(storeConfig.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white"
              >
                <MessageCircle className="size-4" aria-hidden />
                {tContact("whatsapp")}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${storeConfig.email}`}
                className="flex items-center gap-2 break-all hover:text-white"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                {storeConfig.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <nav aria-label={t("policies")} className="mx-auto max-w-6xl px-4 pt-4">
          <ul className="text-brand-100 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            {(
              [
                ["/terms", "terms"],
                ["/privacy", "privacy"],
                ["/refund-policy", "refund"],
                ["/shipping-policy", "shipping"],
              ] as const
            ).map(([href, key]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white hover:underline">
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-brand-100 mx-auto max-w-6xl px-4 py-4 text-center text-xs">
          © {year} {storeConfig.nameHi} ({storeConfig.name}). {t("rights")}
        </p>
      </div>
    </footer>
  );
}
