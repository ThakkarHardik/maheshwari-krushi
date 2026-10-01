import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EnquiryForm } from "@/components/store/enquiry-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storeConfig } from "@/config/store";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return { title: t("title") };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const tWa = await getTranslations("whatsapp");
  const tEnq = await getTranslations("enquiry");

  const rows = [
    { icon: MapPin, label: t("address"), value: storeConfig.addressHi },
    {
      icon: Phone,
      label: t("phone"),
      value: `+91 ${storeConfig.phone}`,
      href: `tel:+91${storeConfig.phone}`,
    },
    { icon: Mail, label: t("email"), value: storeConfig.email, href: `mailto:${storeConfig.email}` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-brand-800 text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-3 text-lg">{t("intro")}</p>

      <Card className="mt-8">
        <CardContent className="space-y-5 py-6">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex gap-3">
              <Icon className="text-brand-600 mt-1 size-5 shrink-0" aria-hidden />
              <div>
                <p className="text-muted-foreground text-sm">{label}</p>
                {href ? (
                  <a href={href} className="text-brand-800 text-lg font-medium break-all hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="text-lg font-medium">{value}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="primary" size="lg">
          <a href={`tel:+91${storeConfig.phone}`}>
            <Phone /> {t("callNow")}
          </a>
        </Button>
        <Button asChild variant="accent" size="lg">
          <a
            href={buildWhatsAppLink(storeConfig.whatsapp, tWa("defaultMessage"))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle /> {t("chatOnWhatsapp")}
          </a>
        </Button>
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>{tEnq("contactTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">{tEnq("subtitle")}</p>
        </CardHeader>
        <CardContent className="py-5">
          <EnquiryForm whatsapp={storeConfig.whatsapp} defaultMessage={tEnq("defaultMessage")} />
        </CardContent>
      </Card>
    </div>
  );
}
