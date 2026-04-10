# LCD Stock Tab — UX Review

**Date:** 2026-04-03
**Reviewer:** UX Specialist (sub-agent)
**Scope:** `LcdTable`, `LcdFormModal`, `LcdModelsModal`, LCD tab container (search/sort/empty states)

> **⚠️ Delete this file once every issue below is marked ✅ Fixed.**

---

## Accessibility

| ID | Severity | Issue | Location | Status |
|----|----------|-------|----------|--------|
| UX-A1 | High | Delete button (trash icon only) has no accessible label — `title="Remove"` is tooltip-only and ignored by most screen readers | `LcdTable` — delete button | ❌ Not Started |
| UX-A2 | High | "Yes" / "No" inline confirmation buttons carry zero context for screen readers — announced as bare "Yes" / "No" with no indication of what is being confirmed | `LcdTable` — confirmingDeleteId branch | ❌ Not Started |
| UX-A3 | High | `<th>` elements have no `scope="col"` — screen readers cannot reliably associate headers with data cells, especially with the two-row grouped header structure | `LcdTable` — both header rows | ❌ Not Started |
| UX-A4 | Medium | Disabled `−` button uses only `disabled` attribute, not `aria-disabled` — some AT combinations skip `disabled` buttons entirely | `LcdTable` — stock decrement button | ❌ Not Started |
| UX-A5 | Medium | `opacity-30` on the disabled decrement button is borderline for low-vision users — no secondary indicator beyond opacity change | `LcdTable` — stock decrement button | ❌ Not Started |
| UX-A6 | Medium | Model pill buttons open a modal but carry no `aria-label` or `aria-haspopup="dialog"` — screen reader announces raw model string with no context | `LcdTable` — shownModels pill buttons | ❌ Not Started |
| UX-A7 | Medium | `LcdModelsModal` has no `role="dialog"`, `aria-modal="true"`, or `aria-labelledby` — screen readers do not know external content is inert | `LcdModelsModal` | ❌ Not Started |
| UX-A8 | Medium | Focus is not trapped inside either modal — Tab cycles through the full page behind the overlay; violates WCAG 2.1 SC 2.1.2 | `LcdFormModal`, `LcdModelsModal` | ❌ Not Started |
| UX-A9 | Medium | `LcdFormModal` has no `role="dialog"`, `aria-modal="true"`, or `aria-labelledby` | `LcdFormModal` | ❌ Not Started |
| UX-A10 | Low | `text-slate-500` on column headers (~5.5:1 contrast) is close to AA threshold — OLED/subpixel rendering could push it under | `LcdTable` — all `<th>` | ❌ Not Started |
| UX-A11 | Low | "+N more" button has no `aria-label` — announced as "+3 more" with no context | `LcdTable` — remainingCnt button | ❌ Not Started |
| UX-A12 | Info | No `<caption>` or `aria-label` on the table — screen reader users entering the table have no announced context | `LcdTable` — `<table>` element | ❌ Not Started |

---

## Usability & Quality of Life

| ID | Severity | Issue | Location | Status |
|----|----------|-------|----------|--------|
| UX-U1 | High | No loading/pending feedback during any async operation (add, edit, delete, stock ±) — admin has no way to know if action was received, is processing, or failed | Entire LCD tab | ❌ Not Started |
| UX-U2 | High | No success or error toast/notification after any operation — modal closes (or silently stays open on error) with zero confirmation | LCD tab + modals | ❌ Not Started |
| UX-U3 | High | Stock can only be changed ±1 per click — restocking to 47 requires 47 individual presses; no direct number input | `LcdTable` — stock cell | ❌ Not Started |
| UX-U4 | High | Edit modal hides stock field entirely (`hideStock=true`) — editing brand or prices forces a separate +/- operation for stock; two-step operation for one conceptual action | `LcdFormModal` | ❌ Not Started |
| UX-U5 | Medium | Inline delete "Yes / No" buttons are `text-xs` with minimal padding, placed adjacent — high misclick probability on touchpad or touch screen | `LcdTable` — confirmingDeleteId branch | ❌ Not Started |
| UX-U6 | Medium | Model pill tags have no `cursor-pointer` and only `hover:opacity-80` — clickability is not visually communicated | `LcdTable` — model pill buttons | ❌ Not Started |
| UX-U7 | Medium | Tag input: comma key adds a tag but the comma character briefly renders in the input before being stripped | `LcdFormModal` — compatible models tag input | ❌ Not Started |
| UX-U8 | Medium | "Add LCD Type" label is ambiguous — "type" could mean screen type, brand type, or category; plain-language alternatives: "Add LCD Item" / "New LCD Entry" | LCD tab header button | ❌ Not Started |
| UX-U9 | Medium | Sort options omit "High Stock" — the natural complement to "Low Stock"; useful during stock-taking | LCD tab sort dropdown | ❌ Not Started |
| UX-U10 | Low | No phone-brand filter dropdown — with 80+ rows the search bar is the only discovery path; no quick way to see all Samsung entries | LCD tab toolbar | ❌ Not Started |
| UX-U11 | Low | No pagination or virtual scrolling — beyond ~100 rows the table becomes unwieldy; API already caps at 500 | LCD tab container | ❌ Not Started |
| UX-U12 | Low | Empty state has a message but no embedded call-to-action button | LCD tab empty state | ❌ Not Started |
| UX-U13 | Low | No bulk delete — removing multiple discontinued items one at a time is tedious | LCD tab table | ❌ Not Started |
| UX-U14 | Info | Price display lacks thousands separators — ₱1500 vs ₱1,500 | `LcdTable` — Anna/Marlon price cells | ❌ Not Started |

---

## Information Architecture

| ID | Severity | Issue | Location | Status |
|----|----------|-------|----------|--------|
| UX-IA1 | Medium | Column order is counterintuitive — "Compatible Models" (22%) is first but "Phone Brand" is the primary identity; admins must scan past the models column to find the brand | `LcdTable` — column order | ❌ Not Started |
| UX-IA2 | Medium | "Anna" and "Marlon" column headers are opaque to any new admin — no tooltip, legend, or sub-label explains these are supplier names | `LcdTable` — Anna/Marlon `<th>` | ❌ Not Started |
| UX-IA3 | Low | "Status" badge and numerical "Stock" column are redundant — badge conveys no information the number doesn't already show | `LcdTable` — Status column | ❌ Not Started |
| UX-IA4 | Low | 2-model cutoff for pill tags is arbitrary — showing "+1 more" for a 3-model item forces a click to see a single extra value | `LcdTable` — shownModels slice | ❌ Not Started |
| UX-IA5 | Low | "—" for null prices is ambiguous — could mean zero, not set, or not applicable | `LcdTable` — price cells | ❌ Not Started |
| UX-IA6 | Info | Staff names ("Anna", "Marlon") in headers are a privacy concern if the admin screen is visible to walk-in customers or on shared displays | `LcdTable` — Anna/Marlon headers | ❌ Not Started |

---

## Error Handling & Feedback

| ID | Severity | Issue | Location | Status |
|----|----------|-------|----------|--------|
| UX-EH1 | High | API errors on Add/Edit (400, 500) cause silent no-op — modal stays open or closes with no error message visible to the admin | `LcdFormModal` on submit | ❌ Not Started |
| UX-EH2 | High | Failed stock update does not roll back UI value — displayed count stays wrong with no indication | `LcdTable` — onUpdateStock handler | ❌ Not Started |
| UX-EH3 | High | Failed delete is silent — item disappears from UI while still existing in DB; no recovery path without reload | `LcdTable` — onDelete handler | ❌ Not Started |
| UX-EH4 | Medium | No validation feedback for duplicate entries — server error is silently swallowed | `LcdFormModal` | ❌ Not Started |
| UX-EH5 | Medium | Tag dedup is silent — typing an existing model name does nothing; admin gets no feedback that it was a duplicate | `LcdFormModal` — tag dedup logic | ❌ Not Started |
| UX-EH6 | Low | No success confirmation after "Add LCD Type" — modal closes, table may be slow to reflect the new item with no message | LCD tab post-add state | ❌ Not Started |

---

## Mobile / Responsive

| ID | Severity | Issue | Location | Status |
|----|----------|-------|----------|--------|
| UX-M1 | Medium | `minWidth: 960` forces horizontal scroll on viewports <960px (tablets in portrait, small laptops) with no scroll hint | `LcdTable` — wrapping div | ❌ Not Started |
| UX-M2 | Medium | Action buttons (`text-xs`, `px-2.5 py-1.5`) are well below the 44×44 px touch target minimum | `LcdTable` — Actions cell | ❌ Not Started |
| UX-M3 | Low | +/- stock buttons are `w-7 h-7` (28px) — below touch target guideline; only 6px apart | `LcdTable` — stock cell | ❌ Not Started |
| UX-M4 | Low | No responsive column hiding — all 8 columns render regardless of viewport width | `LcdTable` — all columns | ❌ Not Started |
| UX-M5 | Info | `LcdFormModal` tag container has no max-height cap — many tags can make the modal very tall on mobile | `LcdFormModal` — tag display area | ❌ Not Started |

---

## Top 3 Priority Fixes (UX Specialist Recommendation)

1. **Async feedback (UX-U1, UX-U2, UX-EH1–EH3)** — Every mutating operation fires with no spinner, no success confirmation, and no error recovery. This is the single highest daily-impact issue.

2. **Inaccessible modals and table structure (UX-A3, UX-A7, UX-A8, UX-A9)** — Neither modal declares `role="dialog"` or `aria-modal`; focus is not trapped; table headers lack `scope`. The tab is unusable with a screen reader.

3. **Stock editing impractical for bulk updates (UX-U3, UX-U4)** — Any restocking event requires one click per unit. Allow typing stock directly, either via inline edit on the cell or by re-enabling the stock field in the Edit modal.
