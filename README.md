# Maheshwari Krishi Sewa Kendra — Online Store

Hindi-first e-commerce website and admin panel for **Maheshwari Krishi Sewa Kendra**, 88, M.G. Road, Sailana, District Ratlam (MP).

See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md), [MASTER_PROMPT.md](MASTER_PROMPT.md) and [MARKET_RESEARCH.md](MARKET_RESEARCH.md).

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL + Prisma 7 · next-intl (Hindi default, English) · Vitest

## Getting started

Requirements: Node.js 20+ and a PostgreSQL database (local, [Neon](https://neon.tech) or Supabase).

No Postgres installed? Prisma ships a local one:

```bash
npx prisma dev --name mk --detach   # prints a postgres://… URL — put it in DATABASE_URL
```

This local database accepts one connection at a time, so also set `DATABASE_POOL_MAX=1` in `.env` (not needed for real PostgreSQL).

```bash
npm install                      # also generates the Prisma client
cp .env.example .env             # then fill in DATABASE_URL, AUTH_SECRET, SEED_OWNER_PASSWORD
npm run db:deploy                # create the tables
npm run db:seed                  # settings, categories, sample products, Owner admin
npm run dev                      # http://localhost:3000
```

Admin panel: http://localhost:3000/admin. Log in with `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint · TypeScript · unit tests |
| `npm run test:int` | Integration tests against a **local or dedicated test** database (they use up order/invoice numbers — never run on production; non-local URLs need `ALLOW_DB_TESTS=1`) |
| `npm run db:migrate` | Create a new migration after changing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Seed data (safe to re-run) |
| `npm run db:studio` | Browse the database |

## Database changes

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate -- --name <what_changed>` creates and applies a migration.
   With the `prisma dev` local database (its default DB is `template1`, which breaks Prisma's shadow database), generate the SQL from the live DB instead:
   ```bash
   mkdir -p prisma/migrations/<timestamp>_<name>
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script \
     > prisma/migrations/<timestamp>_<name>/migration.sql
   npm run db:deploy && npm run db:generate
   ```

## Product images

`STORAGE_DRIVER=local` (default) saves uploads to `./uploads` and serves them from `/uploads/...` — for development only.
In production set `STORAGE_DRIVER=cloudinary` and the three `CLOUDINARY_*` variables.
Uploads are checked by file content (JPG / PNG / WebP only, max 3 MB, max 8 per product).

## Admin roles

| Role | Can do |
|---|---|
| Owner (मालिक) | Everything, including staff, settings and reports |
| Manager (मैनेजर) | Products, stock, orders, refunds, enquiries, customers |
| Packer (पैकर) | View orders and update order status |

Permissions live in `src/lib/auth/roles.ts`. Every admin page and server action calls `requireAdmin(permission)`.

## Branches

`main` (production) ← `dev` (integration) ← `phase/<n>-<name>` (one branch per phase)

## Project layout

```
prisma/              schema, migrations, seed
messages/            hi.json, en.json (all UI text)
src/app/(store)/     public website
src/app/admin/       admin login + panel
src/components/      UI and storefront components
src/config/store.ts  seller details
src/lib/             db, auth, audit, helpers
```
