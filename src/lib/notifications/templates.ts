import { storeConfig } from "@/config/store";

/**
 * Customer / owner message texts (Hindi — the customers' language).
 * When an SMS provider is added, each event maps to one DLT-approved template.
 */
export type NotificationEvent =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "OWNER_NEW_ORDER"
  | "OWNER_NEW_ENQUIRY";

export type TemplateVars = {
  name?: string;
  orderNumber?: string;
  total?: string;
  city?: string;
  mobile?: string;
  courier?: string | null;
  tracking?: string | null;
  product?: string | null;
};

const SIGN = `— ${storeConfig.nameHi}, ${storeConfig.phone}`;

export function renderTemplate(event: NotificationEvent, v: TemplateVars): string {
  switch (event) {
    case "ORDER_PLACED":
      return `नमस्ते ${v.name} जी, आपका ऑर्डर #${v.orderNumber} (${v.total}) हमें मिल गया है। हम जल्द ही कॉल करके पुष्टि करेंगे। ${SIGN}`;
    case "ORDER_CONFIRMED":
      return `नमस्ते ${v.name} जी, आपका ऑर्डर #${v.orderNumber} कन्फर्म हो गया है और जल्द ही भेजा जाएगा। ${SIGN}`;
    case "ORDER_SHIPPED": {
      const via = [v.courier, v.tracking ? `ट्रैकिंग नंबर ${v.tracking}` : null].filter(Boolean).join(", ");
      return `नमस्ते ${v.name} जी, आपका ऑर्डर #${v.orderNumber} भेज दिया गया है${via ? ` (${via})` : ""}। कैश ऑन डिलीवरी हो तो ${v.total} तैयार रखें। ${SIGN}`;
    }
    case "ORDER_DELIVERED":
      return `नमस्ते ${v.name} जी, आपका ऑर्डर #${v.orderNumber} डिलीवर हो गया है। हमसे खरीदारी के लिए धन्यवाद! ${SIGN}`;
    case "ORDER_CANCELLED":
      return `नमस्ते ${v.name} जी, आपका ऑर्डर #${v.orderNumber} रद्द कर दिया गया है। किसी भी जानकारी के लिए ${storeConfig.phone} पर कॉल करें। ${SIGN}`;
    case "OWNER_NEW_ORDER":
      return `नया ऑर्डर #${v.orderNumber}: ${v.name} (${v.mobile}), ${v.city}, कुल ${v.total}`;
    case "OWNER_NEW_ENQUIRY":
      return `नई पूछताछ: ${v.name} (${v.mobile})${v.product ? ` — ${v.product}` : ""}`;
  }
}

/** Which customer message (if any) to send when an order moves to a status. */
export function eventForStatus(status: string): NotificationEvent | null {
  switch (status) {
    case "CONFIRMED":
      return "ORDER_CONFIRMED";
    case "SHIPPED":
      return "ORDER_SHIPPED";
    case "DELIVERED":
      return "ORDER_DELIVERED";
    case "CANCELLED":
      return "ORDER_CANCELLED";
    default:
      return null;
  }
}
