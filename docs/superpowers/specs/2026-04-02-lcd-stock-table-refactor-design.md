# LCD Stock Table Refactor — Design Spec

**Date:** 2026-04-02
**Branch:** feature/lcd-stock-table
**Scope:** Admin panel LCD Stock tab — card grid → table layout + extended data model

---

## Overview

Refactor the LCD Stock section of the admin panel from a card grid into a structured table layout. Extends the data model with new fields: phone brand, LCD brand, compatible phone models, and supplier prices (Anna / Marlon). All changes confined to `app/admin/page.tsx` and `app/api/lcd-stock/`.

---

## Data Model

| Field | Type | Notes |
|---|---|---|
| `id` | number | Auto-increment, existing |
| `name` | string | Server-derived as `"${phone_brand} ${lcd_brand}".trim()` — kept for search; never rendered in UI |
| `phone_brand` | string | Required on POST, 1–100 chars, trimmed |
| `lcd_brand` | string | Required on POST, 1–100 chars, trimmed |
| `compatible_models` | string[] | Optional; each 1–100 chars (trimmed); max 50 items; defaults to `[]` |
| `anna_price` | number\|null | Optional; integer ≥ 0 or null; defaults to null |
| `marlon_price` | number\|null | Optional; integer ≥ 0 or null; defaults to null |
| `stock` | number | Integer ≥ 0, existing |

```ts
interface LcdItem {
  id: number;
  name: string;
  phone_brand: string;
  lcd_brand: string;
  compatible_models: string[];
  anna_price: number | null;
  marlon_price: number | null;
  stock: number;
}
```

---

## API Changes

### `POST /api/lcd-stock`

**Replace** the existing `name` validation entirely. The new validation:

1. **Remove** the `if (typeof body.name !== "string" || ...)` check.
2. **Require** `phone_brand` (string, 1–100 chars) and `lcd_brand` (string, 1–100 chars).
3. **Derive** `name = "${phone_brand.trim()} ${lcd_brand.trim()}".trim()` server-side (max 200 chars).
4. Any `name` key in the request body is silently ignored.

Required body fields: `phone_brand`, `lcd_brand`, `stock`.
Optional body fields: `compatible_models` (default `[]`), `anna_price` (default `null`), `marlon_price` (default `null`).

**Response:** full `LcdItem` shape (all fields) so client can append to state without re-fetching.

### `PATCH /api/lcd-stock/[id]`

**New allowlist:** `["phone_brand", "lcd_brand", "compatible_models", "anna_price", "marlon_price", "stock"]`.
`name` is **never accepted in the request body** and is not in the allowlist. It is only written as a derived value internally.

When `phone_brand` or `lcd_brand` is present in the patch, the server **must** fetch the existing document with `findOne({ id: numericId })` before building the `$set`, to resolve whichever of the two fields was not included in the request:

```ts
const existing = await col.findOne({ id: numericId });
const resolved_phone = (update.phone_brand ?? existing?.phone_brand ?? "").trim();
const resolved_lcd   = (update.lcd_brand   ?? existing?.lcd_brand   ?? "").trim();
update.name = `${resolved_phone} ${resolved_lcd}`.trim();
```

For legacy documents where `phone_brand`/`lcd_brand` is missing, `undefined ?? ""` treats the missing field as empty string. The derived `name` is stored as-is (no length re-validation — since each component field is individually capped at 100 chars, the combined result is at most 201 chars; this minor excess is acceptable because `name` is internal and never rendered).

**Response:** `{ ok: true }` — PATCH does not return the updated document. Since `name` is never rendered in the UI, in-memory staleness of the `name` field is acceptable.

**Validation (both POST and PATCH, applied only when field is present):**

| Field | Rule |
|---|---|
| `phone_brand` | string, trimmed, 1–100 chars |
| `lcd_brand` | string, trimmed, 1–100 chars |
| `compatible_models` | array of strings; each trimmed, 1–100 chars; max 50 items |
| `anna_price` | integer ≥ 0 or `null` |
| `marlon_price` | integer ≥ 0 or `null` |

---

## State and Handler Changes

### New state

```ts
// null = modal closed; non-null = show compatible_models for this item
const [modelsModalItem, setModelsModalItem] = useState<LcdItem | null>(null);
```

### Removed state

- `lcdStockInputs: Record<number, string>` — **removed**. The inline editable `<input type="number" onBlur>` from the card grid is **deliberately removed** in the table redesign. Stock is changed only via the −/+ buttons. This is an intentional UX simplification, not an oversight.

### Handler signatures

```ts
// Replaces addLcdItem(name, stock)
const addLcdItem = async (data: LcdItemFormData): Promise<void> => {
  // POST to /api/lcd-stock → returns full LcdItem → append to lcdItems
  setLcdItems(prev => [...prev, newItem]);
};

// Replaces editLcdName(id, name)
const editLcdItem = async (id: number, data: LcdItemFormData): Promise<void> => {
  // PATCH to /api/lcd-stock/[id] → on success, merge into local state (optimistic)
  setLcdItems(prev => prev.map(item =>
    item.id === id ? { ...item, ...data } : item
  ));
};

// Unchanged
const updateLcdStock = async (id: number, newStock: number): Promise<void>;
const deleteLcdItem  = async (id: number): Promise<void>;

// Used for both Add and Edit modal submission
interface LcdItemFormData {
  phone_brand: string;
  lcd_brand: string;
  compatible_models: string[];
  anna_price: number | null;
  marlon_price: number | null;
  stock?: number; // required in Add path; absent in Edit path
}
// NOTE: stock is typed optional but the Add form submit handler must guard
// that stock is present and valid before calling addLcdItem.
```

### Updated helper

```ts
// DELIBERATE THRESHOLD CHANGE:
// Old: 0=No Stock | 1=Low Stock | ≥2=In Stock
// New: 0=No Stock | 1–2=Low Stock | ≥3=In Stock
// (stock === 2 is intentionally reclassified from In Stock → Low Stock)
function lcdStockLevel(stock: number): { color: string; bg: string; label: string }
```

---

## UI Changes

### Stats Bar (new element, within the LCD Stock tab)

This is a **new per-tab component** added above the search bar inside the LCD Stock tab — not the existing global admin stats bar. Four metric cards, reactively computed from `lcdItems`. Counts **must** be derived using `lcdStockLevel` (not separate inline logic) so thresholds stay in sync with the Status badge:

| Card | Value |
|---|---|
| Total Types | `lcdItems.length` |
| In Stock | count where `lcdStockLevel(stock).label === "In Stock"` (i.e. `stock >= 3`) |
| Low Stock | count where `lcdStockLevel(stock).label === "Low Stock"` (i.e. `stock >= 1 && stock <= 2`) |
| Out of Stock | count where `lcdStockLevel(stock).label === "No Stock"` (i.e. `stock === 0`) |

### Search + Sort Bar (retained)

Existing search input and sort dropdown kept. Search filters by `name` (which is derived from `phone_brand + lcd_brand`, so brand-name searches work). Placeholder text updated to: `"Search by phone brand, LCD brand…"`.

### Table Layout

**min-width: 960px on `<table>`.** Parent wrapper: `overflow-x: auto`.

| # | Column | Width | Notes |
|---|---|---|---|
| 1 | Compatible Phone Models | 22% | First 2 pills; "+N more" → `setModelsModalItem(item)`; empty → italic "None added" |
| 2 | Phone Brand | 11% | Bold; `""` → `—` |
| 3 | LCD Brand | 11% | Muted; `""` → `—` |
| 4 | Anna *(grouped)* | 13% | ₱ integer format; null → `—` |
| 5 | Marlon *(grouped)* | 13% | Same; blue border on left+right of group |
| 6 | Status | 10% | Badge via `lcdStockLevel` |
| 7 | Stock | 10% | −/count/+ buttons only; − disabled at `stock === 0`; count color = `lcdStockLevel` color |
| 8 | Actions | 10% | Edit + Remove buttons |

**Supplier Price group header:** `colspan="2"` over Anna + Marlon, `color: #4F6EF7`, `border: 1px solid rgba(79,110,247,0.25)` on left and right.

**Remove:** inline two-step confirm using existing `confirmDeleteLcdId` state.

### Compatible Models Modal

State: `modelsModalItem` (null = closed; set to `null` on close).
- **Title:** `item.phone_brand.trim()` if non-empty, else `"Compatible Models"`
- Content: all `compatible_models` as blue pills
- Close button only

### Edit / Add Modal (`LcdFormModal`, expanded)

Same component for Add and Edit. Edit hides the Stock field (passed via `hideStock` prop, matching existing pattern).

| Field | Input | Required | Notes |
|---|---|---|---|
| Phone Brand | `type="text"` | Yes | 1–100 chars |
| LCD Brand | `type="text"` | Yes | 1–100 chars |
| Compatible Phone Models | Tag input | No | Enter or comma adds tag (trimmed); × removes; max 50; case-insensitive dedup (first-entered wins; stored as-typed, no normalization) |
| Anna Price | `type="number" min="0"` | No | `Math.floor` applied before submit; blank → `null` |
| Marlon Price | `type="number" min="0"` | No | Same as Anna |
| Stock | `type="number" min="0"` | Yes (Add only) | Hidden on Edit via `hideStock` prop |

`onSubmit(data: LcdItemFormData): void`

---

## Implementation Notes

- **No new files.** Sub-components at bottom of `page.tsx`: `LcdTable`, `LcdModelsModal`, expanded `LcdFormModal`.
- **Graceful degradation** for legacy documents: missing `phone_brand`/`lcd_brand` → `""` (renders as `—`); missing `compatible_models` → `[]`; missing prices → `null`.

---

## Out of Scope

- Search on `name` only (unchanged behavior — brand-name search works because name is derived from brands)
- No pagination (500-item limit retained)
- No bulk actions
- No mobile-optimized layout (horizontal scroll)
