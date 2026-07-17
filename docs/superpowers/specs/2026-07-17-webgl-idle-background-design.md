# WebGL Idle Background — Design Spec

**Date:** 2026-07-17
**Status:** Approved (design), pending implementation plan
**Branch:** `feat/webgl-idle-background`

## Goal

Ship the floating 3D-glass idle background (prototyped in `bg-lab/`) as the
site-wide background for all public pages of the Next.js app, **without** degrading
performance on weak devices. The full glassy look renders live (WebGL) on capable
devices; weaker devices get a scaled-down scene; the weakest devices (and no-WebGL /
reduced-motion) get a static PNG of the same scene.

## Non-goals

- No 3D background on `/admin` (matches existing Header/Footer hide behavior).
- No interactivity (parallax, pointer response) — this is an idle background only.
- No pre-rendered video or layered-PNG animation path. A **single static PNG** is the
  only baked asset, used purely as the degradation floor.
- No changes to page content, layout, or existing components beyond swapping the
  background mount point in `app/layout.tsx`.

## Decisions locked

| Decision | Choice |
|---|---|
| Scope | All public pages, site-wide (hidden on `/admin`) |
| Weak-device strategy | WebGL for all *capable* devices, quality tiers scale down |
| Degradation floor | Static PNG of the baked scene (not CSS-only) |
| Transmission on low tier | **Off** (approximated with opacity + emissive + env reflections) |
| CSS gradient | Kept as layer 0, behind the PNG, to cover letterbox edges |
| Architecture | Single persistent canvas in root layout + capability detection + runtime FPS watchdog |

## Source material

- `bg-lab/index.html` + `bg-lab/shapes.js` — standalone Three.js scene (r0.165 via CDN
  import map). 8 objects: 3 cubes (wireframe tesseracts), 2 tetrahedrons, 3 tori.
  `MeshPhysicalMaterial` with `transmission: 1.0`, iridescence, clearcoat; `RoomEnvironment`
  PMREM env map; ACESFilmic tone mapping; `CanvasTexture` scene background (navy + radial
  glow + faint perspective grid). Already respects `prefers-reduced-motion`, pauses on
  `visibilitychange`, caps DPR at 2. Positions are **viewport-fraction anchors**; size is a
  fraction of viewport width — fully responsive, no geometry rebuild on resize.
- `components/PageBackground.tsx` — current live background: pure CSS (navy gradient + grid +
  glow orbs). To be superseded by `SceneBackground` (its gradient becomes layer 0).

## Architecture

### Layer model (a single `SceneBackground` client component)

Three fixed, full-viewport, `pointer-events-none` layers, back to front:

| Layer | Content | Runtime cost | Always present |
|---|---|---|---|
| 0 | CSS navy gradient (from today's `PageBackground`) | ~0 | Yes — covers PNG letterbox edges |
| 1 | Static PNG of the scene, `object-fit: cover` | ~0 | Yes — instant paint + permanent fallback |
| 2 | WebGL `<canvas>` (live scene) | tiered | Only on capable devices; fades in over PNG |

- The PNG paints instantly (SSR-safe, zero JS) and is the permanent fallback.
- The canvas is dynamically imported (`ssr: false`), so Three.js is code-split out of the
  initial bundle. It **fades in over ~500ms once its first frame has rendered** — no blank
  flash, no pop.
- If WebGL is unavailable or the watchdog gives up, the canvas never shows (or fades back
  out) and the PNG remains. The layering *is* the graceful degradation.

### Mounting & lifecycle

- Mounts **once in `app/layout.tsx`**, replacing `<PageBackground/>`. App Router keeps the
  layout mounted across route changes, so the WebGL context and the (expensive) PMREM env-map
  are built **once** and survive navigation — no per-page rebuild hitch.
- **Hidden on `/admin`** via `usePathname()`, matching the existing Header/Footer pattern.
- Full teardown on unmount: dispose geometries/materials/env-texture, `renderer.dispose()`,
  release the context. Handle `webglcontextlost` by falling back to the PNG.

### Quality tiers

| Tier | DPR cap | Transmission | Internal res | AA | FPS cap | Target |
|---|---|---|---|---|---|---|
| high | 2 | on | 1.0× | on | 60 | Desktop / strong GPU |
| medium | 1.5 | on | 0.85× | on | 60 | Decent mobile / integrated |
| low | 1 | **off** (opacity + emissive + env reflections) | 0.7× | off | 30 | Weak mobile |
| off | — | — | — | — | — | PNG only (no-WebGL / reduced-motion / watchdog gave up) |

Turning `transmission` off on the low tier removes the per-frame extra scene render pass —
the single biggest cost — while the shapes still read as glassy via reflections + a faint
emissive glow. Internal-resolution scaling renders to a smaller buffer and upscales; nearly
invisible on a blurred background, meaningful fill-rate savings.

### Starting-tier detection

Pick the initial tier from, in priority order:

1. No WebGL context obtainable → `off`.
2. `prefers-reduced-motion: reduce` → `off` (static PNG).
3. `navigator.connection.saveData` truthy → `off`.
4. GPU renderer string via `WEBGL_debug_renderer_info` — software renderers (e.g. SwiftShader,
   llvmpipe) → `off`.
5. `pointer: coarse` + UA mobile hints, `navigator.deviceMemory` (< 4 GB), and
   `hardwareConcurrency` (< 4) → start at `low`; mid values → `medium`.
6. Otherwise → `high`.

QA override: `?bgtier=high|medium|low|off` query param forces the tier and bypasses detection.

### Runtime FPS watchdog (the smoothness guarantee)

- Skip the first ~0.5s (warm-up: shader compile, asset load) before sampling.
- Maintain a rolling ~90-frame window of frame times.
- If sustained frame time exceeds the tier budget (≈ < 45fps), **drop one tier** and reset the
  window.
- **Downgrade-only.** Debounced so a single transient hitch (GC, route load) does not trigger a
  drop. Never upgrades mid-session (avoids oscillation).
- Low tier still failing → **`off`**: fade the canvas out to the PNG, dispose WebGL. This makes
  "runs smoothly" a guarantee rather than a hope.

### Runtime safeguards (all active tiers)

- Pause `setAnimationLoop` on `visibilitychange` when the tab is hidden (already in the lab).
- DPR capped per tier.
- FPS cap on low tier via a time accumulator that skips render frames.
- Throttled resize (ResizeObserver or debounced `resize`) → recompute layout only (no geometry
  rebuild — positions are viewport fractions).

## Components / files

| Path | Purpose |
|---|---|
| `lib/background/sceneConfig.ts` | `SHAPES` config array + tier preset definitions, lifted from `bg-lab/shapes.js`. |
| `lib/background/scene.ts` | Ported TS scene. Exposes `createScene(canvas, tier) → { start, stop, setQuality, dispose }`. Lab-only code (HUD, guides, FPS label) dropped. |
| `components/SceneBackground.tsx` | Client component: 3-layer render, capability detection, dynamic import of `scene.ts` + Three, watchdog, canvas fade, `/admin` hide, cleanup. |
| `app/layout.tsx` | Swap `<PageBackground/>` → `<SceneBackground/>`. |
| `components/PageBackground.tsx` | Deleted. Its CSS gradient moves into `SceneBackground` as layer 0. |
| `public/background.png` | Baked static scene frame (~2560×1440). |
| `bg-lab/shapes.js` | Add a one-shot capture (keypress → `canvas.toBlob()` → download) to generate the PNG. Lab stays a dev-only sandbox. |

## Dependencies

- `npm install three @types/three`, pinned to **r0.165.x** — the version whose
  `RoomEnvironment` / PMREM API matches the lab's usage (`new RoomEnvironment()` +
  `pmremGenerator.fromScene(...)`). Three is bundled but code-split via the dynamic import, so
  it stays out of the initial/main bundle.

## PNG generation

Add a temporary capture handler to `bg-lab/shapes.js`: on a keypress, render one clean frame at
high resolution (~2560×1440) and `canvas.toBlob()` → download `background.png`. Save to
`public/background.png`. Because it is baked from the same scene, the fallback matches the live
render. One image + `object-fit: cover` covers all aspect ratios; the layer-0 CSS gradient hides
any letterboxing.

## Verification (no automated test suite in this repo)

Manual matrix:

- DevTools CPU + GPU throttling → confirm the watchdog downgrades and never stutters visibly.
- `prefers-reduced-motion` emulation → PNG only, no canvas.
- `?bgtier=high|medium|low|off` overrides → each tier renders and is stable.
- No-WebGL simulation (disable WebGL) → PNG only.
- Navigate between public routes → WebGL context/env-map NOT rebuilt (no hitch); background is
  continuous.
- Visit `/admin` → no canvas, no PNG (background hidden).
- `npm run build` → confirm Three.js is code-split (not in the main/initial chunk).

## Risks & open questions

- **Weakest devices still get *a* downgraded scene, not the full effect at 60fps.** This is by
  design and accepted: real-time `transmission` cannot be made cheap on very low-end phones. The
  `off` tier (PNG) is the floor for anything the low tier can't sustain.
- **Three r0.165 pin** — if a newer Three version is preferred, verify `RoomEnvironment`'s
  constructor signature (it changed across versions) before bumping.
- **PNG aspect coverage** — a single landscape PNG under `object-fit: cover` may crop edge shapes
  on extreme portrait viewports. Accepted for a static fallback; revisit with a portrait variant
  only if it looks wrong in QA.

## As-Built Amendments (2026-07-17)

Reality diverged from this spec during implementation. What actually shipped:

1. **The lab scene evolved mid-build.** The `bg-lab` scene grew from the snapshot this
   spec was written against (cube/tetrahedron/**torus**, static cubes, no rim lights) into a
   richer, modular, tested codebase: **rings** (custom rounded-rectangle surface-of-revolution
   geometry with outline groups) instead of tori, **slowly spinning cubes**, uniform blue tint,
   and **blue/purple rim lights + fill**. The shipped background matches this current lab.

2. **Shared source of truth, not a hand-port.** Instead of transcribing the scene into
   `lib/background/scene.ts`, the scene core was promoted into plain-ESM modules under
   **`lib/background/core/`** (`sceneCore.mjs` = `createScene()` factory, `shapes.mjs`,
   `ringSpecs.mjs`) imported by BOTH the lab and the app. Bare `three` / `three/addons/*`
   specifiers resolve in both (import map + bundler). The lab (`bg-lab/`) is now a thin
   consumer. Edits to the scene happen in the core; the app stays in sync automatically, so
   there is no "re-port at freeze" step.

3. **Crisp-first tiers.** The `internalResScale` downscale (0.85 / 0.7) read as blurry, so all
   tiers now render at **full internal resolution**. Efficiency comes from quality-neutral
   levers instead: a **30fps cap** (invisible for slow idle drift), **`powerPreference:
   'high-performance'`**, **MSAA auto-disabled when DPR ≥ 2**, and **ring segments 168→120**.
   The tier ladder differentiates on DPR cap (2 / 1.5 / 1) and, at the bottom rung only,
   **transmission off**. `internalResScale` remains as an emergency-only knob (default 1.0).

4. **Testing.** No app test runner was added (unchanged). The lab retains its own Node test
   (`bg-lab/shapes.test.mjs`), updated to assert against the shared core.

5. **Follow-up noted:** Three r0.167+ would add `transmissionResolutionScale` (render the
   frosted transmission pass at ~0.5×, near-invisible saving) — deferred, needs a version bump
   + `RoomEnvironment` compatibility check.
