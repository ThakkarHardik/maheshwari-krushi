import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";

// Locale comes from a cookie (no /hi or /en URL prefix); Hindi by default.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    timeZone: "Asia/Kolkata",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
