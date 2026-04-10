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
| M-7 | JWT cookie not `Secure` in development | `app/api/admin/login/route.ts` | ✅ Fixed | `secure: true` unconditionally in login + refresh + logout routes; browsers ignore `Secure` on localhost |
| M-8 | Role claim not checked in `requireAdmin` | `lib/requireAdmin.ts` | ✅ Fixed | Added `payload.role !== "admin"` check |
| M-9 | Infinite session — refresh fires regardless of activity | `app/admin/page.tsx` | ✅ Fixed | `lastActiveRef` + `mousemove`/`keydown`/`click` listeners; idle threshold 30 min (< 50 min interval ensures any 30+ min idle is caught in one pass); session expired instead of refreshed when idle |

---

## 🟢 LOW

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| L-1 | `GET /api/products` returns `_id` to unauthenticated callers | ✅ Fixed | Added `.project({ _id: 0 })` to strip MongoDB ObjectId from public response |
| L-2 | `booked-slots` returns exact time strings — competitive intelligence | ✅ Fixed | Rate-limited via `publicRateLimit` (20 req/10 min per IP) |
| L-3 | `Number(cost) \|\| 0` silently coerces undefined/NaN to 0 | ✅ Fixed (via H-8) | Covered by H-8 validation |
| L-4 | No `Content-Type: application/json` validation — unhandled 500 leaks stack traces | ✅ Fixed | `req.json()` wrapped in try/catch on `appointments` and `reservations` POST routes; returns `400 Invalid request body` on malformed input |
| L-5 | Auth probe fetches full `/api/appointments` just to check auth | ✅ Fixed | Created `GET /api/admin/ping` (lightweight `requireAdmin` check); admin page now probes `/api/admin/ping` |
| L-6 | CSP has `unsafe-inline` + `unsafe-eval` globally | ✅ Fixed | Removed `'unsafe-eval'` from `script-src`; `'unsafe-inline'` kept (needed by Next.js) |
| L-7 | LCD stock `String(body.name)` coerces `undefined` to `"undefined"` | ✅ Fixed (via H-5) | Added string type check in lcd-stock PATCH |
| L-8 | "Unknown" IP lockout is shared — one attacker locks everyone in the bucket | ✅ Fixed | Login rate limiter skips tracking when `ip === "unknown"`; auth still proceeds normally |

---

## 🔴 BYPASSED (Session 5 Verification — Fix Present But Still Exploitable)

| ID | Original | Issue | File | Status | Notes |
|----|----------|-------|------|--------|-------|
| B-1 | M-7 | CSRF gap on `/api/admin/refresh` — no `X-Requested-With` check | `app/api/admin/refresh/route.ts` | ✅ Fixed | Added header check as first operation in POST handler, returns 403 if missing |
| B-2 | M-9 | Idle timeout meaningless — 30 min threshold only checked at 50 min intervals | `app/admin/page.tsx` | ✅ Fixed | Changed `REFRESH_INTERVAL_MS` (50 min) to `CHECK_INTERVAL_MS` (5 min); idle threshold stays 30 min |
| B-3 | L-1 | `stock` field still exposed to unauthenticated callers via `GET /api/products` | `app/api/products/route.ts` | ✅ Fixed | GET now accepts `req: NextRequest`, calls `requireAdmin` to detect auth, uses `{ _id:0, stock:0 }` projection for public callers |

---

## 🟠 NEW FINDINGS (Session 5 Verification)

### Medium

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S5-1 | Medium | CSRF gap on refresh route (see B-1 above) | `app/api/admin/refresh/route.ts` | ✅ Fixed | See B-1 |
| S5-2 | Medium | Admin PATCH `/api/appointments/[id]` — free-text fields (`name`, `brand`, `deviceType`, `service`, `time`, `problem`) have no length cap | `app/api/appointments/[id]/route.ts` | ✅ Fixed | Added length validation + phone regex; matches POST limits |
| S5-3 | Medium | Public phone enumeration via `/api/repair-status` — phone alone grants access to appointment details (service, device, date, repairStage) for any customer | `app/api/repair-status/route.ts` | ✅ Fixed | Rate limiting already present; added `ip !== "unknown"` guard to skip tracking for unknown IPs (L-8 pattern) |

### Low

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S5-4 | Low | Double-booking check (M-4) is not atomic — narrow race allows two simultaneous bookings of the same slot | `app/api/appointments/route.ts` | ✅ Fixed | Added partial unique index `{ date, time }` with `partialFilterExpression: {status: $in [Pending, Confirmed]}`; catch block distinguishes slot vs. appointmentId E11000 |
| S5-5 | Low | `POST /api/customers` — `body.type` not validated against allowlist (e.g. `["walk-in", "appointment", "reservation"]`) | `app/api/customers/route.ts` | ✅ Fixed | Added allowlist validation against `["walk-in", "appointment", "reservation"]` |
| S5-6 | Low | `PATCH/DELETE /api/products/[id]` — no `matchedCount`/`deletedCount` check; silent no-op on non-existent ID (returns 200) | `app/api/products/[id]/route.ts` | ✅ Fixed | PATCH checks `matchedCount === 0` → 404; DELETE checks `deletedCount === 0` → 404 |
| S5-7 | Low | `POST /api/reservations` — `pickupDate` not bounded server-side (1–180 days rule only enforced client-side) | `app/api/reservations/route.ts` | ✅ Fixed | Added calendar-overflow check + 1–180 day bounds before DB work |
| S5-8 | Low | M-2 invalid calendar date bypass — `new Date("2025-02-30")` resolves to Mar 2 without triggering `isNaN`; no month-overflow check | `app/api/appointments/route.ts` | ✅ Fixed | Added component comparison (year/month/day roundtrip) after parsing; `2025-02-30` rejected with 400 |
| S5-9 | Low | Rate-limit IP spoofing applies to `/api/repair-status` (new endpoint added after original audit, same `x-forwarded-for` fallback risk) | `lib/publicRateLimit.ts` / `app/api/repair-status/route.ts` | ✅ Fixed | Added `ip !== "unknown"` guard before `isPublicRateLimited` call (same L-8 pattern used in login) |
| S5-10 | Low | `ADMIN_PASSWORD_HASH` not validated as a valid bcrypt hash (`$2b$` prefix check absent) — misconfigured env silently locks out admin | `app/api/admin/login/route.ts` | ✅ Fixed | Checks `$2b$` / `$2a$` prefix after base64 decode; returns 500 if invalid |

### Informational

| ID | Severity | Issue | Notes |
|----|----------|-------|-------|
| S5-I1 | Info | `createIndex` called on every `POST /api/appointments` (performance hit under load) | Move to one-time startup/migration script |
| S5-I2 | Info | Rate limiter stores the blocked 21st request — expected "record-then-check" behavior, not exploitable | Design note only |
| S5-I3 | Info | H-6 (logout) uses manual token verification instead of `requireAdmin()` by design — cookie always cleared regardless | Documented trade-off, not a regression |

---

## 🔵 NEW FINDINGS (Session 4 Pentest)

| ID | Severity | Issue | File | Status | Notes |
|----|----------|-------|------|--------|-------|
| N-1 | Low | Logout cookie `secure` flag was conditional | `app/api/admin/logout/route.ts` | ✅ Fixed | Changed to `secure: true` (consistency with login/refresh) |
| N-2 | Low | `publicRateLimit` TOCTOU race on window reset | `lib/publicRateLimit.ts` | ✅ Fixed | Replaced with single atomic `findOneAndUpdate` using `$pull` + `$push` |
| N-3 | Low | Reservation PATCH/DELETE queries `{ id }` but docs only have `_id` — silent no-op | `app/api/reservations/[id]/route.ts` | ✅ Fixed | Now uses `{ _id: new ObjectId(id) }` with 400/404 handling |
| N-4 | Low | `repair-status` accepts arbitrary `appointmentId` with no format validation | `app/api/repair-status/route.ts` | ✅ Fixed | Added regex guard `/^AZT-\d{6}-[0-9a-f]{6}$/i` |
| N-5 | Low | `lcd-stock` POST has no input validation on name/stock | `app/api/lcd-stock/route.ts` | ✅ Fixed | Added string type/length check for name, integer >= 0 check for stock |
| N-6 | Low | `customers` POST doesn't validate `name` type or length | `app/api/customers/route.ts` | ✅ Fixed | Added `typeof string`, non-empty, max 100 char validation |

---

## Attack Chains Status

| Chain | Status |
|-------|--------|
| Calendar DoS (16 req books a whole day) | ✅ C-4 + M-4 fixed |
| Identity hijacking via name spam | ✅ C-2 fixed (capped at 50) |
| Phantom Admin via refresh race | ✅ H-3 fixed |
| Data wipe (no audit log / soft delete) | ❌ Not started — architectural gap |
| Appointment ID exhaustion + delete bug | ✅ C-1 + M-3 fixed |
| Ghost service records (fake customerId) | ✅ H-8 fixed |

---

## 🔵 NEW FINDINGS (Session 8 — 5-Agent Pentest)

### Medium

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S8-1 | Medium | Body size limit bypass via missing `Content-Length` — chunked `Transfer-Encoding` or omitted header bypasses 8KB middleware check | `middleware.ts:7-10` | ✅ Fixed | Made middleware async; added `req.clone().text()` check for POST/PUT/PATCH without Content-Length |
| S8-2 | Medium | Rate limit bypass on `/api/repair-status` for unknown IPs — `ip !== "unknown"` guard skips rate limiting entirely (other public endpoints rate-limit the shared bucket) | `app/api/repair-status/route.ts:25` | ✅ Fixed | Removed `ip !== "unknown"` guard — all IPs now rate-limited (unknown IPs share bucket, consistent with appointments/reservations) |
| S8-3 | Medium | Phone enumeration via `/api/repair-status` — distinct 404 vs 200 reveals customer existence; combined with S8-2, unlimited attempts from unknown IPs | `app/api/repair-status/route.ts:43-68` | ✅ Fixed (via S8-2) | Unlimited enumeration path closed by S8-2 rate limit fix; design-inherent disclosure mitigated by rate limiting |
| S8-4 | Medium | Stock double-decrement race on reservation completion — no transaction; two concurrent PATCH-to-Completed both decrement stock | `app/api/reservations/[id]/route.ts:67-91` | ✅ Fixed | Replaced findOne+updateOne with atomic `findOneAndUpdate` (returnDocument: "before"); concurrent requests see updated status from first write |

### Low

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S8-5 | Low | LCD Stock PATCH — missing `matchedCount` 404 check (silent no-op) | `app/api/lcd-stock/[id]/route.ts:42-46` | ✅ Fixed | Captures updateOne result; returns 404 on matchedCount === 0 |
| S8-6 | Low | LCD Stock DELETE — missing `deletedCount` 404 check (silent no-op) | `app/api/lcd-stock/[id]/route.ts:57-59` | ✅ Fixed | Captures deleteOne result; returns 404 on deletedCount === 0 |
| S8-7 | Low | Customer PATCH — missing `matchedCount` 404 check | `app/api/customers/[id]/route.ts:55-56` | ✅ Fixed | Captures updateOne result; returns 404 on matchedCount === 0 |
| S8-8 | Low | Customer DELETE — missing `deletedCount` 404 check | `app/api/customers/[id]/route.ts:78` | ✅ Fixed | Checks deletedCount before cascade — skips service record/appointment cleanup on non-existent customer |
| S8-9 | Low | Service record DELETE — missing `deletedCount` 404 check | `app/api/customers/[id]/records/[recordId]/route.ts:26-27` | ✅ Fixed | Returns 404 on deletedCount === 0 (covers both missing record and IDOR attempt) |
| S8-10 | Low | Stock inflation via status toggling — admin can toggle Completed↔Cancelled repeatedly to inflate stock (no idempotency guard) | `app/api/reservations/[id]/route.ts:84-89` | ✅ Fixed (via S8-4) | Added `stockAdjusted` boolean on reservation: only decrement if !stockAdjusted, only increment if stockAdjusted !== false; written atomically via findOneAndUpdate |
| S8-11 | Low | Customer duplicate phone race condition — `findOne` then `insertOne` TOCTOU; no unique index on `customers.phone` | `app/api/appointments/route.ts:106-133` | ✅ Fixed | Added `createIndex({ phone: 1 }, { unique: true })`; insertOne catches E11000 and falls back to findOne for race-created customer |
| S8-12 | Low | Auto-increment ID collision race — `find().toArray()` then `Math.max()+1` not atomic; no unique index on products/lcd-stock `id` | `app/api/products/route.ts:48-49`, `app/api/lcd-stock/route.ts:33-34` | ✅ Fixed | Added `createIndex({ id: 1 }, { unique: true })` + retry loop (up to 5 attempts) with fresh max query on E11000 collision |

### Informational

| ID | Severity | Issue | Notes |
|----|----------|-------|-------|
| S8-I1 | Info | Idle timeout is client-side only — stolen JWT usable for full 1h TTL | Known trade-off; server-side tracking adds complexity |
| S8-I2 | Info | CSP `unsafe-inline` for scripts | Next.js limitation; `unsafe-eval` correctly removed |
| S8-I3 | Info | `createIndex` called on every POST/refresh request | Performance only; move to migration script |
| S8-I4 | Info | IP source trusts client headers | Safe behind Vercel proxy; infrastructure concern |
| S8-I5 | Info | `password` field not type-checked before bcrypt | Non-string coerces to `[object Object]`, never matches hash |
| S8-I6 | Info | `dismissMismatches` accepts any truthy value | Action is hardcoded; no exploitable impact |
| S8-I7 | Info | Missing `X-Permitted-Cross-Domain-Policies` header | Flash is dead; scanner noise only |

---

---

## 🔵 NEW FINDINGS (Session 9 — 4-Agent Pentest)

### High

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S9-H1 | High | CSP `script-src 'unsafe-inline'` negates XSS protection — any injected inline script executes | `middleware.ts` | ✅ Fixed | Nonce-based CSP in middleware; `unsafe-inline` removed; nonce threaded to layout + Analytics |

### Medium

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S9-M1 | Medium | `PATCH /api/appointments/[id]` — `date` field in ALLOWED list has zero validation (accepts objects, past dates, overflow dates); can store `{"$gt":""}` in date field | `app/api/appointments/[id]/route.ts` | ✅ Fixed | Type check + regex + calendar roundtrip; NoSQL operators and overflow dates rejected |
| S9-M2 | Medium | `PATCH /api/reservations/[id]` — `pickupDate` field in ALLOWED list has zero validation (same issue as S9-M1) | `app/api/reservations/[id]/route.ts` | ✅ Fixed | Same three-layer validation as S9-M1 |
| S9-M3 | Medium | Free-text `time` field has no format enforcement — canonically equivalent strings bypass double-booking index (e.g. `"9:00 AM"` vs `"09:00 AM"` are distinct slots) | `app/api/appointments/route.ts` | ✅ Fixed | `normalizeTime()` zero-pads hour to `HH:MM AM/PM` before double-booking check and DB insert |
| S9-M4 | Medium | All public endpoints share one rate-limit bucket per IP — abusing repair-status exhausts booking quota and vice versa; cross-endpoint DoS | `lib/publicRateLimit.ts` | ✅ Fixed | Added `endpoint` param; key is now `${ip}:${endpoint}` — appointments/reservations/repair-status each have separate buckets |
| S9-M5 | Medium | `createIndex` called on every `POST /api/appointments` (3 calls) and every `POST /api/admin/refresh` (1 call) — DoS amplifier on hot paths, adds ~90ms latency | `lib/ensureIndexes.ts` (new) | ✅ Fixed | `lib/ensureIndexes.ts` — module-level cached promise; runs once per process; hot paths call `ensureIndexes(db)` |
| S9-M6 | Medium | Middleware body-size check for chunked requests reads full body into memory before checking size — Slow-POST attack holds stream open; full allocation before rejection | `middleware.ts` | ✅ Fixed | Chunked body read wrapped in `Promise.race` with 10s timeout; returns 408 on stall |
| S9-M7 | Medium | "unknown" IP bypasses admin login rate limiting entirely — on non-Vercel/non-proxied deploy, custom HTTP client can omit IP headers and brute-force indefinitely | `app/api/admin/login/route.ts` | ✅ Fixed | Removed `ip !== "unknown"` guard; all IPs always tracked — re-introduces L-8 shared bucket, accepted trade-off |
| S9-M8 | Medium | JWT secret minimum entropy not validated at startup — short/weak `JWT_SECRET` allows offline HS256 brute-force | `lib/auth.ts` | ✅ Fixed | `getSecret()` throws if `JWT_SECRET.length < 32` |
| S9-M9 | Medium | CSP missing `base-uri 'self'`, `object-src 'none'`, `form-action 'self'`, `worker-src 'none'` — base tag injection possible | `middleware.ts` | ✅ Fixed | All four directives added to per-request CSP |
| S9-M10 | Medium | CSP `frame-src https://www.google.com` too broad — should scope to `/maps/` path only | `middleware.ts` | ✅ Fixed | Changed to `frame-src https://www.google.com/maps/` |
| S9-M11 | Medium | `Permissions-Policy` omits powerful features: `payment`, `usb`, `bluetooth`, `serial`, `display-capture`, `clipboard-read` | `next.config.ts` | ✅ Fixed | Added all six as `()` to Permissions-Policy header |
| S9-M12 | Medium | `MongoClient` has no explicit TLS enforcement, `serverSelectionTimeoutMS`, or `maxPoolSize` — silent TLS drop on non-SRV URIs, connection exhaustion on Atlas free tier | `lib/mongodb.ts` | ✅ Fixed | Added `{ tls: true, serverSelectionTimeoutMS: 5000, maxPoolSize: 10 }` to both dev and prod constructors |

### Low

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S9-L1 | Low | `PATCH /api/appointments/[id]` — E11000 not caught on slot collision → unhandled 500 (raw MongoDB error to client) | `app/api/appointments/[id]/route.ts:66` | ✅ Fixed | try/catch around updateOne; `date_1_time_1` key → 409 "This slot is already booked"; other E11000 → 409 "Appointment ID conflict" |
| S9-L2 | Low | `dismissMismatches` truthy coercion — any truthy value silently clears mismatch history; `"false"` (string) would trigger it | `app/api/customers/[id]/route.ts:49` | ✅ Fixed | Changed `if (body.dismissMismatches)` → `if (body.dismissMismatches === true)` |
| S9-L3 | Low | `GET /api/customers/[id]/records` — no ObjectId validation on `id`; malformed IDs return 200+[] instead of 400 | `app/api/customers/[id]/records/route.ts:16–26` | ✅ Fixed | Added `/^[a-f\d]{24}$/i` guard before ObjectId construction; 400 on invalid |
| S9-L4 | Low | `Number(id)` on product/lcd-stock routes — `NaN` reaches MongoDB query with no explicit guard | `app/api/products/[id]/route.ts:55`, `app/api/lcd-stock/[id]/route.ts:45` | ✅ Fixed | `!Number.isInteger(numericId) \|\| numericId <= 0` → 400 "Invalid ID" in all PATCH/DELETE handlers |
| S9-L5 | Low | Stock restoration condition `before.stockAdjusted !== false` restores stock for legacy docs (undefined) even if stock was never decremented | `app/api/reservations/[id]/route.ts:96` | ✅ Fixed | Changed guard to `before.stockAdjusted === true` — only explicit true triggers restore |
| S9-L6 | Low | `POST /api/reservations` customer upsert lacks E11000 catch — concurrent same-phone creates unhandled 500 | `app/api/reservations/route.ts:116` | ✅ Fixed | insertOne wrapped in try/catch; E11000 falls back to findOne({ phone }) — same pattern as appointments route |
| S9-L7 | Low | Login counter deleted on success — attacker can run unlimited 4-attempt cycles without ever triggering lockout | `app/api/admin/login/route.ts:91` | ✅ Fixed | Replaced deleteOne with updateOne({ $set: { attempts: 0, lockUntil: null } }) — doc retained, counter zeroed |
| S9-L8 | Low | `productPrice` allows astronomically large finite floats (e.g. `1e308`) — no upper bound | `app/api/reservations/route.ts:69–72` | ✅ Fixed | Added `> 1_000_000` upper bound check → 400 "Invalid productPrice" |
| S9-L9 | Low | `booked-slots` date only regex-validated — calendar overflow values (`2026-02-30`) accepted and hit DB | `app/api/appointments/booked-slots/route.ts:16–18` | ✅ Fixed | Added calendar roundtrip check after regex; overflow dates return `{ bookedTimes: [] }` |
| S9-L10 | Low | CSP `connect-src` missing Vercel Analytics domain — analytics beacons blocked in production | `middleware.ts` | ✅ Fixed | Already present in middleware.ts: `connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com` |
| S9-L11 | Low | CSP `img-src data:` allowed — can be leveraged in CSS injection for data exfil | `middleware.ts` | ✅ Fixed | Removed `data:` from `img-src` in middleware.ts |
| S9-L12 | Low | `serverActions.allowedOrigins` not configured in next.config.ts | `next.config.ts` | ✅ Fixed | Added `serverActions: { allowedOrigins: ["azerotech.com"] }` to nextConfig |
| S9-L13 | Low | Security-critical dependencies use `^` ranges (`jose`, `bcryptjs`, `mongodb`) — minor version supply-chain risk | `package.json` | ✅ Fixed | Pinned exact versions: jose, bcryptjs, mongodb — carets removed |
| S9-L14 | Low | CSRF `X-Requested-With` check skipped for GET requests in `requireAdmin` — admin GET endpoints have no CSRF layer | `lib/requireAdmin.ts:14–19` | ✅ Fixed | Removed method condition; header required for ALL methods; admin page fetch calls updated to always include header |
| S9-L15 | Low | `password` field in login has no `typeof !== "string"` guard — relies on bcryptjs internal `.toString()` behavior | `app/api/admin/login/route.ts:84` | ✅ Fixed | Added `typeof password !== "string" \|\| password.length === 0` → 401 before bcrypt call |

### Informational

| ID | Severity | Issue | Notes |
|----|----------|-------|-------|
| S9-I1 | Info | repair-status single-factor ID lookup — design-inherent; phone ownership not verified on appointmentId path | Rate-limited; acceptable trade-off |
| S9-I2 | Info | repair-status appointmentId regex uses `/i` flag — mixed-case IDs pass validation but never match real docs | Cosmetic; no security impact |
| S9-I3 | Info | `requireAdmin` called as negated side-effect in products GET — `!(await requireAdmin(req))`; fragile if refactored | Document only |
| S9-I4 | Info | `problem` cannot be set to null via PATCH but `repairStage` can — inconsistency | UX issue only |
| S9-I5 | Info | Service record `date` passes regex but calendar overflow values stored | Low-risk historical data |
| S9-I6 | Info | `/api/admin/ping` is a session oracle — 200 vs 401 reveals login state to cross-origin observers | SameSite=Strict mitigates; document |
| S9-I7 | Info | `loginAttempts` UI state never populated from server response — attempt counter UI non-functional | UX only |
| S9-I8 | Info | Initial data fetch in admin page uses raw `fetch()` not `adminFetch()` wrapper | Maintenance risk only |
| S9-I9 | Info | `time` field unstandardized — admin PATCH and public POST accept different formats | No direct security impact |
| S9-I10 | Info | Vercel Analytics script domain not explicitly in `script-src` | Verify in production whether bundled or external |

---

## ⚠️ Blockers Before Production

Session 9 pentest found 1 high + 12 medium + 15 low + 10 informational issues.
Session 10 (2026-03-27): All 1H + 12M fixed.
Session 11 (2026-03-27): All 15L fixed. Only informational issues remain.

1. ⚠️ **Admin password** — Still `passwordlmao`, must be changed before any external access

---

## 🔵 NEW FINDINGS (Session 12 — 4-Agent LCD Stock Pentest, 2026-04-03)

> **⚠️ Delete this section once every finding below is marked ✅ Fixed.**

3 specialist security agents (API, Frontend, Business Logic) + 1 UX agent audited the LCD Stock feature (commits dab57c9–e54f321). Findings deduplicated and merged below.

### High

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S12-H1 | High | `Number()` type coercion accepts booleans, null, empty string, and arrays for `stock`/`anna_price`/`marlon_price` — `stock: null` → 0 zeroes stock silently; `stock: true` → 1; `stock: ""` → 0; `stock: [0]` → 0. All pass `Number.isInteger`. | `app/api/lcd-stock/route.ts`, `app/api/lcd-stock/[id]/route.ts` | ❌ Not Started |
| S12-H2 | High | No rollback on any optimistic UI update — `updateLcdStock`, `editLcdItem`, `deleteLcdItem` all mutate client state before server confirms. `adminFetch` only handles 401; all other errors (400/404/500/network) are silently discarded. UI diverges from DB permanently until reload. | `app/admin/page.tsx:373–414` | ❌ Not Started |

### Medium

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S12-M1 | Medium | TOCTOU in PATCH name derivation — when only `phone_brand` or only `lcd_brand` is sent, route does `findOne` then `$set`. Two concurrent PATCHes (one per field) both read the pre-update document; derived `name` will not match the final combination of both fields. | `app/api/lcd-stock/[id]/route.ts:93–98` | ❌ Not Started |
| S12-M2 | Medium | POST ID generation race — read-max-then-insert not atomic; 6+ concurrent POSTs all read the same `maxId`, all attempt the same `id`, 5-retry loop can be exhausted, returning 500. Unique index prevents duplicates but availability fails. | `app/api/lcd-stock/route.ts:88–99` | ❌ Not Started |
| S12-M3 | Medium | `compatible_models` entries permit null bytes (`\u0000`) and Unicode control characters (e.g., RTL override `\u202E`) — `trim()` only strips leading/trailing whitespace; internal control chars pass undetected. | `app/api/lcd-stock/route.ts:49–54`, `[id]/route.ts:55–60` | ❌ Not Started |
| S12-M4 | Medium | No uniqueness constraint on `(phone_brand, lcd_brand)` pair — `ensureIndexes` only creates a unique index on `id`. Identical entries can be created, producing two rows with the same display name; stock counts split silently. | `lib/ensureIndexes.ts` (missing compound index) | ❌ Not Started |
| S12-M5 | Medium | Path parameter `id` accepts scientific notation and hex — `Number("1e2")` = 100, `Number("0x1")` = 1; both pass `Number.isInteger`. `PATCH /api/lcd-stock/1e2` silently targets item id=100. Applies to products route too. | `app/api/lcd-stock/[id]/route.ts:15–17`, `app/api/products/[id]/route.ts` | ❌ Not Started |
| S12-M6 | Medium | No upper bound on `stock`/`anna_price`/`marlon_price` — values above `Number.MAX_SAFE_INTEGER` (2^53−1) pass `Number.isInteger` but suffer silent IEEE 754 precision loss; stored value differs from submitted value. | `app/api/lcd-stock/route.ts`, `app/api/lcd-stock/[id]/route.ts` | ❌ Not Started |
| S12-M7 | Medium | `updateLcdStock` rapid-click race — no debounce or in-flight lock; 5 rapid +/- clicks send 5 concurrent PATCHes; out-of-order responses leave DB at a different value than the UI shows. | `app/admin/page.tsx:373–381` | ❌ Not Started |
| S12-M8 | Medium | `addLcdItem` double-submit — submit button not disabled during in-flight POST; double-click creates two duplicate entries with different IDs and identical names. | `app/admin/page.tsx:383–393`, `LcdFormModal` submit button | ❌ Not Started |

### Low

| ID | Severity | Issue | File | Status |
|----|----------|-------|------|--------|
| S12-L1 | Low | `stock: null` silently coerces to 0 — `Number(null)` = 0 passes `isInteger` and `>= 0`; semantically distinct from "stock not provided". | `app/api/lcd-stock/route.ts:38–40`, `[id]/route.ts:81–86` | ❌ Not Started |
| S12-L2 | Low | POST fetches entire `lcd_stock` collection to compute next ID — full scan per POST; scales poorly as collection grows. | `app/api/lcd-stock/route.ts:89` | ❌ Not Started |
| S12-L3 | Low | GET hard-capped at 500 items with no truncation indicator — items 501+ are invisible to the admin with no warning or pagination. | `app/api/lcd-stock/route.ts:14` | ❌ Not Started |
| S12-L4 | Low | GET returns raw `_id` (MongoDB ObjectId) to admin client — unused by the client; leaks internal DB structure. | `app/api/lcd-stock/route.ts:14` | ❌ Not Started |
| S12-L5 | Low | `name` field can permanently diverge from `{phone_brand} {lcd_brand}` — if a PATCH updating both brand fields fails mid-execution, `name` is never re-derived. | `app/api/lcd-stock/[id]/route.ts:93–97` | ❌ Not Started |
| S12-L6 | Low | `compatible_models: []` in PATCH silently wipes all models — no confirmation, no minimum-length guard, no audit trail. | `app/api/lcd-stock/[id]/route.ts:49–62` | ❌ Not Started |
| S12-L7 | Low | `confirmingDeleteId` survives list re-renders — if items re-order while a delete is pending confirmation, the visual state mismatches the stored target ID. | `app/admin/page.tsx` — `LcdTable` component | ❌ Not Started |
| S12-L8 | Low | `Math.floor(Number(annaPrice))` accepts `"Infinity"`/`"NaN"` client-side — server correctly rejects with 400, but client receives no error feedback; form appears to hang. | `app/admin/page.tsx` — `LcdFormModal:handleSubmit` | ❌ Not Started |

### Informational

| ID | Severity | Issue | Notes |
|----|----------|-------|-------|
| S12-I1 | Info | Boolean coercion on price fields — `anna_price: true` stored as 1, `false` as 0; cosmetic type safety gap | Address with H1 fix |
| S12-I2 | Info | No audit log for LCD stock mutations — compromised session can silently wipe entire catalogue | Architectural; accepted risk for now |
| S12-I3 | Info | Hard delete only — no soft delete, no recycle bin; irreversible without manual DB restore | Architectural gap |
| S12-I4 | Info | No stored XSS vectors found in LCD client code — all user data rendered via JSX text nodes | Positive confirmation |

---

## Sessions Log

| Date | Changes |
|------|---------|
| 2026-03-24 Session 1 | Fixed C-1, C-2, C-3, H-1(partial), H-2, H-3, H-4, H-5, H-6, H-7, H-8, M-1(via H-3), M-8, L-3(via H-8), L-7(via H-5) |
| 2026-03-24 Session 2 | Fixed C-4 (rate limiting via `lib/publicRateLimit.ts`), M-2 (date bounds), M-3 (hex ID + unique index + retry), M-4 (double-booking check), M-6 (booked-slots validation), C-2 also applied to reservations `nameMismatches` |
| 2026-03-26 Session 3 | Fixed M-5 (`productId` stored on reservation; stock ops use numeric ID with name fallback), M-9 (30 min idle timeout via `lastActiveRef` + window events), L-4 (`req.json()` try/catch on appointments + reservations POST routes) |
| 2026-03-26 Session 4 | Fixed M-7 (`secure: true` on all cookie ops), L-1 (`.project({ _id: 0 })`), L-2 (rate-limit on booked-slots), L-5 (`/api/admin/ping` endpoint), L-6 (removed `unsafe-eval` from CSP), L-8 (skip lockout for unknown IP). Pentest found 6 new issues (N-1→N-6) — all fixed in same session: N-1 (logout cookie consistency), N-2 (rate-limit TOCTOU → atomic op), N-3 (reservation PATCH/DELETE wrong field → ObjectId), N-4 (repair-status validation), N-5 (lcd-stock POST validation), N-6 (customer POST name validation) |
| 2026-03-26 Session 5 | 4-agent verification of all prior fixes. All C/H/M/L/N fixes confirmed VERIFIED except: B-1 (CSRF on refresh, new finding), B-2 (M-9 idle logic flaw — 30min threshold never enforced at correct interval), B-3 (L-1 stock still exposed). 10 new issues found: S5-1 to S5-10 (3 Medium, 7 Low) plus 3 Informational. No fixes applied this session. |
| 2026-03-26 Session 6 | Standardized all string length limits across every PATCH route (previously only POST routes were validated). Fixed: appointments/[id] PATCH (name 100, brand 100, deviceType 100, service 100, time 20, problem 1000, phone regex — S5-2), reservations/[id] PATCH (name 100, phone regex, pickupTime 20, productName 200), products/[id] PATCH (name 200, category 100, image 500), lcd-stock/[id] PATCH (name max 200), products POST (image max 500). Also fixed S5-5: customers POST `type` validated against allowlist. Added global body size limit (8KB) via `middleware.ts` for all /api/* routes — returns 413 on oversized Content-Length. |
| 2026-03-26 Session 7 | Fixed all remaining B/S5 findings via 5 parallel agents + pentester verification. B-1/S5-1: CSRF header check on refresh route. B-2: idle check interval 50min→5min. B-3: stock stripped from public GET /api/products. S5-3/S5-9: unknown-IP guard on repair-status rate limiter. S5-4: partial unique index for atomic double-booking prevention. S5-6: 404 on missing product ID in PATCH/DELETE. S5-7: server-side pickupDate bounds (1–180 days + calendar overflow). S5-8: calendar overflow check on appointment dates. S5-10: bcrypt hash prefix validation on login. All 9 fixes pentester-verified with no bypasses or regressions found. |
| 2026-03-26 Session 8 | 5-agent parallel pentest of all security changes on feature/api-auth branch. No regressions found — all prior fixes verified intact. New findings: 4 Medium (S8-1: middleware body size bypass via chunked encoding, S8-2: repair-status rate-limit bypass for unknown IPs, S8-3: phone enumeration via repair-status, S8-4: stock double-decrement race), 8 Low (S8-5→S8-9: missing 404 checks on lcd-stock/customer/service-record routes, S8-10: stock inflation via toggling, S8-11: customer phone TOCTOU, S8-12: auto-increment ID race), 7 Informational. No fixes applied this session. |
| 2026-03-27 Session 9 | 4-agent pentest — found S9-H1 + S9-M1→M12 + S9-L1→L15 + S9-I1→I10; no fixes applied this session. |
| 2026-03-27 Session 10 | Fixed all S9 High + Medium (13 issues): nonce-based CSP (S9-H1), date validation on PATCH routes (S9-M1/M2), time canonicalization (S9-M3), per-endpoint rate buckets (S9-M4), ensureIndexes utility (S9-M5), slow-POST timeout (S9-M6), unknown-IP login tracking (S9-M7), JWT entropy check (S9-M8), CSP directives (S9-M9/M10/M11), MongoDB options (S9-M12). Pentest found 2 regressions: booked-slots missing endpoint arg (fixed), products/lcd-stock redundant createIndex calls (migrated to ensureIndexes). All 13 fixes verified. |
| 2026-04-03 Session 12 | 4-agent LCD Stock pentest (API specialist, frontend specialist, business logic specialist, UX specialist). 2H + 8M + 8L + 4I found. No fixes applied this session. See S12-H1→H2, S12-M1→M8, S12-L1→L8, S12-I1→I4. UX findings tracked separately in `.context/LCD_UX_REVIEW.md`. |
| 2026-03-27 Session 11 | Fixed all 15 S9 Low issues via 7 parallel agents: S9-L1 (slot E11000 → 409), S9-L2 (dismissMismatches strict bool), S9-L3 (ObjectId guard on records GET), S9-L4 (NaN guard on product/lcd-stock IDs), S9-L5 (stock restore guard === true), S9-L6 (reservations E11000 → findOne fallback), S9-L7 (login counter reset not deleted), S9-L8 (productPrice ≤ 1M), S9-L9 (booked-slots calendar overflow), S9-L10 (connect-src already in middleware), S9-L11 (removed data: from img-src in middleware), S9-L12 (serverActions.allowedOrigins), S9-L13 (pinned jose/bcryptjs/mongodb), S9-L14 (requireAdmin CSRF on GETs + admin page fetch headers), S9-L15 (password typeof string guard). Also removed duplicate/insecure CSP from next.config.ts (CSP is middleware-only with nonces). |
