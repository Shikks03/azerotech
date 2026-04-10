# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Docs

All context/tracking documents live in **`.context/`** (not the root):
- `.context/SECURITY_PROGRESS.md` — pentest findings and fix status
- `.context/TRACKER.md` — feature/bug tracker
- `.context/Azerotech.md` — project overview

## Security Work

**`.context/SECURITY_PROGRESS.md`** tracks all pentest findings and fix status. When doing any security-related work:
- **Read it first** to understand current state before touching anything
- **Update it immediately** after every fix (status, notes, sessions log)
- Never mark something fixed without verifying the code change is actually in place

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

No test suite is configured.

## Architecture

Next.js 16 App Router project. All pages are client components (`"use client"`). API routes are server-side and connect to MongoDB Atlas via the `lib/mongodb.ts` singleton.

**Stack:** React 19, Tailwind CSS 4, Motion (Framer Motion successor), Lucide React icons, TypeScript, MongoDB (native driver).

**Routing (app/):**
- `/` — Homepage: hero, services overview, why-us, locations + map, CTA
- `/services` — Service categories (Phone Repair, Laptop/Desktop, Printing, Accessories)
- `/book-appointment` — 4-step multi-step form; submits to `/api/appointments`, fetches booked slots from `/api/appointments/booked-slots`
- `/accessories` — Product grid (fetched from `/api/products`) with category filter + reservation modal (submits to `/api/reservations`)
- `/contact` — Contact methods, store hours, embedded Google Map
- `/admin` — Password-protected admin dashboard; Header/Footer are hidden on this route

**Shared components (components/):** `Header`, `Footer`, `Logo`, `WaveDivider`. Root layout (`app/layout.tsx`) wraps all pages with Header and Footer; both components hide themselves on `/admin`.

## API Routes

All routes are under `app/api/`. Public endpoints (appointments, reservations POST) are rate-limited via `lib/publicRateLimit.ts`. All admin routes require `requireAdmin()` (`lib/requireAdmin.ts`).

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/appointments` | GET, POST | Admin (GET), Public (POST) | List all / create appointment (generates `AZT-YYMMDD-XXXXXX` ID, upserts customer) |
| `/api/appointments/booked-slots` | GET (`?date=YYYY-MM-DD`) | Public | Return booked times for a date (Pending/Confirmed only) |
| `/api/appointments/[id]` | PATCH, DELETE | Admin | Update status/details / delete |
| `/api/reservations` | GET, POST | Admin (GET), Public (POST) | List all / create reservation (upserts customer) |
| `/api/reservations/[id]` | PATCH, DELETE | Admin | Update (auto-adjusts product stock on Completed) / delete |
| `/api/products` | GET, POST | Public (GET), Admin (POST) | List all / create product (auto-increments numeric ID) |
| `/api/products/[id]` | PATCH, DELETE | Admin | Update details or stock / delete |
| `/api/lcd-stock` | GET, POST | Admin | List all / create LCD stock item |
| `/api/lcd-stock/[id]` | PATCH, DELETE | Admin | Update fields (phone_brand, lcd_brand, stock, etc.; name auto-derived) / delete |
| `/api/customers` | GET, POST | Admin | List all / create customer (phone is unique key) |
| `/api/customers/[id]` | PATCH, DELETE | Admin | Update / delete (cascades: unlinks appointments + reservations) |
| `/api/customers/[id]/records` | GET, POST | Admin | List / create service records for a customer |
| `/api/customers/[id]/records/[recordId]` | DELETE | Admin | Delete a service record |
| `/api/admin/login` | POST | Public | Issue JWT cookie; bcrypt + rate limiting |
| `/api/admin/logout` | POST | Admin | Revoke JTI + clear cookie |
| `/api/admin/refresh` | POST | Admin | Rotate JWT; rejects concurrent refresh via unique JTI index |

## Database

**File:** `lib/mongodb.ts` — lazy-loading `MongoClient` singleton. In development, reuses global connection to avoid hot-reload exhaustion. Reads `MONGODB_URI` from environment.

**Environment variables required:**
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/azerotech
JWT_SECRET=<32-byte base64 string>
ADMIN_PASSWORD_HASH=<bcrypt hash of admin password, cost 12>
```
Generate: `node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR_PASSWORD',12))"`

**Collections in `azerotech` database:**

| Collection | Key Fields |
|------------|-----------|
| `appointments` | `id` (UUID), `appointmentId` (AZT-…), `customerId`, `status`, `date`, `time`, `service`, `name`, `phone`, `brand`, `deviceType`, `problem?`, `repairStage?` |
| `reservations` | `id` (UUID), `customerId`, `status`, `pickupDate`, `pickupTime`, `productName`, `productPrice`, `productId?` (numeric, for stock lookup) |
| `products` | `id` (numeric, auto-increment), `name`, `price`, `category`, `image`, `stock` |
| `lcd_stock` | `id` (numeric, auto-increment), `name` (derived: `{phone_brand} {lcd_brand}`), `phone_brand`, `lcd_brand`, `compatible_models[]`, `anna_price?` (int\|null), `marlon_price?` (int\|null), `stock` |
| `customers` | `_id` (ObjectId), `name`, `phone` (unique), `type`, `nameMismatches[]`, `createdAt` |
| `serviceRecords` | `_id`, `customerId`, `date`, `service`, `device`, `cost`, `notes`, `createdAt` |
| `revoked_sessions` | `jti`, `expiresAt` (TTL index), `revokedAt` — auto-deleted after token expiry |
| `login_attempts` | `ip`, `attempts`, `lastAttempt`, `lockUntil?` — auto-cleared after 24h inactivity |
| `public_rate_limits` | `ip`, `requests[]` — sliding window for public POST rate limiting via `lib/publicRateLimit.ts` |

## Admin Panel (`/admin`)

**Authentication:** Login issues an `httpOnly` JWT cookie (`azerotech_admin_token`, 1h TTL, SameSite=Strict) signed with `JWT_SECRET`. Password is verified via bcrypt against `ADMIN_PASSWORD_HASH`. Rate limiting (5 attempts → 15 min lockout) uses the `login_attempts` MongoDB collection. Logout revokes the JTI in `revoked_sessions`. A silent refresh fires every 50 min via `/api/admin/refresh` — but only if the user was active in the last 30 min; otherwise the session is expired client-side (idle tracked via `mousemove`/`keydown`/`click` on `window`). Session state is also mirrored in `sessionStorage` key `azerotech_admin_authed` for the UI. All protected API routes call `requireAdmin()` (`lib/requireAdmin.ts`) which checks the cookie, verifies the JWT (including `role: "admin"` claim), and checks the revocation list. Mutation requests also require the `X-Requested-With: XMLHttpRequest` header (CSRF defense). Libs: `lib/auth.ts` (JWT helpers), `lib/requireAdmin.ts` (server-side auth guard), `lib/publicRateLimit.ts` (sliding-window rate limiter for public POSTs: 20 req/10 min per IP).

**Tabs:** Appointments · Reservations · Inventory (Products) · LCD Stock · Customers

The Customers tab tracks name mismatches (same phone, different submitted name) and links a customer to their full appointment/reservation/service-record history.

## Design System

Custom Tailwind theme (defined in `globals.css` `@theme`):
- `navy-dark`: `#080B1A` — page backgrounds
- `indigo-electric`: `#4F6EF7` — primary buttons/accents
- `indigo-light`: `#6B7FFF` — hover/secondary accents
- Font: Space Grotesk (loaded via Google Fonts in layout)

Button utility classes defined in `globals.css`: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`.

Animations use the `motion` library with `whileInView` + fade-up pattern: `initial: { opacity: 0, y: 28 }` → `animate: { opacity: 1, y: 0 }`, easing `[0.22, 1, 0.36, 1]`.

## Validation Rules

### Request Body Size

All `/api/*` routes are covered by `middleware.ts`, which rejects requests with `Content-Length > 8192` bytes (8 KB) and returns `413 Request body too large`. This limit comfortably covers the largest valid payload (service record with 2000-char notes + all other fields).

### String Length Limits

These limits are enforced server-side on every route that accepts the field — both POST (create) and PATCH (update):

| Field | Max length | Applies to |
|-------|-----------|-----------|
| `name` (person) | 100 | appointments, reservations, customers |
| `time` / `pickupTime` | 20 | appointments, reservations |
| `service` | 100 | appointments |
| `brand` | 100 | appointments |
| `deviceType` | 100 | appointments |
| `category` | 100 | products |
| `problem` | 1000 | appointments |
| `productName` | 200 | reservations |
| product / lcd `name` | 200 | products, lcd-stock |
| `image` (URL) | 500 | products |
| service record `service` / `device` | 200 | service records |
| `notes` | 2000 | service records |

### Enum / Format Constraints

- **`phone`** — `^09\d{9}$` (Philippine format). Validated on all public POST and admin PATCH routes that accept phone.
- **Appointment `status`** — `Pending | Confirmed | Completed | Cancelled`
- **Appointment `repairStage`** — `Device Received | Waiting for Parts | Fixing | Ready for Pickup | null`
- **Reservation `status`** — `Pending | Confirmed | Completed | Cancelled`
- **Customer `type`** — `walk-in | appointment | reservation`
- **`date` / `pickupDate`** — `YYYY-MM-DD` format. Appointments: 1–60 days from today (server-enforced). Reservations: 1–180 days (client-enforced only).

## Key Notes

- Phone validation enforces Philippine format: `09XXXXXXXXX` (11 digits starting with `09`). Validated both client-side and server-side on all public POST and admin PATCH routes.
- Appointment date picker: 1–60 days ahead (enforced server-side too). Reservation date picker: 1–180 days ahead.
- Appointment IDs use format `AZT-YYMMDD-XXXXXX` (2-digit year + month + day + **6-char hex** suffix, unique index + up to 5 retries on collision).
- Currency is Philippine Peso (₱).
- Remote images are served from `images.unsplash.com` (configured in `next.config.ts`).
- When a reservation status changes to "Completed", `PATCH /api/reservations/[id]` decrements the product's stock. Lookup uses `productId` (numeric) if present on the reservation, falling back to `productName` for legacy documents.
- Public POST routes (`/api/appointments`, `/api/reservations`) wrap `req.json()` in try/catch — malformed bodies return `400 Invalid request body` instead of a 500.
