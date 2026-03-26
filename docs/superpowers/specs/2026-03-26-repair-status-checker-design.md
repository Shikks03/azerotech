# Repair Status Checker — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

A customer-facing page where users can look up the current repair stage of their device by entering either their Appointment ID or phone number. Staff update the stage from the admin panel's existing appointment edit modal.

---

## 1. Database

Add an optional `repairStage` field to the `appointments` collection.

**Allowed values:** `"Device Received"` | `"Waiting for Parts"` | `"Fixing"` | `"Ready for Pickup"`
**Default:** `null` (not set — staff set it manually; no auto-assignment on status change)

No migration needed — existing documents without the field are treated as `null`.

---

## 2. API — `GET /api/repair-status`

New **public** endpoint (no auth required). Accepts one of:

| Query param | Format | Behavior |
|-------------|--------|----------|
| `appointmentId` | `AZT-YYMMDD-XXXXXX` | Exact match |
| `phone` | `09XXXXXXXXX` | Returns most recent appointment with status `Pending` or `Confirmed` |

**Response (200):**
```json
{
  "appointmentId": "AZT-260326-AB1C2D",
  "service": "Phone Repair",
  "brand": "Samsung",
  "deviceType": "Galaxy S22",
  "date": "2026-03-28",
  "status": "Confirmed",
  "repairStage": "Fixing"
}
```

**If both params provided:** `appointmentId` takes priority; `phone` is ignored.

**Error responses:**
- `400` — missing/invalid query params (neither `appointmentId` nor `phone` provided, or phone doesn't match `^09\d{9}$`)
- `404` — no matching appointment found

**Security:** Response never includes `name`, `phone`, `_id`, `customerId`, or any internal field. Phone lookup only matches `Pending`/`Confirmed` to avoid exposing historical records.

**Rate limiting:** Must explicitly call `publicRateLimit()` from `lib/publicRateLimit.ts` at the top of the handler (same pattern as `/api/appointments` and `/api/reservations` POST routes). 20 req / 10 min per IP.

---

## 3. Customer Page — `/repair-status`

New page at `app/repair-status/page.tsx`.

### States

**Empty (initial):** Search form with a single text input. Placeholder: `AZT-260326-AB1C2D or 09XXXXXXXXX`. Submit button.

**Loading:** Input disabled, spinner shown.

**Result — stage set:** Show appointment summary card (service, device, date) + 4-step progress tracker highlighting current stage.

**Result — stage null (not yet assigned):** Show appointment summary card with a message: `"Your device has been received. We'll update the repair stage shortly."` Progress tracker shows no steps active.

**Not found (404):** Inline error: `"No active repair found. Check your Appointment ID or phone number."`

**Error (network/500):** Inline error: `"Something went wrong. Please try again."`

### Progress Tracker

Four steps rendered as a horizontal stepper: Device Received → Waiting for Parts → Fixing → Ready for Pickup. Steps up to and including the current stage are filled (indigo); subsequent steps are grey.

### Design

Matches existing site design system: `navy-dark` background, `indigo-electric` accent, Space Grotesk font, `motion` fade-up animations.

---

## 4. Admin Edit Modal

Add a **Repair Stage** dropdown to the existing appointment edit modal in `app/admin/page.tsx`.

- Positioned alongside the existing Status dropdown
- Options: `— Not set —`, `Device Received`, `Waiting for Parts`, `Fixing`, `Ready for Pickup`
- Visible for **all** appointments (staff may want to set it even on Pending ones)
- Sent as `repairStage` in the `PATCH /api/appointments/[id]` request body
- The existing PATCH route must be updated to accept and persist `repairStage`

---

## 5. PATCH Route Update

`app/api/appointments/[id]/route.ts` PATCH handler:

- Accept optional `repairStage` field
- Validate: must be one of the four allowed values or `null`
- Persist alongside other updatable fields

---

## Out of Scope

- Push notifications or SMS alerts
- Estimated completion time
- Repair history (multiple past repairs per phone lookup)
- Public exposure of customer name or phone number
