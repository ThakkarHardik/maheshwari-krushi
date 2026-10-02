import { storeConfig as s } from "@/config/store";

/**
 * Policy texts (Hindi + English). DRAFTS written for an agri-input store —
 * the client should have them reviewed (ideally by a lawyer/CA) before launch.
 * {placeholders} are filled at render time from settings.
 */
export type LegalDoc = { title: string; sections: { heading: string; body: string[] }[] };
export type LegalKey = "terms" | "privacy" | "refund" | "shipping";

const contactHi = `${s.nameHi}, ${s.addressHi} · फ़ोन / WhatsApp: +91 ${s.phone} · ईमेल: ${s.email}`;
const contactEn = `${s.name}, ${s.address.line1}, ${s.address.city}, Dist. ${s.address.district}, ${s.address.state} – ${s.address.pincode} · Phone / WhatsApp: +91 ${s.phone} · Email: ${s.email}`;

export const LAST_UPDATED = "2026-10-02";

export const legal: Record<"hi" | "en", Record<LegalKey, LegalDoc>> = {
  hi: {
    terms: {
      title: "नियम और शर्तें",
      sections: [
        {
          heading: "विक्रेता",
          body: [
            `यह वेबसाइट ${s.nameHi} द्वारा चलाई जाती है। GSTIN: ${s.gstin} · लाइसेंस नंबर: ${s.licenceNo}।`,
            contactHi,
          ],
        },
        {
          heading: "उत्पाद और उपयोग",
          body: [
            "हम उत्पाद की जानकारी, फोटो और कीमत सही रखने की पूरी कोशिश करते हैं। पैकेट/बोतल पर छपी जानकारी ही अंतिम मानी जाएगी।",
            "बीज, प्लांट टॉनिक और अन्य कृषि उत्पादों का उपयोग पैकेट पर लिखे निर्देशों और मात्रा के अनुसार ही करें। बच्चों और पशुओं की पहुँच से दूर रखें।",
            "फसल का परिणाम मौसम, मिट्टी, सिंचाई और उपयोग के तरीके पर निर्भर करता है, इसलिए किसी निश्चित पैदावार की गारंटी नहीं दी जा सकती।",
          ],
        },
        {
          heading: "कीमत और ऑर्डर",
          body: [
            "सभी कीमतें भारतीय रुपये में और GST सहित हैं। डिलीवरी चार्ज चेकआउट पर अलग से दिखाया जाता है।",
            "ऑर्डर मिलने के बाद हम फ़ोन या WhatsApp पर पुष्टि करते हैं। स्टॉक खत्म होने, कीमत में गलती या डिलीवरी संभव न होने पर हम ऑर्डर रद्द कर सकते हैं; ऐसे में पहले से किया गया भुगतान पूरा लौटाया जाएगा।",
          ],
        },
        {
          heading: "ज़िम्मेदारी",
          body: [
            "किसी भी दावे में हमारी ज़िम्मेदारी उस उत्पाद के लिए चुकाई गई कीमत तक सीमित है।",
            "ये शर्तें भारत के कानून के अनुसार हैं। किसी विवाद में रतलाम (मध्यप्रदेश) के न्यायालय का क्षेत्राधिकार होगा।",
          ],
        },
        {
          heading: "शिकायत अधिकारी",
          body: [
            "उपभोक्ता संरक्षण (ई-कॉमर्स) नियम, 2020 के अनुसार शिकायत के लिए संपर्क करें:",
            `शिकायत अधिकारी — ${s.nameHi} · फ़ोन: +91 ${s.phone} · ईमेल: ${s.email}`,
            "हम 48 घंटे में शिकायत की पावती देंगे और एक महीने के भीतर समाधान करेंगे।",
          ],
        },
      ],
    },
    privacy: {
      title: "गोपनीयता नीति",
      sections: [
        {
          heading: "हम कौन सी जानकारी लेते हैं",
          body: [
            "ऑर्डर और पूछताछ के लिए: नाम, मोबाइल नंबर, डिलीवरी पता, ऑर्डर की जानकारी और आपके भेजे गए मैसेज/समीक्षा।",
            "वेबसाइट चलाने के लिए ज़रूरी कुकीज़: कार्ट, चुनी गई भाषा और (स्टाफ के लिए) लॉगिन। हम विज्ञापन या ट्रैकिंग कुकीज़ का उपयोग नहीं करते।",
          ],
        },
        {
          heading: "जानकारी का उपयोग",
          body: [
            "आपका ऑर्डर पूरा करने, डिलीवरी करने, बिल (GST इनवॉइस) बनाने, आपकी पूछताछ का जवाब देने और ऑर्डर की जानकारी भेजने के लिए।",
            "हम आपकी जानकारी बेचते नहीं हैं। सिर्फ डिलीवरी करने वाले और (ऑनलाइन भुगतान पर) पेमेंट कंपनी के साथ उतनी ही जानकारी साझा होती है जितनी काम के लिए ज़रूरी है।",
          ],
        },
        {
          heading: "सुरक्षा और अवधि",
          body: [
            "जानकारी सुरक्षित सर्वर पर रखी जाती है और सिर्फ अधिकृत स्टाफ देख सकता है।",
            "ऑर्डर और बिल का रिकॉर्ड टैक्स कानून के अनुसार ज़रूरी अवधि तक रखा जाता है।",
          ],
        },
        {
          heading: "आपके अधिकार",
          body: [
            "डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुसार आप अपनी जानकारी देखने, सुधारने या (कानूनी रिकॉर्ड छोड़कर) हटाने का अनुरोध कर सकते हैं।",
            contactHi,
          ],
        },
      ],
    },
    refund: {
      title: "वापसी और रिफंड नीति",
      sections: [
        {
          heading: "ऑर्डर रद्द करना",
          body: [
            "ऑर्डर भेजे जाने से पहले आप फ़ोन या WhatsApp करके बिना किसी शुल्क के ऑर्डर रद्द कर सकते हैं।",
          ],
        },
        {
          heading: "वापसी कब होगी",
          body: [
            "बीज और कृषि रसायन की गुणवत्ता और सुरक्षा के कारण खुले या उपयोग किए गए पैकेट वापस नहीं लिए जाते।",
            "अगर उत्पाद टूटा-फूटा, गलत या एक्सपायर्ड पहुँचे, तो डिलीवरी के 48 घंटे के भीतर पैकेट की फोटो के साथ WhatsApp करें। जाँच के बाद हम उत्पाद बदल देंगे या पैसे लौटा देंगे।",
          ],
        },
        {
          heading: "रिफंड",
          body: [
            "ऑनलाइन भुगतान का रिफंड 5–7 कार्य दिवस में उसी तरीके से लौटाया जाता है।",
            "कैश ऑन डिलीवरी ऑर्डर का रिफंड UPI या बैंक ट्रांसफर से किया जाता है।",
            contactHi,
          ],
        },
      ],
    },
    shipping: {
      title: "डिलीवरी नीति",
      sections: [
        {
          heading: "डिलीवरी क्षेत्र और समय",
          body: [
            "हम {deliveryArea} पर डिलीवरी करते हैं। चेकआउट पर पिनकोड डालते ही डिलीवरी की उपलब्धता और अनुमानित समय दिख जाता है।",
            "आम तौर पर ऑर्डर की पुष्टि के 1–3 दिन में डिलीवरी हो जाती है। मौसम, त्योहार या दूरी के कारण देर हो सकती है।",
          ],
        },
        {
          heading: "डिलीवरी चार्ज",
          body: [
            "डिलीवरी चार्ज: {flatCharge} प्रति ऑर्डर{freeAbove}। कुछ पिनकोड पर चार्ज अलग हो सकता है — चेकआउट पर दिखेगा।",
          ],
        },
        {
          heading: "कैश ऑन डिलीवरी",
          body: ["{cod}"],
        },
      ],
    },
  },
  en: {
    terms: {
      title: "Terms and Conditions",
      sections: [
        {
          heading: "Seller",
          body: [
            `This website is operated by ${s.name}. GSTIN: ${s.gstin} · Licence No.: ${s.licenceNo}.`,
            contactEn,
          ],
        },
        {
          heading: "Products and use",
          body: [
            "We try our best to keep product information, photos and prices accurate. The details printed on the pack are final.",
            "Use seeds, plant tonics and other farm inputs only as directed on the pack. Keep out of reach of children and animals.",
            "Crop results depend on weather, soil, irrigation and method of use, so no particular yield can be guaranteed.",
          ],
        },
        {
          heading: "Prices and orders",
          body: [
            "All prices are in Indian Rupees and include GST. Delivery charges are shown separately at checkout.",
            "We confirm orders by phone or WhatsApp. We may cancel an order if stock runs out, a price is wrong, or delivery is not possible; any amount already paid will be refunded in full.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "Our liability for any claim is limited to the price paid for the product concerned.",
            "These terms are governed by the laws of India. Courts at Ratlam (Madhya Pradesh) have jurisdiction.",
          ],
        },
        {
          heading: "Grievance officer",
          body: [
            "As required by the Consumer Protection (E-Commerce) Rules, 2020, contact our grievance officer:",
            `Grievance Officer — ${s.name} · Phone: +91 ${s.phone} · Email: ${s.email}`,
            "We acknowledge complaints within 48 hours and resolve them within one month.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      sections: [
        {
          heading: "What we collect",
          body: [
            "For orders and enquiries: name, mobile number, delivery address, order details and the messages/reviews you send.",
            "Cookies needed to run the site: cart, chosen language and (for staff) sign-in. We do not use advertising or tracking cookies.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To fulfil and deliver your order, issue GST invoices, answer your enquiries and send order updates.",
            "We do not sell your data. Only delivery partners and (for online payments) the payment provider receive what they need to do their job.",
          ],
        },
        {
          heading: "Security and retention",
          body: [
            "Data is kept on secure servers and only authorised staff can see it.",
            "Order and invoice records are kept for as long as tax law requires.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Under the Digital Personal Data Protection Act, 2023 you can ask to see, correct or (except legal records) delete your data.",
            contactEn,
          ],
        },
      ],
    },
    refund: {
      title: "Return and Refund Policy",
      sections: [
        {
          heading: "Cancelling an order",
          body: ["You can cancel free of charge by phone or WhatsApp before the order is dispatched."],
        },
        {
          heading: "When returns are accepted",
          body: [
            "For quality and safety reasons, opened or used packs of seeds and agro-chemicals cannot be returned.",
            "If a product arrives damaged, wrong or expired, WhatsApp us a photo of the pack within 48 hours of delivery. After checking, we will replace it or refund you.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "Online payments are refunded to the original method within 5–7 working days.",
            "Cash on Delivery orders are refunded by UPI or bank transfer.",
            contactEn,
          ],
        },
      ],
    },
    shipping: {
      title: "Shipping Policy",
      sections: [
        {
          heading: "Delivery area and time",
          body: [
            "We deliver to {deliveryArea}. Enter your PIN code at checkout to see availability and the expected delivery time.",
            "Orders are usually delivered within 1–3 days of confirmation. Weather, festivals or distance may cause delays.",
          ],
        },
        {
          heading: "Delivery charges",
          body: [
            "Delivery charge: {flatCharge} per order{freeAbove}. Some PIN codes have a different charge — shown at checkout.",
          ],
        },
        { heading: "Cash on Delivery", body: ["{cod}"] },
      ],
    },
  },
};
