# Repair Status Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/repair-status` page where customers look up their repair progress, backed by a new `repairStage` field that staff set from the admin appointment edit modal.

**Architecture:** New `repairStage` field on the `appointments` MongoDB collection (null until staff sets it). A new public `GET /api/repair-status` endpoint handles lookups by appointment ID or phone number, returning only safe fields. The existing appointment PATCH route and admin edit modal are extended to support the new field.

**Tech Stack:** Next.js 16 App Router, TypeScript, MongoDB (native driver), Tailwind CSS 4, Motion (Framer Motion successor), Lucide React.

**Spec:** `docs/superpowers/specs/2026-03-26-repair-status-checker-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/api/repair-status/route.ts` | **Create** | Public GET endpoint — lookup by appointmentId or phone |
| `app/repair-status/page.tsx` | **Create** | Customer-facing lookup page with progress tracker |
| `app/api/appointments/[id]/route.ts` | **Modify** | Add `repairStage` to allowed PATCH fields + validation |
| `app/admin/page.tsx` | **Modify** | Add `repairStage` to `AppointmentEntry` type + edit modal dropdown |

---

## Task 1: Extend the PATCH route to accept `repairStage`

**Files:**
- Modify: `app/api/appointments/[id]/route.ts:19-32`

- [ ] **Step 1: Add `repairStage` to the ALLOWED fields array**

In `app/api/appointments/[id]/route.ts`, change line 19:

```ts
const ALLOWED = ["status", "date", "time", "service", "brand", "deviceType", "name", "phone", "problem", "repairStage"] as const;
```

- [ ] **Step 2: Add repairStage validation after the status validation block (after line 32)**

```ts
const VALID_REPAIR_STAGES: (string | null)[] = ["Device Received", "Waiting for Parts", "Fixing", "Ready for Pickup", null];
if ("repairStage" in update && !VALID_REPAIR_STAGES.includes(update.repairStage as string | null)) {
  return NextResponse.json({ error: "Invalid repairStage" }, { status: 400 });
}
```

- [ ] **Step 3: Verify the server compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors related to `repairStage`.

- [ ] **Step 4: Commit**

```bash
git add app/api/appointments/[id]/route.ts
git commit -m "feat: add repairStage to appointment PATCH route"
```

---

## Task 2: Create the public `GET /api/repair-status` endpoint

**Files:**
- Create: `app/api/repair-status/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getClientIp, isPublicRateLimited } from "@/lib/publicRateLimit";

const DB = "azerotech";
const COL = "appointments";

const SAFE_PROJECTION = {
  _id: 0,
  appointmentId: 1,
  service: 1,
  brand: 1,
  deviceType: 1,
  date: 1,
  status: 1,
  repairStage: 1,
};

export async function GET(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db(DB);

  // Rate limit public lookups
  const ip = getClientIp(req);
  if (await isPublicRateLimited(db, ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const appointmentId = searchParams.get("appointmentId");
  const phone = searchParams.get("phone");

  // Require at least one param
  if (!appointmentId && !phone) {
    return NextResponse.json({ error: "Provide appointmentId or phone" }, { status: 400 });
  }

  // Validate phone format if provided (and no appointmentId)
  if (!appointmentId && phone && !/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const col = db.collection(COL);
  let doc;

  if (appointmentId) {
    // Exact match by appointmentId
    doc = await col.findOne({ appointmentId }, { projection: SAFE_PROJECTION });
  } else {
    // Most recent active appointment for this phone
    // Note: findOne() does not accept a sort option in the MongoDB Node.js driver.
    // Use find().sort().limit(1).next() to guarantee the most recent result.
    doc = await col
      .find({ phone, status: { $in: ["Pending", "Confirmed"] } })
      .sort({ submittedAt: -1 })
      .limit(1)
      .project(SAFE_PROJECTION)
      .next();
  }

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}
```

- [ ] **Step 2: Verify the server compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 3: Manual smoke test — not found case**

Start dev server (`npm run dev`), then:

```bash
curl "http://localhost:3000/api/repair-status"
# Expected: {"error":"Provide appointmentId or phone"}

curl "http://localhost:3000/api/repair-status?appointmentId=AZT-FAKE-000000"
# Expected: {"error":"Not found"}

curl "http://localhost:3000/api/repair-status?phone=08000000000"
# Expected: {"error":"Invalid phone number"}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/repair-status/route.ts
git commit -m "feat: add GET /api/repair-status public endpoint"
```

---

## Task 3: Add Repair Stage dropdown to the admin appointment edit modal

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Add `repairStage` to the `AppointmentEntry` interface**

Find the `AppointmentEntry` interface (around line 56) and add the field:

```ts
interface AppointmentEntry {
  // ... existing fields ...
  problem?: string;
  repairStage?: string | null;  // add this line
}
```

- [ ] **Step 2: Add `repairStage` state to `AppointmentEditModal`**

Inside `AppointmentEditModal` function, after the existing `useState` declarations (around line 2069), add:

```ts
const [repairStage, setRepairStage] = useState<string>(appt.repairStage ?? "");
```

- [ ] **Step 3: Include `repairStage` in the `handleSubmit` call**

Update `handleSubmit` in `AppointmentEditModal`:

```ts
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSave({
    name,
    phone,
    service,
    date,
    time,
    brand,
    deviceType,
    problem: problem || undefined,
    repairStage: repairStage || null,
  });
};
```

- [ ] **Step 4: Add the Repair Stage dropdown to the modal form**

After the Problem Description textarea block (around line 2213), add a new form block:

```tsx
<div>
  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
    Repair Stage <span className="normal-case font-normal text-slate-600">(optional)</span>
  </label>
  <select
    value={repairStage}
    onChange={(e) => setRepairStage(e.target.value)}
    className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
    style={inputStyle}
  >
    <option value="" style={{ background: "#0F1535" }}>— Not set —</option>
    <option value="Device Received" style={{ background: "#0F1535" }}>Device Received</option>
    <option value="Waiting for Parts" style={{ background: "#0F1535" }}>Waiting for Parts</option>
    <option value="Fixing" style={{ background: "#0F1535" }}>Fixing</option>
    <option value="Ready for Pickup" style={{ background: "#0F1535" }}>Ready for Pickup</option>
  </select>
</div>
```

- [ ] **Step 5: Verify the dev server renders the modal without errors**

Run `npm run dev`, open `/admin`, log in, click Edit on any appointment. Confirm the Repair Stage dropdown appears below Problem Description.

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add repair stage dropdown to appointment edit modal"
```

---

## Task 4: Create the customer-facing `/repair-status` page

**Files:**
- Create: `app/repair-status/page.tsx`

This page has five render states: empty (initial), loading, result with stage set, result with stage null, and error (not found / network).

- [ ] **Step 1: Create the page file**

```tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, CheckCircle2, Clock, Wrench, PackageCheck } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const STAGES = [
  { key: "Device Received",   label: "Received",     Icon: PackageCheck },
  { key: "Waiting for Parts", label: "Parts",         Icon: Clock },
  { key: "Fixing",            label: "Fixing",        Icon: Wrench },
  { key: "Ready for Pickup",  label: "Ready",         Icon: CheckCircle2 },
];

interface RepairResult {
  appointmentId: string;
  service: string;
  brand: string;
  deviceType: string;
  date: string;
  status: string;
  repairStage: string | null;
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function StageTracker({ currentStage }: { currentStage: string | null }) {
  const currentIdx = currentStage ? STAGES.findIndex((s) => s.key === currentStage) : -1;

  return (
    <div className="flex items-start gap-0 mt-6">
      {STAGES.map((stage, idx) => {
        const done = idx <= currentIdx;
        const { Icon } = stage;
        return (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all"
                style={{
                  background: done ? "linear-gradient(135deg, #4F6EF7, #6B84FF)" : "rgba(255,255,255,0.08)",
                  boxShadow: done ? "0 4px 12px rgba(79,110,247,0.35)" : "none",
                }}
              >
                <Icon className="w-4 h-4" style={{ color: done ? "white" : "#475569" }} />
              </div>
              <span
                className="text-xs font-semibold text-center leading-tight"
                style={{ color: done ? "#8B9EFF" : "#475569" }}
              >
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className="h-0.5 flex-1 -mt-5 mx-1 transition-all"
                style={{ background: idx < currentIdx ? "#4F6EF7" : "rgba(255,255,255,0.1)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RepairStatusPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const param = /^09\d{9}$/.test(trimmed)
        ? `phone=${encodeURIComponent(trimmed)}`
        : `appointmentId=${encodeURIComponent(trimmed)}`;

      const res = await fetch(`/api/repair-status?${param}`);

      if (res.status === 404) {
        setError("No active repair found. Check your Appointment ID or phone number.");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        setResult(await res.json());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-6 py-24"
      style={{ background: "linear-gradient(135deg, #080B1A 0%, #0F1535 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="inline-flex items-center gap-2 border rounded-full px-5 py-2.5 text-sm mb-5"
            style={{
              background: "rgba(79,110,247,0.15)",
              borderColor: "rgba(79,110,247,0.3)",
              color: "#8B9EFF",
              fontWeight: 500,
            }}
          >
            <Search className="w-3.5 h-3.5" />
            Repair Tracker
          </span>
          <h1 className="text-3xl font-bold text-white mb-3">Track Your Repair</h1>
          <p className="text-slate-400 text-sm">
            Enter your Appointment ID or phone number to check the status of your device.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="AZT-260326-AB1C2D  or  09XXXXXXXXX"
            disabled={loading}
            className="flex-1 px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600 transition-opacity"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(79,110,247,0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", boxShadow: "0 6px 20px rgba(79,110,247,0.3)" }}
          >
            {loading ? "…" : "Check"}
          </button>
        </form>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease }}
            className="rounded-xl px-5 py-4 text-sm font-medium mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}
          >
            {error}
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(79,110,247,0.2)" }}
          >
            {/* Appointment summary */}
            <div className="mb-1">
              <span
                className="text-xs font-mono tracking-widest font-bold"
                style={{ color: "#4F6EF7" }}
              >
                {result.appointmentId}
              </span>
            </div>
            <div className="text-white font-bold text-lg mb-1">
              {result.service} — {result.brand} {result.deviceType}
            </div>
            <div className="text-slate-400 text-sm mb-6">{formatDate(result.date)}</div>

            {/* Stage display */}
            {result.repairStage ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Stage</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(79,110,247,0.2)", color: "#8B9EFF" }}
                  >
                    {result.repairStage}
                  </span>
                </div>
                <StageTracker currentStage={result.repairStage} />
              </>
            ) : (
              <div
                className="rounded-xl px-5 py-4 text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
              >
                Your device has been received. We&apos;ll update the repair stage shortly.
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 3: Manual test in browser**

Run `npm run dev`, open `http://localhost:3000/repair-status`.

Check each state:
1. Submit with empty input — button stays disabled
2. Submit a fake appointment ID (`AZT-FAKE-000000`) — should show "No active repair found..."
3. Submit an invalid phone (`08000000000`) — server returns 400, UI shows "Something went wrong..."
4. Submit a real appointment ID from your database — should show the result card
5. Verify that if `repairStage` is null, the "We'll update..." message appears (not the tracker)

- [ ] **Step 4: Commit**

```bash
git add app/repair-status/page.tsx
git commit -m "feat: add /repair-status customer page with progress tracker"
```

---

## Task 5: Add link to Repair Status page in the site header

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: Find the nav links array in Header.tsx and add the repair status link**

Open `components/Header.tsx`. Find the nav links array (likely something like `[{ href: "/", label: "Home" }, ...]`). Add:

```ts
{ href: "/repair-status", label: "Track Repair" }
```

- [ ] **Step 2: Verify the header renders the new link**

Run `npm run dev`, check the header on any page. The "Track Repair" link should appear and navigate to `/repair-status`.

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add Track Repair link to site header"
```

---

## Done

All five tasks complete means:
- Staff can set repair stage on any appointment via the admin edit modal
- Customers can look up their repair stage at `/repair-status` by appointment ID or phone number
- Null stage shows a graceful "received, updating soon" message
- Rate limiting protects the new public endpoint
- Header links users to the tracker page
