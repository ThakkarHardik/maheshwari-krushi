import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Mail, MapPin, MessageCircle, PackageSearch, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EnquiryForm } from "@/components/store/enquiry-form";
import { Faq } from "@/components/store/faq";
import { Reveal } from "@/components/store/reveal";
import { SectionHeading } from "@/components/store/section-heading";
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
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
          <h1 className="animate-fade-up text-3xl font-bold sm:text-4xl">{t("heroTitle")}</h1>
          <p className="text-brand-100 animate-fade-up mt-3 max-w-xl text-lg [animation-delay:100ms]">
            {t("heroText")}
          </p>
          <ul className="animate-fade-up mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 [animation-delay:200ms] sm:grid-cols-4">
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
          <SectionHeading id="contact-cards" title={t("cardsTitle")} />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {cards.map(({ icon: Icon, title, text, value, href, external }, i) => (
              <Reveal as="li" key={title} delay={i * 70}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group border-border rounded-card hover:border-brand-600 flex h-full flex-col items-center gap-2 border bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 flex size-12 items-center justify-center rounded-xl transition-colors duration-300 group-hover:text-white">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="font-semibold">{title}</span>
                  <span className="text-muted-foreground text-sm">{text}</span>
                  <span className="text-brand-800 mt-auto inline-flex max-w-full items-center gap-1 text-sm font-medium break-all">
                    {value}
                    <ArrowRight
                      className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>

          <Reveal className="rounded-card bg-accent-300/50 mt-5 flex flex-col items-center gap-2 p-4 text-center">
            <PackageSearch className="text-brand-800 size-8 shrink-0" aria-hidden />
            <div>
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
          <SectionHeading title={t("formTitle")} text={t("formText")} className="mb-6" />
          <EnquiryForm whatsapp={storeConfig.whatsapp} defaultMessage={tEnq("defaultMessage")} />
        </Reveal>
      </div>

      {/* FAQ */}
      <Reveal as="section" className="mx-auto max-w-3xl px-4 pb-10">
        <span id="faq" className="block scroll-mt-24" />
        <SectionHeading title={t("faqTitle")} />
        <div className="mt-6">
          <Faq />
        </div>
      </Reveal>

      {/* Business details strip */}
      <Reveal as="section" className="mx-auto max-w-3xl px-4 pb-12">
        <div className="bg-brand-50 rounded-card flex flex-col items-center gap-2 px-5 py-4 text-center text-sm">
          <p className="text-brand-800 flex items-center gap-2 font-semibold">
            <BadgeCheck className="size-5" aria-hidden /> {t("businessTitle")}
          </p>
          <p>
            {storeConfig.nameHi} ({storeConfig.name})
          </p>
          <p className="text-muted-foreground">
            {tFooter("licence")}: <strong className="text-foreground">{storeConfig.licenceNo}</strong> ·{" "}
            {tFooter("gstin")}: <strong className="text-foreground">{storeConfig.gstin}</strong>
          </p>
        </div>
      </Reveal>
    </>
  );
}
