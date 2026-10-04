import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Mail, MapPin, MessageCircle, PackageSearch, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EnquiryForm } from "@/components/store/enquiry-form";
import { Faq } from "@/components/store/faq";
import { Reveal } from "@/components/store/reveal";
import { MAPS_URL, storeConfig } from "@/config/store";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return { title: t("title"), description: t("heroText") };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const tWa = await getTranslations("whatsapp");
  const tEnq = await getTranslations("enquiry");
  const tFooter = await getTranslations("footer");
  const whatsappHref = buildWhatsAppLink(storeConfig.whatsapp, tWa("defaultMessage"));

  // WhatsApp links are plain wa.me links for now — the planned WhatsApp
  // integration can replace them in one place (buildWhatsAppLink).
  const quick = [
    {
      key: "call",
      icon: Phone,
      href: `tel:+91${storeConfig.phone}`,
      external: false,
      tone: "bg-white text-brand-800",
    },
    {
      key: "whatsapp",
      icon: MessageCircle,
      href: whatsappHref,
      external: true,
      tone: "bg-whatsapp text-white",
    },
    {
      key: "email",
      icon: Mail,
      href: `mailto:${storeConfig.email}`,
      external: false,
      tone: "bg-white/15 text-white ring-1 ring-white/40",
    },
    { key: "directions", icon: MapPin, href: MAPS_URL, external: true, tone: "bg-accent-400 text-brand-900" },
  ] as const;

  const cards = [
    {
      icon: MapPin,
      title: t("visit"),
      text: t("visitText"),
      value: storeConfig.addressHi,
      href: MAPS_URL,
      external: true,
    },
    {
      icon: Phone,
      title: t("phone"),
      text: t("callText"),
      value: `+91 ${storeConfig.phone}`,
      href: `tel:+91${storeConfig.phone}`,
      external: false,
    },
    {
      icon: MessageCircle,
      title: t("whatsapp"),
      text: t("whatsappText"),
      value: `+91 ${storeConfig.phone}`,
      href: whatsappHref,
      external: true,
    },
    {
      icon: Mail,
      title: t("email"),
      text: t("emailText"),
      value: storeConfig.email,
      href: `mailto:${storeConfig.email}`,
      external: false,
    },
  ];

  return (
    <>
      {/* Hero with one-tap actions */}
      <section className="from-brand-800 to-brand-600 relative overflow-hidden bg-gradient-to-br text-white">
        <MessageCircle
          className="animate-float-slow text-brand-500/30 absolute -right-6 -bottom-6 size-48"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="animate-fade-up text-3xl font-bold sm:text-4xl">{t("heroTitle")}</h1>
          <p className="text-brand-100 animate-fade-up mt-3 max-w-xl text-lg [animation-delay:100ms]">
            {t("heroText")}
          </p>
          <ul className="animate-fade-up mt-8 grid max-w-2xl grid-cols-2 gap-3 [animation-delay:200ms] sm:grid-cols-4">
            {quick.map(({ key, icon: Icon, href, external, tone }) => (
              <li key={key}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl px-3 py-4 font-semibold shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95",
                    tone,
                  )}
                >
                  <Icon className="size-7" aria-hidden />
                  {t(`quick.${key}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1.1fr]">
        {/* Contact cards */}
        <section aria-labelledby="contact-cards">
          <h2 id="contact-cards" className="text-brand-800 text-2xl font-bold">
            {t("cardsTitle")}
          </h2>
          <ul className="mt-5 space-y-3">
            {cards.map(({ icon: Icon, title, text, value, href, external }, i) => (
              <Reveal as="li" key={title} delay={i * 70}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group border-border rounded-card hover:border-brand-600 flex gap-4 border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 group-hover:text-white">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{title}</span>
                    <span className="text-muted-foreground block text-sm">{text}</span>
                    <span className="text-brand-800 mt-1 block font-medium break-words">{value}</span>
                  </span>
                  <ArrowRight
                    className="text-brand-600 mt-1 size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </a>
              </Reveal>
            ))}
          </ul>

          <Reveal className="rounded-card bg-accent-300/50 mt-5 flex items-center gap-4 p-4">
            <PackageSearch className="text-brand-800 size-8 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="font-semibold">{t("trackTitle")}</p>
              <p className="text-sm">{t("trackText")}</p>
            </div>
            <Link
              href="/track"
              className="text-brand-800 font-semibold whitespace-nowrap underline-offset-2 hover:underline"
            >
              {t("trackLink")} →
            </Link>
          </Reveal>
        </section>

        {/* Message form */}
        <Reveal
          as="section"
          delay={120}
          className="border-border rounded-card h-fit border bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-brand-800 text-2xl font-bold">{t("formTitle")}</h2>
          <p className="text-muted-foreground mt-1 mb-5 text-sm">{t("formText")}</p>
          <EnquiryForm whatsapp={storeConfig.whatsapp} defaultMessage={tEnq("defaultMessage")} />
        </Reveal>
      </div>

      {/* Business details + FAQ */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 lg:grid-cols-[1fr_1.6fr]">
        <Reveal as="section" className="bg-brand-50 rounded-card h-fit p-5">
          <h2 className="text-brand-800 flex items-center gap-2 text-lg font-semibold">
            <BadgeCheck className="size-5" aria-hidden /> {t("businessTitle")}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">{storeConfig.name}</dt>
              <dd className="font-semibold">{storeConfig.nameHi}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{tFooter("licence")}</dt>
              <dd className="font-semibold">{storeConfig.licenceNo}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{tFooter("gstin")}</dt>
              <dd className="font-semibold">{storeConfig.gstin}</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal as="section" delay={100}>
          <h2 className="text-brand-800 mb-4 text-2xl font-bold">{t("faqTitle")}</h2>
          <Faq />
        </Reveal>
      </div>
    </>
  );
}
