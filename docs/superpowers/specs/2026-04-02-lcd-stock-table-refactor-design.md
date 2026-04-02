# LCD Stock Table Refactor — Design Spec

**Date:** 2026-04-02
**Branch:** feature/lcd-stock-table (new branch from master)
**Scope:** Admin panel LCD Stock tab — card grid → table layout + extended data model

---

## Overview

Refactor the LCD Stock section of the admin panel from a card grid into a structured table layout. Extends the data model with new fields: phone brand, LCD brand, compatible phone models, and supplier prices (Anna / Marlon). All changes are confined to `app/admin/page.tsx` and `app/api/lcd-stock/` to match existing codebase conventions.

---

## Data Model Changes

### MongoDB document (collection: `lcd_stock`)

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Auto-increment, existing |
| `name` | `string` | Internal identifier, existing — kept for backwards compat |
| `phone_brand` | `string` | e.g. Apple, Samsung (max 100 chars) |
| `lcd_brand` | `string` | e.g. Tianma, Incell, Original (max 100 chars) |
| `compatible_models` | `string[]` | List of phone model names (each max 100 chars, array max 50 items) |
| `anna_price` | `number \| null` | Supplier price — Anna (₱, integer ≥ 0, or null) |
| `marlon_price` | `number \| null` | Supplier price — Marlon (₱, integer ≥ 0, or null) |
| `stock` | `number` | Integer ≥ 0, existing |

### TypeScript interface update (`LcdItem`)

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

### `POST /api/lcd-stock` and `PATCH /api/lcd-stock/[id]`

Add validation for new fields. All new fields are optional on PATCH (allowlist-based, same pattern as existing).

| Field | Validation |
|---|---|
| `phone_brand` | string, trimmed, 1–100 chars |
| `lcd_brand` | string, trimmed, 1–100 chars |
| `compatible_models` | array of strings, each 1–100 chars, max 50 items |
| `anna_price` | integer ≥ 0 or `null` |
| `marlon_price` | integer ≥ 0 or `null` |

Existing `name` and `stock` validation is unchanged.

---

## UI Changes

### Stats Bar (above table)

Four metric cards, reactively computed from `lcdItems` state:

| Card | Value |
|---|---|
| Total Types | `lcdItems.length` |
| In Stock | count where `stock >= 3` |
| Low Stock | count where `stock >= 1 && stock <= 2` |
| Out of Stock | count where `stock === 0` |

### Search + Sort Bar (kept, above table)

Existing search input and sort dropdown retained unchanged.

### Table Layout

**Column order:**

| # | Column | Width | Notes |
|---|---|---|---|
| 1 | Compatible Phone Models | 22% | Pill tags — show first 2; if more, show "+N more" button opening a modal |
| 2 | Phone Brand | 11% | Plain bold text |
| 3 | LCD Brand | 11% | Plain text, muted color |
| 4 | Anna *(grouped)* | 13% | Under "Supplier Price" colspan header; ₱ format or — |
| 5 | Marlon *(grouped)* | 13% | Same; blue border on left/right of group |
| 6 | Status | 10% | Badge: In Stock (green) / Low Stock (yellow) / No Stock (red) |
| 7 | Stock | 10% | Inline − / count / + controls |
| 8 | Actions | 10% | Edit + Remove buttons |

**"Supplier Price" group header** spans Anna + Marlon columns with a subtle blue (`#4F6EF7`) label and blue border dividers.

**Status thresholds:**
- `stock === 0` → No Stock (red)
- `stock === 1 || stock === 2` → Low Stock (yellow)
- `stock >= 3` → In Stock (green)

**Compatible Phone Models cell:**
- Render first 2 models as blue pill tags
- If `compatible_models.length > 2`, render a "+N more" ghost button
- Clicking "+N more" opens a read-only modal listing all models for that row
- If `compatible_models` is empty, show italic muted "None added"

**Stock cell:**
- `−` button: disabled + 30% opacity when `stock === 0`; calls `updateLcdStock(id, stock - 1)`
- Count displayed between buttons; color matches status (green/yellow/red)
- `+` button: always enabled; calls `updateLcdStock(id, stock + 1)`
- Stock count display is read-only (no direct text input in table — editing via modal)

**Remove button:**
- Inline two-step confirm: first click shows "Confirm / Cancel" inline (same pattern as existing card grid)

### Compatible Models Modal (read-only, "+N more")

- Simple modal listing all `compatible_models` as pill tags
- Title: LCD name or phone brand
- Close button only (no edits from here — edits go through Edit modal)

### Edit / Add Modal (expanded `LcdFormModal`)

Both Add and Edit use the same modal with all fields:

| Field | Input type | Notes |
|---|---|---|
| Phone Brand | text input | Required |
| LCD Brand | text input | Required |
| Compatible Phone Models | tag input | Type + Enter/comma to add; × button to remove each tag |
| Anna Price | number input | Optional; leave blank = null |
| Marlon Price | number input | Optional; leave blank = null |
| Stock | number input | Required; hidden on Edit (stock changed via table controls) |

The existing `LcdFormModal` is replaced with an expanded version. Add and Edit both use the same component; Edit hides the Stock field (stock is managed inline in the table).

---

## Implementation Approach

- **All changes in `app/admin/page.tsx`** — consistent with existing pattern (no new component files)
- New sub-components defined at bottom of `page.tsx`: `LcdTable`, `LcdModelsModal`, expanded `LcdFormModal`
- API routes updated in `app/api/lcd-stock/route.ts` and `app/api/lcd-stock/[id]/route.ts`
- Existing documents missing new fields render gracefully: `phone_brand` → empty string, `compatible_models` → `[]`, prices → `null`

---

## Out of Scope

- Search does not filter by phone brand or LCD brand (name-only, same as current)
- No pagination (existing 500-item limit retained)
- No bulk actions
- No mobile-specific layout (table scrolls horizontally on small screens)
