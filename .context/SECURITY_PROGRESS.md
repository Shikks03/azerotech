# Security Fixes Progress

Tracking all pentest findings (2026-03-24) and their resolution status.
Reference: `.claude/projects/.../memory/project_pentest_findings.md`

---

## Legend
- ✅ Fixed
- 🔄 In Progress
- ❌ Not Started

---

## 🔴 CRITICAL

| ID | Issue | File | Status | Notes |
|----|-------|------|--------|-------|
| C-1 | Appointment PATCH/DELETE queries `{ id }` instead of `{ appointmentId: id }` — silent no-op | `app/api/appointments/[id]/route.ts:35,48` | ✅ Fixed | Changed to `{ appointmentId: id }`, added 404 on `matchedCount === 0` |
| C-2 | `nameMismatches` unbounded `$push` — 16MB doc bomb | `app/api/appointments/route.ts:77` | ✅ Fixed | Added `$each` + `$slice: -50` |
| C-3 | `ADMIN_PASSWORD_HASH` base64 encoding is intentional — Next.js expands `$` in env files, corrupting the bcrypt hash | `app/api/admin/login/route.ts` | ✅ Resolved | Base64 encode/decode is the correct pattern; reverted erroneous removal |
| C-4 | No rate limiting on `POST /api/appointments` and `POST /api/reservations` | Both public POST routes | ✅ Fixed | `lib/publicRateLimit.ts`: 20 req/10 min per IP, sliding window in `public_rate_limits` collection |

---

## 🔴 HIGH

| ID | Issue | File | Status | Notes |
|----|-------|------|--------|-------|
| H-1 | IP spoofing bypasses login rate limiter via `X-Forwarded-For` | `app/api/admin/login/route.ts:14-18` | ✅ Fixed (partial) | `x-real-ip` preferred, `x-forwarded-for` only as last resort — acceptable for Vercel |
| H-2 | Race condition on login counter — parallel flood bypasses limit | `app/api/admin/login/route.ts:32-68` | ✅ Fixed | Replaced read-check-write with atomic `findOneAndUpdate + $inc` |
| H-3 | TOCTOU on token refresh → 2 live sessions from 1 token | `app/api/admin/refresh/route.ts` | ✅ Fixed | Unique index on `revoked_sessions.jti`, catches E11000 and returns 409 |
| H-4 | `POST /api/products` mass assignment via `...body` spread | `app/api/products/route.ts:29` | ✅ Fixed | Replaced spread with explicit allowlisted fields + type validation |
| H-5 | PATCH routes accept negative/out-of-range numeric values | `reservations/[id]`, `products/[id]`, `lcd-stock/[id]` | ✅ Fixed | Added `Number.isFinite`, `Number.isInteger`, `>= 0` guards on `price`, `stock`, `productPrice` |
| H-6 | Logout doesn't require auth → flood `revoked_sessions` with fake JTIs | `app/api/admin/logout/route.ts` | ✅ Fixed | Revocation only fires when `verifyAdminToken` passes; duplicate JTI silently ignored; cookie always cleared |
| H-7 | Customer PATCH: `phone`/`name` unvalidated | `app/api/customers/[id]/route.ts:28-29` | ✅ Fixed | `name` string max 100, `phone` regex `^09\d{9}$`, duplicate phone check before write |
| H-8 | Service record fields entirely unvalidated | `app/api/customers/[id]/records/route.ts` | ✅ Fixed | Date regex, finite+non-negative cost, notes max 2000, customer existence check |

---

## 🟡 MEDIUM

| ID | Issue | File | Status | Notes |
|----|-------|------|--------|-------|
| M-1 | No unique index on `revoked_sessions.jti` | MongoDB | ✅ Fixed (via H-3) | `createIndex({ jti: 1 }, { unique: true })` added in refresh route |
| M-2 | Appointment date not bounded server-side (accepts `9999-12-31`, past dates) | `app/api/appointments/route.ts` | ✅ Fixed | Validates `parsedDate >= today+1` and `<= today+60`; also rejects invalid calendar dates |
| M-3 | Appointment ID collision (4-digit suffix, ~50% at 118/day) | `app/api/appointments/route.ts` | ✅ Fixed | 6-char hex suffix (`randomBytes(3)` = 16M values/day), unique index on `appointmentId`, up to 5 retries on E11000 |
| M-4 | No double-booking prevention at API layer | `app/api/appointments/route.ts` | ✅ Fixed | Pre-insert check rejects `(date, time)` if Pending/Confirmed already exists, returns 409 |
| M-5 | Stock decrement matches by product name string (mutable) | `app/api/reservations/[id]/route.ts` | ✅ Fixed | `productId` stored on reservation at creation; stock ops use `{ id: productId }` with name fallback for legacy docs; client (`app/accessories/page.tsx`) now sends `productId` |
| M-6 | `booked-slots` date not validated server-side | `app/api/appointments/booked-slots/route.ts` | ✅ Fixed | Added `!/^\d{4}-\d{2}-\d{2}$/.test(date)` check — returns empty on invalid input |
| M-7 | JWT cookie not `Secure` in development | `app/api/admin/login/route.ts` | ❌ Not Started | Low risk in dev; consider always-secure policy |
| M-8 | Role claim not checked in `requireAdmin` | `lib/requireAdmin.ts` | ✅ Fixed | Added `payload.role !== "admin"` check |
| M-9 | Infinite session — refresh fires regardless of activity | `app/admin/page.tsx` | ✅ Fixed | `lastActiveRef` + `mousemove`/`keydown`/`click` listeners; idle threshold 30 min (< 50 min interval ensures any 30+ min idle is caught in one pass); session expired instead of refreshed when idle |

---

## 🟢 LOW

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| L-1 | `GET /api/products` returns `_id`, `stock`, injected fields to unauthenticated callers | ❌ Not Started | Add `.project({ _id: 0, stock: 0 })` for public callers |
| L-2 | `booked-slots` returns exact time strings — competitive intelligence | ❌ Not Started | Rate-limit at 60 req/hr/IP |
| L-3 | `Number(cost) \|\| 0` silently coerces undefined/NaN to 0 | ✅ Fixed (via H-8) | Covered by H-8 validation |
| L-4 | No `Content-Type: application/json` validation — unhandled 500 leaks stack traces | ✅ Fixed | `req.json()` wrapped in try/catch on `appointments` and `reservations` POST routes; returns `400 Invalid request body` on malformed input |
| L-5 | Auth probe fetches full `/api/appointments` just to check auth | ❌ Not Started | Create `GET /api/admin/ping` endpoint |
| L-6 | CSP has `unsafe-inline` + `unsafe-eval` globally | ❌ Not Started | Tighten CSP on admin route |
| L-7 | LCD stock `String(body.name)` coerces `undefined` to `"undefined"` | ✅ Fixed (via H-5) | Added string type check in lcd-stock PATCH |
| L-8 | "Unknown" IP lockout is shared — one attacker locks everyone in the bucket | ❌ Not Started | Consider skipping lockout for `unknown` IP |

---

## Attack Chains Status

| Chain | Status |
|-------|--------|
| Calendar DoS (16 req books a whole day) | ✅ C-4 + M-4 fixed |
| Identity hijacking via name spam | ✅ C-2 fixed (capped at 50) |
| Phantom Admin via refresh race | ✅ H-3 fixed |
| Data wipe (no audit log / soft delete) | ❌ Not started — architectural gap |
| Appointment ID exhaustion + delete bug | ✅ C-1 fixed; M-3 still open |
| Ghost service records (fake customerId) | ✅ H-8 fixed |

---

## ⚠️ Blockers Before Production

All critical/high blockers are now resolved. Remaining before launch:

1. ⚠️ **Admin password** — Still `passwordlmao`, must be changed

---

## Sessions Log

| Date | Changes |
|------|---------|
| 2026-03-24 Session 1 | Fixed C-1, C-2, C-3, H-1(partial), H-2, H-3, H-4, H-5, H-6, H-7, H-8, M-1(via H-3), M-8, L-3(via H-8), L-7(via H-5) |
| 2026-03-24 Session 2 | Fixed C-4 (rate limiting via `lib/publicRateLimit.ts`), M-2 (date bounds), M-3 (hex ID + unique index + retry), M-4 (double-booking check), M-6 (booked-slots validation), C-2 also applied to reservations `nameMismatches` |
| 2026-03-26 Session 3 | Fixed M-5 (`productId` stored on reservation; stock ops use numeric ID with name fallback), M-9 (30 min idle timeout via `lastActiveRef` + window events), L-4 (`req.json()` try/catch on appointments + reservations POST routes) |
