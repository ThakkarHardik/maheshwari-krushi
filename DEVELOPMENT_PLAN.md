# Development Plan — Maheshwari Krishi Sewa Kendra Website

Based on the client's design: the website flow and 6 page designs. See [MASTER_PROMPT.md](MASTER_PROMPT.md) for the full build prompt.

---

## 1. Website flow (from the client design)

```
Open website → Home → Product list → Product detail → Add to Cart / Buy Now
                                                         │
                                          "खरीदना चाहते हैं?"
                                    हाँ ┌───────┴───────┐ नहीं
                                        ▼               ▼
                                  Cart page     Enquiry / WhatsApp
                                        ▼       (नाम, मोबाइल, मैसेज)
                                  Checkout page
                              (delivery info, payment)
                                        ▼
                               Order success page
                              (order no. #MKSC12345)
```

## 2. Pages

| # | Page | Key elements |
|---|---|---|
| 1 | होम | Hero "बेहतरीन उत्पाद, बेहतर फसल", tagline, "अभी खरीदें", featured products, "सभी उत्पाद देखें" |
| 2 | प्रोडक्ट लिस्ट | Category sidebar (सभी उत्पाद / बीज / प्लांट टॉनिक / पशु चारा / अन्य), sort, product grid |
| 3 | प्रोडक्ट डिटेल | Gallery, rating, price "(सभी कर सहित)", description, benefits, quantity, Buy Now / Add to Cart / Enquiry-WhatsApp |
| 4 | कार्ट | Items, quantity, remove, order summary (items, total, shipping ₹60, payable), checkout |
| 5 | चेकआउट | Name, mobile, address, city, pincode; UPI/QR, card, COD; order summary; trust strip |
| 6 | ऑर्डर सफल | Thank-you message, order number, home button |
| + | Enquiry form/modal | Name, mobile, message → saved for admin + opens WhatsApp |
| + | हमारे बारे में, संपर्क करें, Track Order, policy pages | Not in the mock-up, but legally needed or expected |
| + | Admin panel | Products, stock, orders, enquiries, reviews, reports, settings |

## 3. Changes made because of the client design

| Earlier plan | Updated plan | Why |
|---|---|---|
| Phone OTP login required | **Guest checkout** (name + mobile); OTP optional | The checkout design has no login step |
| English + Hindi + Marathi/Gujarati | **Hindi-first**, English as secondary | Store is in MP; the design is in Hindi |
| Categories: seeds, fertiliser, pesticide, tools | **बीज, प्लांट टॉनिक, पशु चारा, अन्य** | Client's categories (editable in admin) |
| — | **Enquiry / WhatsApp flow + admin enquiry inbox** | "नहीं" branch in the flow |
| — | **Product reviews and star ratings** | Shown on the product detail page |
| Shipping per pincode | **Flat ₹60 by default**, per-pincode override | Shown in the cart and checkout design |
| Prices + GST on top | **Prices inclusive of GST** | "(सभी कर सहित)" on the product page |
| Order no. MK-2026-… | **#MKSC12345** | Shown on the success page |
| — | **Trust strip, green theme, yellow WhatsApp button** | Visual design |

## 4. Tech stack

| Layer | Choice |
|---|---|
| Website + server | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui, Noto Sans Devanagari / Mukta font |
| Database | PostgreSQL (Neon / Supabase) + Prisma |
| Payments | Razorpay (UPI/QR, cards), COD |
| SMS / WhatsApp | MSG91 / Interakt |
| Images | Cloudinary / Supabase Storage |
| Hosting | Vercel + Neon |
| Languages | next-intl (hi default, en) |

## 5. Phase-wise plan

| Phase | Time | Work | Done when |
|---|---|---|---|
| **0. Groundwork** | Week 1 | Confirm licence type and validity; collect product list (names, photos, pack sizes, prices, HSN, GST %); WhatsApp number; domain; Razorpay KYC; policy texts | All client inputs received |
| **1. Setup** | Week 1–2 | Project setup, green design theme, header/footer, database tables, seed data with seller details, admin login and roles | Admin can log in; site layout is visible |
| **2. Catalogue** | Week 2–3 | Admin product/category management; Home, Product list, Product detail pages as in the design | Products appear exactly like the mock-up |
| **3. Enquiry / WhatsApp** | Week 3 | Enquiry form, WhatsApp deep link, admin enquiry inbox | Enquiry saved and WhatsApp opens with message |
| **4. Stock** | Week 3–4 | Batches with expiry dates, stock movement log, low-stock and expiry alerts | Stock goes down on order, ledger visible |
| **5. Cart + Checkout + COD** | Week 4 | Cart, guest checkout, pincode check, ₹60 shipping, COD orders, success page with MKSC number | A full COD order works end to end |
| **6. Online payment** | Week 5 | Razorpay UPI/QR and cards, signature check, webhooks, 15-minute expiry for unpaid orders, refunds | Test-mode payments and refunds work |
| **7. Order management** | Week 5–6 | Order statuses, GST invoice PDF (CGST/SGST or IGST), packing slip, SMS/WhatsApp updates, track order | Owner can process an order to delivery |
| **8. Reviews, dashboard, reports** | Week 6–7 | Reviews and moderation, dashboard, sales and GST reports, CSV export, English locale | Owner sees daily numbers |
| **9. Testing & launch** | Week 7–8 | Automated tests, checks on low-end phones and slow internet, security review, Google search basics, live Razorpay keys, soft launch with 20–50 known farmers | Live website taking real orders |
| **10. After launch** | Ongoing | ONDC listing, seasonal crop kits, crop-advice blog, loyalty, Android app | — |

**Estimated time:** 7–8 weeks with one developer using AI help.

## 6. Payment flow

1. The customer clicks "ऑर्डर कन्फर्म करें". The server recalculates prices, creates the order and **holds stock**.
2. **COD:** the order is confirmed and the owner gets a notification. Optionally, the customer verifies with an OTP.
3. **UPI/QR or card:** the server creates a Razorpay order and the Razorpay screen opens. After payment, the server checks the signature and shows the success page.
4. A **webhook** from Razorpay confirms the payment, so it still works if the customer closes the browser.
5. Unpaid orders expire after 15 minutes and the held stock is released. The customer sees "दोबारा कोशिश करें" or "COD से ऑर्डर करें".

## 7. Approximate running cost

| Item | Cost |
|---|---|
| Domain (.in) | ~₹800–1,000 / year |
| Hosting + database | ₹0–2,000 / month at the start |
| SMS (OTP / order updates) | ~₹0.20 per SMS + DLT registration |
| Razorpay | ~2% of each online payment (COD free) |
| WhatsApp Business API (optional) | Per-conversation charges; a free WhatsApp link works from day one |

## 8. Pending inputs from the client

- [ ] Licence No. 890: type (seed / fertiliser / insecticide) and expiry date
- [x] Phone / WhatsApp: +91 99933 38008 · Email: maheshwariksksailana@gmail.com
- [ ] Final product list: exact names, pack sizes, MRP / selling price, HSN code, GST %, photos, descriptions, benefits
- [ ] Delivery area (which pincodes) and whether ₹60 shipping applies everywhere
- [ ] COD limit (maximum order value) and whether COD needs OTP
- [ ] Return / refund policy terms
- [ ] Logo in high resolution, and banner images
- [ ] Domain name preference (e.g. maheshwarikrishi.in)
