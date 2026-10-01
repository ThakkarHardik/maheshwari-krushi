import "server-only";
import { storeConfig } from "@/config/store";
import { db } from "@/lib/db";
import { renderTemplate, type NotificationEvent, type TemplateVars } from "./templates";

/**
 * Sends order messages through a provider, or queues them for staff to send
 * by WhatsApp from the admin panel when no provider is configured.
 *
 * NOTIFY_DRIVER=manual (default) → messages are QUEUED; staff tap "Send on WhatsApp".
 * Add an SMS/WhatsApp provider (MSG91, Interakt, Gupshup) by implementing
 * NotificationProvider once the account and DLT templates are approved.
 */
export interface NotificationProvider {
  readonly name: string;
  /** True when the provider delivers messages by itself (no staff action). */
  readonly automatic: boolean;
  send(message: { to: string; body: string; event: NotificationEvent }): Promise<void>;
}

const manualProvider: NotificationProvider = {
  name: "manual",
  automatic: false,
  async send() {
    // Nothing to do — the message waits in the outbox for staff.
  },
};

export function getNotificationProvider(): NotificationProvider {
  // Only the manual driver exists today; see the comment above for adding providers.
  return manualProvider;
}

type Notify = {
  event: NotificationEvent;
  to: string;
  audience: "CUSTOMER" | "OWNER";
  vars: TemplateVars;
  orderId?: string;
};

/** Never throws: a message failing must not undo the order change that triggered it. */
export async function notify({ event, to, audience, vars, orderId }: Notify) {
  const provider = getNotificationProvider();
  // Owner alerts only make sense when they arrive by themselves; in manual mode
  // the admin panel (badges, dashboard) is the owner's alert.
  if (audience === "OWNER" && !provider.automatic) return;

  const body = renderTemplate(event, vars);
  try {
    const row = await db.notification.create({
      data: {
        orderId,
        channel: "WHATSAPP",
        audience,
        recipient: to,
        template: event,
        body,
        provider: provider.name,
        status: "QUEUED",
      },
    });
    if (!provider.automatic) return;
    try {
      await provider.send({ to, body, event });
      await db.notification.update({ where: { id: row.id }, data: { status: "SENT", sentAt: new Date() } });
    } catch (error) {
      await db.notification.update({
        where: { id: row.id },
        data: { status: "FAILED", error: String(error).slice(0, 500) },
      });
    }
  } catch (error) {
    console.error("notify failed", event, error);
  }
}

export const OWNER_MOBILE = storeConfig.phone;
