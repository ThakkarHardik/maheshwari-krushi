# Maheshwari Krishi Sewa Kendra — Master Prompt

Paste the prompt below into your AI coding tool and ask for one phase at a time ("Do Phase 1 only").
Items still to confirm with the client are marked `[CONFIRM: ...]`.

```text
You are a senior full-stack engineer. Build a production-ready e-commerce web application
for "Maheshwari Krishi Sewa Kendra" (महेश्वरी कृषि सेवा केन्द्र), a local agricultural input store in
Sailana, District Ratlam, Madhya Pradesh. It sells a small curated catalogue (seeds, plant tonics,
animal fodder seeds, other farm inputs) to farmers, and needs a full admin panel for the owner to
manage products, stock, orders, enquiries, payments and reports.

## Seller details (use in footer, invoices, legal pages and seed data)
- Legal / display name: Maheshwari Krishi Sewa Kendra
- Licence number: 890 [CONFIRM: licence type — seed / fertiliser / insecticide — and validity date]
- GSTIN: 23ACRPM5603Q1Z2 (state code 23 = Madhya Pradesh)
- Address: 88, M.G. Road, Sailana, District Ratlam, Madhya Pradesh – 457550
- Phone / WhatsApp: +91 99933 38008 (wa.me/919993338008)
- Email: maheshwariksksailana@gmail.com
- Order number format: MKSC + number, e.g. #MKSC12345

## Users & context
- Customers are farmers of the Malwa region: low-end Android phones, slow 3G/4G, Hindi speakers,
  prefer UPI / QR and Cash on Delivery, and WhatsApp communication.
- The UI is HINDI-FIRST (default locale hi-IN) with an English toggle. All strings via next-intl.
- Admin users: Owner (full access), Manager (products/orders/stock/enquiries), Packer (view & update order status only).
- Currency INR, timezone Asia/Kolkata. Product prices are shown INCLUSIVE of GST ("सभी कर सहित").

## Approved UI design (from the client mock-up — follow it closely)
Brand: green theme (primary dark green ~#1B5E20, light green surfaces, yellow ~#F9D65C for the
Enquiry/WhatsApp button), leaf logo with "महेश्वरी कृषि सेवा केन्द्र", clean white cards, rounded corners.

Header nav: होम · हमारे बारे में · उत्पाद · कार्ट · संपर्क करें, plus search icon and cart icon with item count.

Website flow:
होम पेज → प्रोडक्ट लिस्ट पेज → प्रोडक्ट डिटेल पेज → Add to Cart / Buy Now
  → "खरीदना चाहते हैं?"  हाँ → कार्ट पेज → चेकआउट पेज → ऑर्डर सफल पेज
                         नहीं → Enquiry / WhatsApp (नाम, मोबाइल नंबर, मैसेज)

Pages:
1. Home (होम): hero banner with headline "बेहतरीन उत्पाद, बेहतर फसल", tagline
   "सही सलाह • सही उत्पाद • सही दाम", button "अभी खरीदें"; section "हमारे प्रमुख उत्पाद" (featured
   product cards: image, name, sub-label, button "विवरण देखें"); button "सभी उत्पाद देखें".
2. Product list (हमारे सभी उत्पाद): breadcrumb (होम > उत्पाद), left category sidebar "श्रेणी":
   सभी उत्पाद, बीज, प्लांट टॉनिक, पशु चारा, अन्य (categories manageable from admin);
   sort dropdown ("नया पहले", price low→high, high→low); product grid cards with image, name,
   sub-label (e.g. "(प्लांट टॉनिक)", "(चारे के लिए ज्वार)", "(कॉटन बीज)"), price, "विवरण देखें".
   On mobile the sidebar becomes a horizontal chip filter.
3. Product detail: image gallery with thumbnails, name + sub-label, star rating with review count,
   price with "(सभी कर सहित)", "उत्पाद विवरण" description, bullet list of benefits with check icons,
   quantity stepper (मात्रा), three buttons: "Buy Now" (dark green), "Add to Cart" (green),
   "Enquiry / WhatsApp" (yellow). Also show licence/registration no., manufacturer, batch expiry,
   dosage/usage and suitable crops when filled in.
4. Cart (आपका कार्ट): table of product (image, name), quantity stepper, price, line total, remove ×;
   "शॉपिंग जारी रखें" button; right side "ऑर्डर समरी": कुल आइटम, कुल मूल्य, शिपिंग, कुल भुगतान,
   button "चेकआउट करें".
5. Checkout: three columns on desktop (stacked on mobile):
   "डिलीवरी जानकारी" — पूरा नाम*, मोबाइल नंबर*, पता*, शहर*, पिनकोड*;
   "पेमेंट विकल्प" — UPI / QR Code, डेबिट / क्रेडिट कार्ड, कैश ऑन डिलीवरी (COD);
   "ऑर्डर समरी" — कुल मूल्य, शिपिंग, कुल भुगतान, button "ऑर्डर कन्फर्म करें".
   Trust strip below: सुरक्षित पेमेंट · बेहतर क्वालिटी · त्वरित डिलीवरी · 100% भरोसा.
6. Order success: big green check, "धन्यवाद! आपका ऑर्डर सफलतापूर्वक प्राप्त हो गया है!",
   order number box "आपका ऑर्डर नंबर: #MKSC12345", text "हम आपके ऑर्डर की पुष्टि कर रहे हैं। जल्द ही
   आपके दिए गए नंबर पर ऑर्डर की जानकारी भेज दी जाएगी।", button "होम पेज पर जाएं".
7. Enquiry: modal/page with नाम, मोबाइल नंबर, मैसेज (product pre-filled when opened from a product)
   → saves an Enquiry record AND offers "WhatsApp पर भेजें" which opens wa.me/<store number> with a
   pre-filled Hindi message containing the product name.
8. Also: हमारे बारे में, संपर्क करें (address, map, phone, WhatsApp), Track Order (order no. + mobile),
   Terms, Privacy, Refund/Return policy, Shipping policy, Grievance officer
   (Consumer Protection (E-Commerce) Rules 2020). Floating WhatsApp button on all pages.

## Tech stack (do not deviate without asking)
- Next.js 15 App Router + TypeScript (strict), Server Actions / Route Handlers
- Tailwind CSS + shadcn/ui, mobile-first, Lighthouse mobile performance ≥ 90, Hindi font (Noto Sans Devanagari / Mukta)
- PostgreSQL + Prisma ORM, migrations committed
- Auth: customers check out as GUEST with name + mobile (no forced login, as per design);
  optional mobile OTP (provider [MSG91], pluggable) used for "My Orders" and, if enabled in settings, to verify COD orders.
  Admins via email + password (bcrypt) with optional TOTP.
- Payments: Razorpay (Standard Checkout: UPI/QR, cards, net banking) behind a PaymentProvider interface
  so Cashfree/PhonePe can be added later
- File storage: [Cloudinary/Supabase Storage] for product images (auto-resize, WebP)
- Notifications: SMS/WhatsApp via a NotificationProvider interface ([MSG91/Interakt]) — order placed, confirmed, shipped, delivered
- PDF invoices: server-side generation (e.g. @react-pdf/renderer)
- Validation: Zod on every input (Indian 10-digit mobile, 6-digit pincode). Testing: Vitest + Playwright. ESLint + Prettier.
- Deploy target: Vercel + Neon Postgres. All secrets in env vars; provide .env.example.

## Data model (Prisma)
Customer (name, mobile unique, optional verified flag), Address (name, mobile, line, city, pincode, state),
AdminUser (role), Category (name_hi, name_en, slug, sortOrder), Crop, Product (name_hi, name_en,
subLabel_hi, description_hi/en, benefits[] , usage/dosage, manufacturer, licenceNo, hsnCode, gstRate,
isFeatured, isActive), ProductImage, ProductVariant (packSize, unit, sku, mrp, price incl. GST, isActive),
ProductCrop, Review (rating 1–5, text, customer, approved flag), InventoryBatch (batchNo, mfgDate,
expiryDate, qtyAvailable, costPrice), StockMovement (type: PURCHASE|SALE|RESERVE|RELEASE|RETURN|DAMAGE|ADJUSTMENT,
qty, reason, adminUserId), Cart, CartItem, Order (orderNumber MKSC…, status, paymentMethod UPI|CARD|COD,
paymentStatus, subtotal, shipping, discount, taxable value, CGST/SGST/IGST, grandTotal, address snapshot),
OrderItem (price/tax snapshot, batch allocation), OrderStatusHistory, Payment (gateway ids, status, raw payload),
Refund, Enquiry (name, mobile, message, productId?, status NEW|CONTACTED|CONVERTED|CLOSED, notes),
Coupon, ServiceablePincode (pincode, deliveryCharge, codAllowed, etaDays), Setting, AuditLog.
Use Decimal for money, never floats. Soft-delete products.

## Pricing & tax rules
- Selling price includes GST. Invoice back-calculates taxable value and tax.
- Delivery inside Madhya Pradesh (state code 23) → CGST + SGST; outside MP → IGST.
- Shipping: flat ₹60 by default (configurable in settings; per-pincode override; optional free-shipping threshold).
- Invoice shows seller name, address, GSTIN 23ACRPM5603Q1Z2, licence no. 890, HSN, batch no., expiry.

## Admin features (/admin, Hindi + English, role-based access enforced server-side)
1. Dashboard: today's / this month's orders & revenue, pending orders, new enquiries, low-stock,
   near-expiry (≤60 days), COD amount pending collection.
2. Products CRUD with variants, images, categories, crops, benefits list, featured toggle, publish toggle, CSV import/export.
3. Inventory: add purchase batches, FEFO (first-expiry-first-out) allocation on sale, manual adjustments
   with mandatory reason, full stock-movement ledger, low-stock thresholds per variant.
4. Orders: list with filters, detail view, status transitions PENDING→CONFIRMED→PACKED→SHIPPED→DELIVERED
   (+CANCELLED, RETURNED) validated, notes, courier/AWB field, print GST invoice & packing slip,
   mark COD collected, initiate refund (full/partial), one-click "WhatsApp customer".
5. Enquiries: list of enquiry leads, status, notes, call / WhatsApp buttons, convert to order.
6. Reviews moderation (approve / hide).
7. Customers: list, order history, notes, block.
8. Coupons, serviceable pincodes, store settings (seller details, GSTIN, licence no., invoice prefix,
   WhatsApp number, shipping charge, COD limits, banners, home featured products).
9. Reports: sales by day/product/category, GST summary (CGST/SGST/IGST by HSN), stock valuation, CSV export.
10. Audit log of all admin actions.

## Payment rules (critical — implement exactly)
- Server recalculates all prices, taxes, shipping and discounts from the DB; never trust client amounts.
- On "ऑर्डर कन्फर्म करें": create Order (PENDING) + reserve stock in a DB transaction (row-level locking /
  atomic decrement) to prevent overselling.
- ONLINE (UPI/QR or card): create Razorpay order (amount in paise, receipt = orderNumber), open checkout,
  verify razorpay_signature on the server with HMAC SHA256, then show the success page.
- Implement /api/webhooks/razorpay: verify X-Razorpay-Signature, handle payment.captured, payment.failed,
  refund.processed; idempotent (store event id, ignore duplicates). Webhook is the source of truth.
- Unpaid ONLINE orders auto-expire after 15 minutes (scheduled job) and release reserved stock;
  show a Hindi "पेमेंट असफल — दोबारा कोशिश करें" page with retry and "COD से ऑर्डर करें" options.
- COD orders go to CONFIRMED-pending-call state, reserve stock; optional OTP verification and max COD value from settings.
- Refunds via Razorpay API, recorded in Refund table; stock returned only when admin marks items restocked.
- Use Razorpay test mode until I say go live.

## Non-functional requirements
- Security: OWASP top 10, CSRF protection, rate limiting on enquiry/OTP/checkout (and spam protection on enquiry form),
  secure cookies, input validation, no secrets in client bundle, role checks in every admin action.
- Performance: optimised images, works on slow 3G, ISR/caching for catalogue pages.
- SEO: Hindi + English metadata, sitemap.xml, robots.txt, product JSON-LD, LocalBusiness JSON-LD for the Sailana store.
- Accessibility: large tap targets, readable Devanagari fonts, icons with labels (low-literacy friendly).
- Observability: structured logging, error tracking hook (Sentry-ready).
- Seed script with: seller settings above; categories बीज, प्लांट टॉनिक, पशु चारा, अन्य; sample products
  "तार्वर्त पावर (प्लांट टॉनिक)" ₹650, "CSV 33 MF (चारे के लिए ज्वार)" ₹850, "RUSTAM 99 (कॉटन बीज)" ₹1,250,
  "भिंडी बीज (हाइब्रिड क्वालिटी)" ₹450 [CONFIRM exact names, pack sizes, HSN, GST rates];
  Ratlam-district pincodes incl. 457550; one Owner admin account.
- README with setup, env vars, scripts, deployment steps and Razorpay webhook setup.

## How to work
- Work in phases; at the start of each phase show the plan and files you will touch, then implement,
  then run lint, type-check and tests, then summarise what was done and what is next.
  Phase 1: project setup, design tokens (green theme), layout/header/footer, Prisma schema, seed, admin auth & roles.
  Phase 2: catalogue — admin product/category CRUD + Home, Product list, Product detail pages per the design.
  Phase 3: Enquiry / WhatsApp flow + admin enquiries.
  Phase 4: inventory batches & stock ledger.
  Phase 5: cart, checkout (guest), pincode/shipping, COD, order success page.
  Phase 6: Razorpay online payments (UPI/QR, cards), webhooks, expiry job, refunds.
  Phase 7: admin order management, GST invoices, SMS/WhatsApp notifications, track order.
  Phase 8: reviews, dashboard, reports, English locale.
  Phase 9: tests (unit for pricing/GST/stock/payment logic, Playwright for the full flow), security hardening, deploy docs.
- Ask me before adding any dependency not listed, or if any requirement is ambiguous.
- Keep code modular: /lib/payments, /lib/notifications, /lib/inventory, /lib/pricing, /lib/tax with unit tests.

Start with Phase 1 only.
```
