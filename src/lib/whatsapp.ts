/**
 * Builds a wa.me deep link. `phone` must include the country code, digits only
 * (e.g. "919993338008").
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(digits)) {
    throw new Error(`Invalid WhatsApp number: ${phone}`);
  }
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
