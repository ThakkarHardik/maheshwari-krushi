# Maheshwari Krishi Sewa Kendra — Online Store

Hindi-first e-commerce website and admin panel for **Maheshwari Krishi Sewa Kendra**, 88, M.G. Road, Sailana, District Ratlam (MP).

See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md), [MASTER_PROMPT.md](MASTER_PROMPT.md) and [MARKET_RESEARCH.md](MARKET_RESEARCH.md).

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL + Prisma 7 · next-intl (Hindi default, English) · Vitest

## Getting started

Requirements: Node.js 20+ and a PostgreSQL database (local, [Neon](https://neon.tech) or Supabase).

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
| `npm run db:migrate` | Create a new migration after changing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Seed data (safe to re-run) |
| `npm run db:studio` | Browse the database |

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
