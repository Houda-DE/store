# westore

A marketplace platform where sellers list items with delivery areas and customers browse items available in their city. Includes real-time messaging between buyers and sellers.

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| API | NestJS 11, Drizzle ORM, MySQL |
| Web | React 19, Vite, React Router |
| Real-time | Socket.IO (`/chat` namespace) |
| Auth | JWT (access token in localStorage) |
| Email | Resend |
| Storage | Supabase Storage |
| Validation | Zod (shared `@repo/validation` package) |

## Repository structure

```
store/
├── apps/
│   ├── api/          # NestJS REST API + Socket.IO gateway
│   └── web/          # React SPA
└── packages/
    ├── validation/   # Shared Zod schemas
    ├── ui/           # Shared UI components
    ├── eslint-config/
    └── typescript-config/
```

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9 — `npm install -g pnpm@9`
- **MySQL** 8+ running locally (or a remote instance)
- A **Resend** account for transactional email — [resend.com](https://resend.com)
- A **Supabase** project for image uploads — [supabase.com](https://supabase.com)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd store
pnpm install
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and fill in every value:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Random string ≥ 32 chars |
| `JWT_REFRESH_SECRET` | A different random string ≥ 32 chars |
| `RESEND_API_KEY` | From your Resend dashboard |
| `FROM_EMAIL` | Sender address on a Resend-verified domain |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API |
| `SUPABASE_BUCKET` | Name of the storage bucket for images |
| `CLIENT_ORIGIN` | Frontend URL (default `http://localhost:5173`) |
| `API_URL` | Backend URL (default `http://localhost:4000`) |

> **Resend note:** During local development you can set `FROM_EMAIL=onboarding@resend.dev`, but emails will only be delivered to your own Resend account email. To send to any address, verify a domain in Resend and use an address on that domain.

### 3. Set up the database

Create a MySQL database, then run migrations and seed data:

```bash
cd apps/api

# Run all migrations
pnpm db:migrate

# Seed countries, cities, sample users and items
pnpm db:seed
```

### 4. Start the dev servers

From the monorepo root:

```bash
pnpm dev
```

This starts both servers in parallel via Turborepo:

| Service | URL |
|---|---|
| API | http://localhost:4000 |
| Web | http://localhost:5173 |
| Swagger | http://localhost:4000/api |

## Seeded accounts

After running `pnpm db:seed`, the following test accounts are available:

| Email | Password | Role |
|---|---|---|
| `seller@westore.dev` | `password123` | Seller |
| `customer@westore.dev` | `password123` | Customer |

> These accounts are pre-verified so you can log in immediately.

## Key features

- **Browse & filter** — customers see only items whose sellers deliver to their city
- **Sell** — sellers list items with photos (uploaded to Supabase Storage) and set delivery cities
- **Real-time chat** — Socket.IO-powered messaging between buyer and seller, with typing indicators, unread badges and message history
- **Email verification** — new accounts require email confirmation before login

## Available scripts

### Root (runs across all apps)

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm check-types  # Type-check all apps
```

### API (`apps/api`)

```bash
pnpm db:generate        # Generate a new Drizzle migration from schema changes
pnpm db:migrate         # Apply pending migrations
pnpm db:seed            # Seed all data (locations + users + items)
pnpm db:seed-locations  # Seed only countries and cities
pnpm db:seed-users      # Seed only test users
pnpm db:seed-items      # Seed only sample listings
```
