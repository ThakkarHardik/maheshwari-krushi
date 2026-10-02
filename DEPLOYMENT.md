# Deployment & Go-Live Guide — Maheshwari Krishi Sewa Kendra

This guide takes the site from this repository to a live address. Recommended setup:

| Piece | Service | Cost to start |
|---|---|---|
| Website hosting | [Vercel](https://vercel.com) (Hobby → Pro for commercial use) | Free / ~$20 per month |
| Database (PostgreSQL) | [Neon](https://neon.tech) | Free tier |
| Product photos | [Cloudinary](https://cloudinary.com) | Free tier |
| Domain | Any registrar (e.g. `maheshwarikrishi.in`) | ~₹800–1,000 per year |
| Online payments (Phase 6) | Razorpay | ~2% per payment |
| Automatic SMS (optional) | MSG91 + DLT registration | Per SMS |

> Vercel's free Hobby plan is for personal, non-commercial projects. A shop should use the Pro plan.

---

## 1. Database — Neon

1. Create a Neon project in the region closest to India (Singapore, or Mumbai if offered).
2. Copy **two** connection strings from the dashboard:
   - **Pooled** connection → `DATABASE_URL` (used by the website)
   - **Direct** connection → `DIRECT_DATABASE_URL` (used only for migrations)
3. Turn on Neon's point-in-time restore / backups.

## 2. Photos — Cloudinary

Create an account and copy **Cloud name**, **API key** and **API secret** from the dashboard.

## 3. Hosting — Vercel

1. Push the `main` branch to GitHub and import the repository in Vercel.
2. Framework preset: **Next.js**. Vercel runs `npm run vercel-build` automatically, which also applies database migrations.
3. Project → Settings → Functions → region **Mumbai (bom1)**, close to the customers.
4. Add these **Environment Variables** (Production):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_DATABASE_URL` | Neon direct connection string |
| `AUTH_SECRET` | 48+ random characters: `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.your-domain.in` |
| `STORAGE_DRIVER` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |

Do **not** set `DATABASE_POOL_MAX` in production; it is only for the local `prisma dev` database.

The app checks these at start-up and refuses to run with a missing or unsafe value, for example local photo storage on Vercel or a non-https site address.

5. Deploy.

## 4. First-time data (run once, from your computer)

With the production URLs in a temporary shell (never commit them):

```bash
DATABASE_URL="<direct url>" \
SEED_OWNER_EMAIL="maheshwariksksailana@gmail.com" \
SEED_OWNER_PASSWORD="<a long, unique password>" \
SEED_SAMPLE_PRODUCTS=false \
npm run db:seed
```

This creates the store settings, categories, crops, delivery PIN codes and the **Owner** login, without the sample products and their dummy stock. Then log in at `/admin` and:

1. Add the real products, pack sizes, photos and opening stock (Stock → add stock, with real batch numbers and expiry dates).
2. Check **Settings**: delivery charge, COD limit and the delivery PIN codes.
3. Create staff accounts (Staff page) with their own passwords. Don't share the Owner login.

## 5. Domain

In Vercel → Domains, add `your-domain.in` and `www.your-domain.in`, then create the DNS records Vercel shows at your registrar. HTTPS is automatic.

## 6. After every deploy — smoke test

- [ ] `https://your-domain.in/api/health` returns `{"ok":true}`
- [ ] Home, product list and a product page load on a phone
- [ ] Admin login works; dashboard shows numbers
- [ ] Place a test order with your own number, then **cancel it before packing**. Packing issues a GST invoice number, and cancelled invoices still need to be accounted for.
- [ ] Upload a product photo: it should be stored on Cloudinary (the photo URL starts with `res.cloudinary.com`)

## 7. Monitoring & backups

- Add a free uptime monitor (e.g. UptimeRobot) on `/api/health`, alerting the owner's phone or email.
- Neon keeps point-in-time backups. Also download the monthly CSVs from **Reports** (sales, GST, stock) and keep them with the accounts.
- Errors are logged in Vercel → Logs. A visitor only sees a short reference code.

## 8. Testing before a release

| Command | What it checks | Where to run |
|---|---|---|
| `npm run typecheck && npm run lint && npm test` | Types, code style, 130+ unit tests | Anywhere |
| `npm run test:int` | Orders, stock, invoices, reviews against a real database | **Local or a separate test database only** |
| `npm run test:e2e` | Full browser journeys on desktop + phone | **Local or a separate test database only** |

Integration and e2e tests place real orders and use up order and invoice numbers. They refuse to run against a non-local database unless `ALLOW_DB_TESTS=1`. Point them at a separate Neon branch, **never** the live database.

## 9. Security notes

- Admin passwords are hashed with bcrypt. After 5 wrong passwords an account locks for 15 minutes, and each device is limited to 20 attempts per 15 minutes.
- Changing `AUTH_SECRET` logs everyone out. Deactivating a staff member ends their session immediately.
- Security headers include CSP, HSTS, `X-Frame-Options: DENY` and `nosniff`. Admin, cart, checkout and order pages are never cached.
- Rate limits for login, tracking and reviews are kept in memory per server instance. If the site is ever attacked, move them to a shared store such as Upstash Redis.
- `npm audit` currently reports advisories in Prisma's MySQL driver, `deepmerge-ts` (Prisma CLI config) and PostCSS inside Next.js. None of these process user input in this app: it uses PostgreSQL, and PostCSS only builds our own CSS. Re-check when upgrading to Next.js 16 / Prisma 8.

## 10. Go-live checklist (client)

- [ ] **Licence 890:** confirm the type (seed / fertiliser / insecticide) and validity. Sell online only what it covers.
- [ ] **Products:** real names, pack sizes, MRP / price, **HSN codes and GST rates** (the samples used placeholders), photos, batch and expiry.
- [ ] **Delivery area:** which PIN codes, charges and COD limit (Admin → Settings).
- [ ] **CA review:** GST on delivery charges, the invoice format, and credit notes for returns.
- [ ] **Policies:** review Terms, Privacy, Returns and Shipping (`src/content/legal.ts`), ideally with a lawyer, and confirm the grievance officer's name.
- [ ] **Razorpay KYC** (needs the live website with policy pages), then Phase 6 for UPI and card payments.
- [ ] **Optional:** an SMS provider with DLT-approved templates for automatic order messages.

## 11. Daily routine for the shop

1. **Orders:** confirm new orders by phone, then pack (print the GST invoice and packing slip), ship and mark delivered. Tick "cash received" for COD.
2. **Customer messages:** on each order page, tap **"WhatsApp से भेजें"** for each queued message.
3. **Enquiries:** reply by call or WhatsApp and mark them contacted.
4. **Stock:** add every new consignment with its batch number and expiry. Watch the low-stock and expiring-soon badges.
5. **Reviews:** approve genuine reviews.
