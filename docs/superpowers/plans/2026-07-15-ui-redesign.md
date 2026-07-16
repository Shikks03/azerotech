# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all public AzeroTech pages to the dark glass/neon Stitch design — one consistent all-dark surface, shared design primitives, and two new homepage sections (Repair Tracker, Customer Reviews) — without changing any API or business logic.

**Architecture:** Foundation-first. Establish dark tokens + `.glass`/`.tile` utilities + a shared `PageBackground` and extract the duplicated motion/heading helpers into shared modules. Then recolor each page's existing light content sections to dark glass (layouts/content already exist), and add the two new homepage sections. Purely presentational.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, Tailwind CSS 4, Motion (`motion/react`), Lucide icons, TypeScript. No test runner configured — verification is `npm run build` + `npm run lint` + a color-audit grep + manual visual check.

---

## Conventions used by every task

**Verification (the "test" for a visual redesign, since no unit-test runner exists):**
- `npm run lint` → Expected: no new errors/warnings.
- `npm run build` → Expected: `✓ Compiled successfully`, no type errors.
- Color-audit grep (per page) → Expected: zero light-surface leftovers, see each task.
- Manual: `npm run dev`, open the page, confirm dark surfaces, readable text (contrast), working links/forms, and no console errors at 375px + 1440px.

**Light → dark-glass color mapping (used throughout the recolor tasks):**

| Old (light) | New (dark glass) |
|-------------|------------------|
| `style={{ background: "#F7F8FF" }}` on a `<section>` | remove the inline bg → `className="... relative"` (section becomes transparent over the global dark base) |
| `bg-white` card + `border-slate-100` + `boxShadow: "0 2px 12px rgba(0,0,0,0.04/0.05)"` | `className="glass glass-hover"` (drop the inline white bg/border/shadow) |
| `text-[#0F172A]` / `text-slate-900` (headings) | `text-white` |
| `text-slate-500` body on light | `text-slate-400` |
| icon chip `style={{ background: "#EEF1FF" / "#ECFEFF" / "#FFFBEB" / "#F5F3FF" }}` | `style={{ background: "rgba(79,110,247,0.15)" }}` (keep the per-icon accent `color`) |
| badge Open `#DCFCE7` / `#15803D` | `style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}` |
| badge neutral `#F1F5F9` / `#64748B` | `style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8" }}` |
| wave divider `fill="#F7F8FF"` / `fill="#F7F9FF"` | delete the wave `<svg>` block (no light section beneath it anymore) |

Keep every accent color (`#4F6EF7`, `#6B84FF`, `#06B6D4`, `#8B9EFF`), every `motion` animation, all copy, all `href`s, all `iframe`/map embeds, and all form logic **unchanged**.

---

## File structure

**Create:**
- `lib/motion.ts` — shared `ease`, `fadeUp`, `fadeUpView` (currently duplicated in 5 files).
- `components/PageBackground.tsx` — fixed dark gradient + grid + glow-orb layer; slot for future 3D PNGs.
- `components/SectionHeading.tsx` — eyebrow + title + optional subtitle.
- `components/GlassCard.tsx` — `.glass` wrapper.
- `components/ServiceTile.tsx` — icon-chip + title + copy + "learn more" link tile.
- `components/FeatureTile.tsx` — icon-chip + title + copy (Why-Us style).
- `components/ReviewCard.tsx` — testimonial card (static content).
- `components/RepairTrackerCTA.tsx` — homepage input that routes to `/repair-status?ref=…`.

**Modify:**
- `app/globals.css` — dark tokens, `.glass`/`.tile`/`.text-glow` utilities, dark `body`, reduced-motion.
- `components/Header.tsx` — light → dark glass, scroll-aware.
- `app/layout.tsx` — mount `PageBackground` once.
- `app/page.tsx` — recolor Services + Locations; add Repair Tracker + Reviews.
- `app/services/page.tsx` — recolor light section(s).
- `app/contact/page.tsx` — recolor light section(s).
- `app/accessories/page.tsx` — recolor light section(s).
- `app/book-appointment/page.tsx` — recolor light sections/cards/inputs.
- `app/repair-status/page.tsx` — read `?ref=` to prefill + auto-search.
- `.context/TRACKER.md` — log backend-later follow-ups.

---

## Task 1: Design-system foundation in `globals.css`

**Files:** Modify `app/globals.css:4-24` (`:root`) and `:45-54` (`body`), append utilities.

- [ ] **Step 1: Add dark tokens to `:root`.** After line 20 (`--border: ...`), add:

```css
  /* ── Dark design system (redesign) ── */
  --surface-glass: rgba(255, 255, 255, 0.05);
  --surface-glass-hover: rgba(255, 255, 255, 0.08);
  --border-glass: rgba(255, 255, 255, 0.10);
  --border-glass-accent: rgba(79, 110, 247, 0.40);
  --text-on-dark: #E2E8F0;
  --text-on-dark-muted: #94A3B8;
  --glow-indigo: rgba(79, 110, 247, 0.35);
```

- [ ] **Step 2: Flip `body` to dark.** Replace the `body { background-color: #ffffff; color: var(--text-primary); ... }` block so background is `var(--navy-dark)` and color is `var(--text-on-dark)`:

```css
  body {
    background-color: var(--navy-dark);
    color: var(--text-on-dark);
    font-family: var(--font-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    overflow-x: hidden;
  }
```

- [ ] **Step 3: Append glass/tile utilities** inside `@layer components` (after `.btn-ghost:hover`):

```css
  .glass {
    background: var(--surface-glass);
    border: 1px solid var(--border-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 1rem;
  }

  .glass-hover {
    transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
  }
  .glass-hover:hover {
    background: var(--surface-glass-hover);
    border-color: var(--border-glass-accent);
  }

  .tile {
    background: var(--surface-glass);
    border: 1px solid var(--border-glass);
    border-radius: 1rem;
  }

  .text-glow {
    text-shadow: 0 0 10px var(--glow-indigo);
  }
```

- [ ] **Step 4: Add reduced-motion + float keyframes** at the end of the file:

```css
@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
}
.animate-float { animation: floatY 8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .animate-float { animation: none; }
  * { scroll-behavior: auto !important; }
}
```

- [ ] **Step 5: Verify.** Run `npm run build` → Expected: compiles. Run `npm run dev`, open `/` → Expected: page base is now dark navy (light sections will look wrong until later tasks — that's OK).

- [ ] **Step 6: Commit.**

```bash
git add app/globals.css
git commit -m "feat(ui): add dark design tokens, glass/tile utilities, dark body"
```

---

## Task 2: Shared motion helpers `lib/motion.ts`

**Files:** Create `lib/motion.ts`. Modify `app/page.tsx`, `app/services/page.tsx`, `app/contact/page.tsx`, `app/repair-status/page.tsx`, `app/book-appointment/page.tsx` to import from it (remove local copies).

- [ ] **Step 1: Create `lib/motion.ts`:**

```ts
export const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease },
});

export const fadeUpView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease },
});
```

- [ ] **Step 2: In each of the 5 pages**, delete the local `const ease = …`, `const fadeUp = …`, `const fadeUpView = …` block and add near the top imports:

```ts
import { fadeUp, fadeUpView } from "@/lib/motion";
```

(If a page uses only `fadeUpView`, import only that. `repair-status` defines `ease` but not the fade helpers — for it, add `import { ease } from "@/lib/motion";` and delete its local `const ease`.)

- [ ] **Step 3: Verify.** `npm run build` → Expected: compiles, no "unused var" or "not defined" errors. `npm run lint` → Expected: clean.

- [ ] **Step 4: Commit.**

```bash
git add lib/motion.ts app/page.tsx app/services/page.tsx app/contact/page.tsx app/repair-status/page.tsx app/book-appointment/page.tsx
git commit -m "refactor(ui): extract shared motion helpers to lib/motion"
```

---

## Task 3: `PageBackground` component + mount in layout

**Files:** Create `components/PageBackground.tsx`. Modify `app/layout.tsx`.

- [ ] **Step 1: Create `components/PageBackground.tsx`** (extracts the hero's dark gradient + grid + glow orbs into one fixed layer behind everything; leaves a clearly-marked slot for the deferred 3D shapes):

```tsx
export default function PageBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #080B1A 0%, #0F1535 55%, #080B1A 100%)" }}
      />
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow orbs */}
      <div
        className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #4F6EF7, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }}
      />
      {/*
        DEFERRED (V1-b): floating 3D shape PNGs go here once assets are supplied.
        Render each as <img className="absolute animate-float" .../> positioned
        absolutely; keep pointer-events-none. No layout rework needed to add them.
      */}
    </div>
  );
}
```

- [ ] **Step 2: Mount it once** in `app/layout.tsx`. Import at top: `import PageBackground from "@/components/PageBackground";`. Inside `<body …>`, add `<PageBackground />` as the first child, before `<Header />`.

- [ ] **Step 3: Verify.** `npm run build` → compiles. `npm run dev`, open `/` → a subtle dark gradient + grid + glow is visible behind content on every page.

- [ ] **Step 4: Commit.**

```bash
git add components/PageBackground.tsx app/layout.tsx
git commit -m "feat(ui): add shared PageBackground layer (3D-shape slot deferred)"
```

---

## Task 4: Shared UI primitives

**Files:** Create `components/SectionHeading.tsx`, `components/GlassCard.tsx`, `components/ServiceTile.tsx`, `components/FeatureTile.tsx`.

- [ ] **Step 1: `components/SectionHeading.tsx`:**

```tsx
import { fadeUpView } from "@/lib/motion";
import { motion } from "motion/react";

export default function SectionHeading({
  eyebrow, title, subtitle, className = "",
}: { eyebrow: string; title: string; subtitle?: string; className?: string }) {
  return (
    <motion.div {...fadeUpView()} className={`flex flex-col items-center text-center ${className}`}>
      <span className="inline-block text-sm mb-3 uppercase tracking-widest" style={{ color: "#8B9EFF", fontWeight: 600 }}>
        {eyebrow}
      </span>
      <h2 className="text-white mb-3" style={{ fontWeight: 700 }}>{title}</h2>
      {subtitle && <p className="text-slate-400 max-w-md">{subtitle}</p>}
    </motion.div>
  );
}
```

- [ ] **Step 2: `components/GlassCard.tsx`:**

```tsx
export default function GlassCard({
  children, className = "", hover = true,
}: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return <div className={`glass ${hover ? "glass-hover" : ""} ${className}`}>{children}</div>;
}
```

- [ ] **Step 3: `components/ServiceTile.tsx`:**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ServiceTile({
  Icon, title, desc, href, color, label,
}: {
  Icon: React.ElementType; title: string; desc: string;
  href: string; color: string; label: string;
}) {
  return (
    <Link href={href} className="flex flex-col h-full w-full group">
      <div className="glass glass-hover flex flex-col flex-1 p-8 cursor-pointer">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110 shrink-0"
          style={{ background: "rgba(79,110,247,0.15)" }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
        <h3 className="text-white mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-8">{desc}</p>
        <span className="inline-flex items-center gap-2 text-sm transition-all group-hover:gap-3" style={{ color, fontWeight: 600 }}>
          {label} <ArrowRight className="w-4 h-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: `components/FeatureTile.tsx`:**

```tsx
export default function FeatureTile({
  Icon, title, desc,
}: { Icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="glass glass-hover flex flex-col flex-1 p-10 group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-8 transition-colors duration-300 shrink-0"
        style={{ background: "rgba(79,110,247,0.15)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "#8B9EFF" }} />
      </div>
      <h4 className="text-white mb-4" style={{ fontWeight: 600, fontSize: "1rem" }}>{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify.** `npm run build` → Expected: compiles (components are unused until Task 6+ — that's fine; Next won't error on unused exports).

- [ ] **Step 6: Commit.**

```bash
git add components/SectionHeading.tsx components/GlassCard.tsx components/ServiceTile.tsx components/FeatureTile.tsx
git commit -m "feat(ui): add SectionHeading, GlassCard, ServiceTile, FeatureTile primitives"
```

---

## Task 5: Convert `Header` to dark glass

**Files:** Modify `components/Header.tsx`.

- [ ] **Step 1: Make the header scroll-aware and dark.** Add scroll state at the top of the component body (after `const pathname = …`):

```tsx
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
```

Add `useEffect` to the React import: `import { useState, useEffect } from "react";`

- [ ] **Step 2: Replace the `<header …>` opening tag** (currently `bg-white border-b border-gray-200`) with a dark glass, scroll-reactive version:

```tsx
      <header
        className="fixed w-full top-0 z-50 transition-colors duration-300"
        style={{
          background: scrolled ? "rgba(8,11,26,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        }}
      >
```

- [ ] **Step 3: Fix nav link colors** (this closes bug #1 "invisible nav on scroll"). Change desktop links from `text-black hover:text-indigo-600` to:

```tsx
                  className="text-slate-200 hover:text-white transition-colors font-medium text-sm"
```

Change the mobile toggle button from `text-black` to `text-slate-200`. Change the mobile menu panel `bg-white border-t border-gray-200` to `style={{ background: "rgba(8,11,26,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}` and its links from `text-black hover:text-indigo-600` to `text-slate-200 hover:text-white`.

- [ ] **Step 4: Switch the Logo to the light variant.** In the header's `<Link href="/">`, render `<Logo variant="light" />` (the dark text is invisible on the dark header).

- [ ] **Step 5: Verify.** `npm run dev`, open `/`. Expected: transparent header over hero at top; on scroll it becomes a blurred dark bar; nav text readable in both states. Test at 375px (mobile menu opens dark, links readable). `npm run build` + `npm run lint` clean.

- [ ] **Step 6: Commit.**

```bash
git add components/Header.tsx
git commit -m "feat(ui): dark glass scroll-aware header, fix invisible nav on scroll"
```

---

## Task 6: Homepage — recolor Services + Locations sections

**Files:** Modify `app/page.tsx`.

- [ ] **Step 1: Remove the hero's bottom wave** (`app/page.tsx:176-186`, the `<div className="absolute bottom-0 …"><svg …fill="#F7F8FF"/></div>`) — there's no light section beneath it now. Also delete the hero's own `background` gradient + grid + glow-orb decorations (lines ~47-65) since `PageBackground` now provides them; keep the hero `<section>` but change its style to `style={{ minHeight: "92vh" }}` and `className="relative overflow-hidden flex flex-col justify-center"`.

- [ ] **Step 2: Recolor the SERVICES section** (`app/page.tsx:189-286`). On the `<section>`, remove `style={{ background: "#F7F8FF" }}` → `className="py-14 md:py-20 relative"`. Replace the section-header markup with `<SectionHeading eyebrow="What We Offer" title="Our Main Services" subtitle="From cracked screens to slow laptops — we handle it all at an affordable price." className="mb-5" />`. Replace each mapped card body with `<ServiceTile Icon={item.Icon} title={item.title} desc={item.desc} href={item.href} color={item.color} label={item.label} />` (drop the now-unused `bg` field from each item object). Add imports: `import SectionHeading from "@/components/SectionHeading";` and `import ServiceTile from "@/components/ServiceTile";`.

- [ ] **Step 2b: Recolor the WHY-AZEROTECH section** (`app/page.tsx:288-335`) to use the shared primitives for consistency: replace its inline header with `<SectionHeading eyebrow="Why AzeroTech" title="Repairs You Can Trust" className="mb-20" />` and each feature card body with `<FeatureTile Icon={item.Icon} title={item.title} desc={item.desc} />` (keep the outer `motion.div` + `basis-*` flex classes for layout/stagger). Import `FeatureTile`. (Its background is already `#080B1A` — remove that inline bg so it's transparent over `PageBackground`.)

- [ ] **Step 3: Recolor the LOCATIONS section** (`app/page.tsx:337-454`). Remove `style={{ background: "#F7F8FF" }}` from the `<section>`. For the eyebrow/title use `<SectionHeading eyebrow="Find Us" title="Visit Our Shop" className="mb-10" />`. Convert the two location cards and the map container from `bg-white … border-slate-100 … boxShadow` to `className="glass …"` (drop inline white bg/border/shadow). Change card headings `text-[#0F172A]` → `text-white`; body `text-slate-500` → `text-slate-400`. Icon chips `bg-[#EEF1FF]` → `style={{ background: "rgba(79,110,247,0.15)" }}`; the neutral `bg-slate-100` chip → `style={{ background: "rgba(255,255,255,0.08)" }}`. Badges per the mapping table. Keep the `<iframe>` map exactly as-is.

- [ ] **Step 4: Recolor the CTA section** (`app/page.tsx:456-483`): remove its inline gradient `background` so it sits transparent over `PageBackground` (keep padding + content).

- [ ] **Step 5: Color-audit grep.** Run:

```bash
grep -nE "#F7F8FF|bg-white|text-\[#0F172A\]|border-slate-100|#DCFCE7|#F1F5F9" app/page.tsx
```

Expected: **no matches** (all converted).

- [ ] **Step 6: Verify.** `npm run dev`, open `/`. Expected: entire homepage is dark glass end-to-end, cards have frosted look, text readable, map + all links work. `npm run build` + `npm run lint` clean.

- [ ] **Step 7: Commit.**

```bash
git add app/page.tsx
git commit -m "feat(ui): convert homepage sections to dark glass"
```

---

## Task 7: Homepage — Repair Tracker CTA section

**Files:** Create `components/RepairTrackerCTA.tsx`. Modify `app/page.tsx` (insert section), `app/repair-status/page.tsx` (read `?ref=`).

- [ ] **Step 1: Create `components/RepairTrackerCTA.tsx`:**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { fadeUpView } from "@/lib/motion";

export default function RepairTrackerCTA() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    router.push(v ? `/repair-status?ref=${encodeURIComponent(v)}` : "/repair-status");
  };

  return (
    <section className="py-16 md:py-24 relative">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12">
        <motion.div {...fadeUpView()} className="glass p-8 md:p-12 flex flex-col items-center text-center">
          <h2 className="text-white mb-3" style={{ fontWeight: 700 }}>Track Your Repair</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Enter your repair order number or phone number to see your live repair status.
          </p>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
            <div className="flex items-center gap-3 flex-1 rounded-xl px-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Search className="w-5 h-5 shrink-0" style={{ color: "#8B9EFF" }} />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter Repair Order Number"
                aria-label="Repair order number or phone number"
                className="flex-1 bg-transparent py-4 text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            <button type="submit"
              className="inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", fontWeight: 600, boxShadow: "0 8px 32px rgba(79,110,247,0.35)" }}>
              Check Status
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert the section** in `app/page.tsx` between the Why-Azerotech section and the Locations section. Import `import RepairTrackerCTA from "@/components/RepairTrackerCTA";` and render `<RepairTrackerCTA />`.

- [ ] **Step 3: Make `/repair-status` read `?ref=`.** In `app/repair-status/page.tsx`, import `useEffect` and `useSearchParams` (`import { useEffect } from "react";` / `import { useSearchParams } from "next/navigation";`). Inside `RepairStatusPage`, after the existing `useState` declarations, add an effect that prefills and auto-searches:

```tsx
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setQuery(ref);
      // trigger the same search the form uses
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

Note: `handleSearch` reads `query.trim()` from state. Since `setQuery(ref)` is async, change the first lines of `handleSearch` to accept the ref directly — update its signature to `const handleSearch = async (e: React.FormEvent, override?: string) => {` and `const trimmed = (override ?? query).trim();`, then call `handleSearch(fakeEvent, ref)` in the effect. This avoids the stale-state race.

- [ ] **Step 4: Wrap for Suspense.** `useSearchParams` requires a Suspense boundary in Next. If `npm run build` complains, wrap the page's returned JSX in `<Suspense fallback={null}>…</Suspense>` (`import { Suspense } from "react"`) by splitting the component: rename the current component to `RepairStatusInner` and export a `RepairStatusPage` that renders `<Suspense fallback={null}><RepairStatusInner /></Suspense>`.

- [ ] **Step 5: Verify.** `npm run build` → Expected: compiles (no "useSearchParams needs Suspense" error). `npm run dev`: on `/`, type `AZT-...` and submit → routes to `/repair-status?ref=AZT-...`, which auto-fills and runs the lookup. Empty submit → routes to `/repair-status` with no error.

- [ ] **Step 6: Commit.**

```bash
git add components/RepairTrackerCTA.tsx app/page.tsx app/repair-status/page.tsx
git commit -m "feat(ui): homepage repair tracker CTA + prefill repair-status via ?ref="
```

---

## Task 8: Homepage — Customer Reviews section (static)

**Files:** Create `components/ReviewCard.tsx`. Modify `app/page.tsx`.

- [ ] **Step 1: Create `components/ReviewCard.tsx`:**

```tsx
import { Star } from "lucide-react";

export default function ReviewCard({
  quote, name, meta, rating = 5,
}: { quote: string; name: string; meta: string; rating?: number }) {
  return (
    <div className="glass flex flex-col flex-1 p-8">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4" style={{ color: "#FBBF24", fill: "#FBBF24" }} />
        ))}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="text-white text-sm" style={{ fontWeight: 600 }}>{name}</p>
        <p className="text-slate-500 text-xs">{meta}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the Reviews section** in `app/page.tsx`, after the Locations section and before the CTA. Import `SectionHeading` (already imported in Task 6) and `ReviewCard`. Insert:

```tsx
      {/* ─── CUSTOMER REVIEWS ─── */}
      <section className="py-16 md:py-24 relative">
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          <SectionHeading eyebrow="Customer Reviews" title="What Our Customers Say" className="mb-12" />
          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {[
              { quote: "Best service ever! Fixed my cracked screen in under an hour and the price was fair.", name: "Sarah K.", meta: "Phone screen repair" },
              { quote: "Reformatted my old laptop and it runs like new. Highly recommend AzeroTech.", name: "Mark D.", meta: "Laptop reformat" },
              { quote: "Great selection of accessories and super knowledgeable, friendly staff.", name: "Jenny T.", meta: "Accessories" },
            ].map((r, i) => (
              <motion.div key={r.name} {...fadeUpView(i * 0.08)} className="flex">
                <ReviewCard quote={r.quote} name={r.name} meta={r.meta} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
```

Add `import ReviewCard from "@/components/ReviewCard";`.

- [ ] **Step 3: Verify.** `npm run dev`, open `/` → three frosted review cards render between Locations and CTA, stars gold, text readable, responsive stack at 375px. `npm run build` + `npm run lint` clean.

- [ ] **Step 4: Commit.**

```bash
git add components/ReviewCard.tsx app/page.tsx
git commit -m "feat(ui): add static customer reviews section to homepage"
```

---

## Task 9: Convert Services page to dark glass

**Files:** Modify `app/services/page.tsx` (light section at `:264`).

- [ ] **Step 1: Recolor.** Apply the mapping table to `app/services/page.tsx`: remove `style={{ background: "#F7F8FF" }}` from the section at line 264; convert its `bg-white` cards → `glass glass-hover`; headings `text-[#0F172A]`/`text-slate-900` → `text-white`; body `text-slate-500` → `text-slate-400`; icon chips (`accentBg` values like `#EEF1FF`) → `rgba(79,110,247,0.15)` while keeping `accentColor`. Where a section header repeats the eyebrow/title/subtitle pattern, swap in `<SectionHeading … />` (import it). Delete any wave-divider `<svg fill="#F7F8FF"/>` blocks.

- [ ] **Step 2: Color-audit grep:**

```bash
grep -nE "#F7F8FF|bg-white|text-\[#0F172A\]|border-slate-100" app/services/page.tsx
```

Expected: no matches.

- [ ] **Step 3: Verify.** `npm run dev`, open `/services` → fully dark, service cards frosted, prices/times readable, "Book …" CTAs work. `npm run build` + `npm run lint` clean.

- [ ] **Step 4: Commit.**

```bash
git add app/services/page.tsx
git commit -m "feat(ui): convert services page to dark glass"
```

---

## Task 10: Convert Contact page to dark glass

**Files:** Modify `app/contact/page.tsx` (light section at `:193`).

- [ ] **Step 1: Recolor** per the mapping table (section bg, cards → glass, headings → white, body → slate-400, icon chips → indigo glass). The store-hours list and contact-method cards become `glass`. Keep the embedded map `<iframe>` unchanged. The "Send a Message" form inputs: give each input `style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}` and `placeholder:text-slate-500`; keep the form's existing submit behavior (mailto/Messenger — do not add a backend).

- [ ] **Step 2: Color-audit grep:**

```bash
grep -nE "#F7F8FF|bg-white|text-\[#0F172A\]|border-slate-100" app/contact/page.tsx
```

Expected: no matches.

- [ ] **Step 3: Verify.** `npm run dev`, open `/contact` → dark, form legible, inputs have visible focus, map + links work. Confirm form submit still does what it did before (no new network call). `npm run build` + `npm run lint` clean.

- [ ] **Step 4: Commit.**

```bash
git add app/contact/page.tsx
git commit -m "feat(ui): convert contact page to dark glass"
```

---

## Task 11: Convert Accessories page to dark glass

**Files:** Modify `app/accessories/page.tsx` (light section at `:297`).

- [ ] **Step 1: Recolor** per the mapping table. Product cards → `glass glass-hover`; category filter chips: active keeps the indigo gradient, inactive → `style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.12)" }}`. **Preserve** the out-of-stock greyscale/overlay treatment, the skeleton loaders, the reservation modal, and all `/api/products` + `/api/reservations` logic exactly. Headings → white, body → slate-400.

- [ ] **Step 2: Color-audit grep:**

```bash
grep -nE "#F7F8FF|bg-white|text-\[#0F172A\]|border-slate-100" app/accessories/page.tsx
```

Expected: no matches (except inside intentionally-preserved out-of-stock overlay if it needs white — verify each remaining hit is deliberate).

- [ ] **Step 3: Verify.** `npm run dev`, open `/accessories` → dark grid, skeletons dark, filter works, reserve modal opens and submits, out-of-stock items still greyed. `npm run build` + `npm run lint` clean.

- [ ] **Step 4: Commit.**

```bash
git add app/accessories/page.tsx
git commit -m "feat(ui): convert accessories page to dark glass"
```

---

## Task 12: Convert Book Appointment page to dark glass

**Files:** Modify `app/book-appointment/page.tsx` (light bits at `:330`, `:446`, `:550`, `:656`).

- [ ] **Step 1: Recolor** per the mapping table. This page has form inputs, a step summary card (`:330`), a light section (`:446`), a table-ish row (`:550`), and selectable slot chips (`:656`). Convert: containers/cards → `glass`; inputs → `style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}`; the unselected slot chip style `{ background: "#F7F8FF", color: "#475569", borderColor: "#E2E8F0" }` → `{ background: "rgba(255,255,255,0.06)", color: "#CBD5E1", borderColor: "rgba(255,255,255,0.12)" }` (keep the **selected** state gradient as-is); dividers `borderBottom: "1px solid #E2E8F0"` → `1px solid rgba(255,255,255,0.08)`. **Preserve** all 4 steps, validation, booked-slot fetching (`/api/appointments/booked-slots`), and submit logic (`/api/appointments`) exactly.

- [ ] **Step 2: Color-audit grep:**

```bash
grep -nE "#F7F8FF|bg-white|text-\[#0F172A\]|#E2E8F0\"|border-slate-100" app/book-appointment/page.tsx
```

Expected: remaining hits only where intentional; convert all light surfaces.

- [ ] **Step 3: Verify.** `npm run dev`, open `/book-appointment` → dark multi-step form; step through all 4 steps; disabled booked slots still disabled; date picker limited to 1–60 days; submit creates an appointment and shows the confirmation with `AZT-…` id. Contrast on inputs OK. `npm run build` + `npm run lint` clean.

- [ ] **Step 4: Commit.**

```bash
git add app/book-appointment/page.tsx
git commit -m "feat(ui): convert book-appointment page to dark glass"
```

---

## Task 13: Repair Status page polish + final sweep

**Files:** Modify `app/repair-status/page.tsx` (only if any light surfaces remain). Modify `.context/TRACKER.md`.

- [ ] **Step 1: Audit repair-status** (already mostly dark). Run:

```bash
grep -nE "#F7F8FF|bg-white|text-\[#0F172A\]|border-slate-100" app/repair-status/page.tsx
```

Convert any hits per the mapping table; wrap result cards in `glass`. Keep the `StageTracker` (already dark) unchanged.

- [ ] **Step 2: Whole-app light-surface sweep.** Run:

```bash
grep -rnE "#F7F8FF|bg-white|text-\[#0F172A\]" app --include=*.tsx | grep -v "app/admin/"
```

Expected: **no matches outside `app/admin/`** (admin is intentionally out of scope). Fix any stragglers.

- [ ] **Step 3: Log backend-later follow-ups** — append to `.context/TRACKER.md` under "Upcoming Features":

```markdown
| 15 | Customer reviews backend | Redesign | Homepage reviews are static (hardcoded in ReviewCard usage). Wire to a real reviews source/API. | Low |
| 16 | Contact message form backend | Redesign | Contact "Send a Message" form is static (mailto/Messenger). Add a real submit endpoint. | Medium |
| 17 | Service prices data source | Redesign | Services page prices/times are hardcoded. Move to DB/config if they change often. | Low |
```

- [ ] **Step 4: Verify (full-site pass).** `npm run build` + `npm run lint` → clean. `npm run dev`: click through **every** public page (`/`, `/services`, `/book-appointment`, `/accessories`, `/contact`, `/repair-status`) at 375px and 1440px. Confirm: consistent dark glass, readable text everywhere (no dark-on-dark), header readable at all scroll positions, all forms/links/maps/API calls work, no console errors. Toggle OS "reduce motion" → float/scroll animations calm down.

- [ ] **Step 5: Commit.**

```bash
git add app/repair-status/page.tsx .context/TRACKER.md
git commit -m "feat(ui): polish repair-status, final dark sweep, log backend follow-ups"
```

---

## Self-review (completed by plan author)

**Spec coverage:**
- §4.1 dark tokens/utilities → Task 1. ✓
- §4.2 primitives (`PageBackground`, `GlassCard`, `ServiceTile`/`FeatureTile`, `SectionHeading`, Header, Footer) → Tasks 3, 4, 5 (Footer already dark — no task needed, noted in §3b). ✓
- §4.3 Home (V1 hero kept, Services/Why/Locations recolor, Repair Tracker, Reviews) → Tasks 6, 7, 8. ✓
- §4.3 Services / Contact → Tasks 9, 10. ✓
- §4.3 Book Appointment / Accessories / Repair Status re-skin → Tasks 11, 12, 13. ✓
- §6 no-backend content static + follow-ups → Tasks 7/8/10 (static) + Task 13 (TRACKER log). ✓
- §7 3D shapes deferred, non-blocking → Task 3 slot + comment. ✓
- §3b DRY the duplicated helpers → Task 2. ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases". Recolor tasks use an explicit old→new mapping table + exact file/line anchors rather than vague "style it". ✓

**Type consistency:** Component prop names (`Icon`, `title`, `desc`, `href`, `color`, `label`, `quote`, `name`, `meta`, `rating`) are consistent between definition (Task 4/8) and usage (Task 6/8). `fadeUp`/`fadeUpView`/`ease` signatures match across Task 2 and consumers. `handleSearch(e, override?)` signature change (Task 7) is self-consistent. ✓

**Note for executor:** Line numbers reference the file state at plan-writing time; re-anchor by content if edits shift them.
