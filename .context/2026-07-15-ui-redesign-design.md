# UI Redesign — Design Spec

**Date:** 2026-07-15
**Status:** Approved — ready for implementation planning
**Source design:** Stitch project *"AzeroTech Homepage Redesign V1"* (`projects/15042424290959524528`)

---

## 1. Goal

Convert the public-facing AzeroTech site from its current **light theme** to the
**dark, glass/neon design** produced in Google Stitch. This is a presentational
redesign only — no API, data-model, or business-logic changes. The existing APIs
are already connected and stay untouched.

## 2. Locked decisions

| Decision | Choice |
|----------|--------|
| Visual direction | Implement the Stitch output faithfully, backgrounds included |
| Homepage structure | The **"Full Homepage"** section flow |
| Homepage hero | Use the **V1 hero** (*"We Fix What Matters Most"* + neon device art + Book Appointment / Call Shop / Messenger) as the top section |
| Background | **V1-b** dark-blue gradient. Ships **without** the floating 3D shapes for now. |
| 3D shapes | **Deferred.** User will supply transparent PNG assets later; `PageBackground` is built to slot them in without rework. Not a blocker. |
| Page scope | **All public pages** (Admin excluded) |
| No-backend content | Reviews, contact "Send a Message" form, service prices ship **static now**, logged as backend-later follow-ups |
| Implementation approach | **Foundation-first, then page-by-page** |

## 3. Current-state findings (why this matters)

- The site is currently **light-themed**: `globals.css` sets `body { background:#ffffff }`,
  the `Header` is white with black nav text, and tokens (`--surface:white`,
  `--text-primary:navy`) are all light.
- Every Stitch design is **dark-first**. So the core of this work is a light→dark
  conversion of the **shared** design system, not per-page cosmetics.
- `Header` and `Footer` are global (rendered in `app/layout.tsx`) and already hide
  themselves on `/admin` — so a dark shell applies to all public pages automatically.
- Button utilities (`.btn`, `.btn-primary/secondary/ghost`) already exist and the
  accent colors (`--indigo-electric #4F6EF7`, `--indigo-light #6B7FFF`) already match
  the Stitch neon blue.

## 4. Architecture

### 4.1 Design-system foundation (`app/globals.css`)
- Flip token layer to dark: `body` background → `--navy-dark`; default text → light
  (`--gray-light`).
- Keep existing indigo accents (already on-brand).
- Add dark-surface tokens: glass fill `rgba(255,255,255,.05)`, glass border
  `rgba(255,255,255,.1)`, tile background, and a `--glow` accent.
- Add utility classes:
  - `.glass` — frosted panel: translucent fill + `backdrop-blur` + hairline border.
  - `.tile` — service/feature card surface.
  - Retune `.btn-*` for the dark background.
- Font stays **Space Grotesk** (already loaded) — close enough to the mockups; avoids a swap.

### 4.2 Shared primitives (new components in `components/`)
Each is a small, independently understandable unit composed by the pages.

| Component | Responsibility | Depends on |
|-----------|----------------|------------|
| `PageBackground` | Fixed layer: V1-b dark-blue gradient, `pointer-events-none`, behind content. Built with a slot for floating 3D-shape PNGs (deferred) so they drop in later without rework | globals tokens |
| `GlassCard` | Frosted panel wrapper (`.glass`) | globals tokens |
| `ServiceTile` / `FeatureTile` | Icon + title + copy tile for grids | `.tile` |
| `SectionHeading` | Centered title + subtitle | — |
| `Header` (rebuild) | Transparent → dark-glass on scroll, light nav text (fixes bug #1 "invisible nav on scroll"); keep current 6 links + Book Now | globals tokens |
| `Footer` (rebuild) | Dark footer matching Stitch (brand blurb, contact, quick links) | globals tokens |

### 4.3 Page mapping

- **Home (`app/page.tsx`)** — V1 hero → Our Services (4 tiles → link to real pages) →
  Why Choose Us (3 tiles) → **Repair Tracker** input (wires to existing `/repair-status`)
  → **Customer Reviews** (static, 3 sample cards) → Footer.
- **Services (`app/services/page.tsx`)** — 4 glass service cards (Screen Replacement,
  Battery Repair, Software Fixes, Data Recovery) with **static** prices/times + "Request Quote".
- **Contact (`app/contact/page.tsx`)** — Contact Details + **"Send a Message" form**
  (static; submit → mailto/Messenger for now) + embedded map.
- **Book Appointment / Accessories / Repair Status** — no Stitch design; **re-skin**
  the existing pages with the new tokens + primitives (glass panels, dark forms),
  **preserving all current functionality and API calls**.

## 5. Out of scope / unchanged
- All API routes, data flow, admin panel, business logic — untouched.
- Admin dashboard stays light/as-is (Header/Footer already hide on `/admin`).

## 6. No-backend content handling
Ship static now, log follow-ups in `.context/TRACKER.md`:
1. Customer reviews / testimonials (homepage) — hardcoded sample cards.
2. Contact "Send a Message" form — renders + validates client-side; submit routes to
   mailto/Messenger until a real endpoint exists.
3. Per-service prices/times (services page) — hardcoded content.

## 7. Risks / dependencies
- **3D shape assets (deferred, non-blocking)** — the floating torus/pyramid/cubes are
  cut from the initial build. The user is producing the transparent PNGs and will
  supply them later. `PageBackground` ships with just the V1-b gradient but is built
  to accept the shape layer without rework. Logged as a follow-up in `.context/TRACKER.md`.
- **Dark-conversion regressions** — hunt down page-specific light styling
  (hardcoded `text-black`, white backgrounds) during each page's conversion.
- **`backdrop-blur` performance** — many glass panels + floating shapes; keep shape
  count modest and blur radius reasonable; test on mid-range hardware.

## 8. Implementation order
1. **Foundation** — dark tokens + `.glass`/`.tile` utilities in `globals.css`;
   build `PageBackground` (V1-b gradient only; shape slot left for later).
2. **Global shell** — rebuild `Header` + `Footer` (dark).
3. **Primitives** — `GlassCard`, `ServiceTile`/`FeatureTile`, `SectionHeading`.
4. **Home** → **Services** → **Contact** (designed pages, high fidelity).
5. **Book Appointment** → **Accessories** → **Repair Status** (re-skin, preserve behavior).
6. Log no-backend follow-ups in `.context/TRACKER.md`.

## 9. Verification per page
- Renders with dark theme, no leftover light styling.
- All existing links/forms/API calls still work (manual click-through).
- Responsive at mobile + desktop; nav readable at all scroll positions.
- No console errors; `npm run build` and `npm run lint` clean.
