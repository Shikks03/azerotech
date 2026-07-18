# Torus Side Outlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four subtle structural line loops to every transparent torus so its inner and outer walls remain readable.

**Architecture:** Keep the feature inside the isolated `bg-lab/shapes.js` scene. A shared ring-dimensions object will feed both the rounded-ring face geometry and a new outline-group builder; each ring mesh will own its outline group so existing transforms automatically apply to both.

**Tech Stack:** JavaScript ES modules, Three.js 0.165.0, Node.js built-in test runner

## Global Constraints

- Add exactly four loops: front and rear boundaries of both inner and outer walls.
- Use soft blue-white lines at `opacity: 0.4` with additive blending.
- Set `depthTest: false` and `depthWrite: false` on the outline material.
- Preserve face opacity, animation, sizing, orientation, and placement.
- Do not turn the torus into a full wireframe.

---

### Task 1: Add Structural Torus Side Outlines

**Files:**
- Modify: `bg-lab/shapes.test.mjs`
- Modify: `bg-lab/shapes.js:394-535`
- Modify: `bg-lab/README.md:51-54`

**Interfaces:**
- Consumes: the rounded ring's `ringRadius`, `halfWidth`, `halfDepth`, and `tubularSegments` dimensions.
- Produces: `buildRingOutlineGroup(options?): THREE.Group`, containing four `THREE.LineLoop` children.

- [ ] **Step 1: Write the failing regression assertions**

Append these assertions before the final `console.log` in `bg-lab/shapes.test.mjs`:

```js
assert.match(
  source,
  /function buildRingOutlineGroup\([\s\S]*?new THREE\.LineLoop\(/,
  "torus outlines should be built from line loops",
);
assert.match(
  source,
  /const radii = \[ringRadius - halfWidth, ringRadius \+ halfWidth\];[\s\S]*?const depths = \[-halfDepth, halfDepth\];/,
  "torus outlines should cover inner and outer front and rear boundaries",
);
assert.match(
  source,
  /if \(cfg\.type === "ring" \|\| cfg\.type === "torus"\) \{[\s\S]*?mesh\.add\(buildRingOutlineGroup\(\)\);/,
  "ring and torus meshes should own their outline group",
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test bg-lab/shapes.test.mjs`

Expected: FAIL at `torus outlines should be built from line loops` because `buildRingOutlineGroup` does not exist.

- [ ] **Step 3: Share ring dimensions and build the four outline loops**

Add this object immediately above `buildRoundedRingGeometry` and use its values as that function's defaults:

```js
const RING_DIMENSIONS = Object.freeze({
  ringRadius: 0.84,
  halfWidth: 0.16,
  halfDepth: 0.11,
  tubularSegments: 168,
});
```

Add this function after `buildRoundedRingGeometry`:

```js
function buildRingOutlineGroup({
  ringRadius = RING_DIMENSIONS.ringRadius,
  halfWidth = RING_DIMENSIONS.halfWidth,
  halfDepth = RING_DIMENSIONS.halfDepth,
  tubularSegments = RING_DIMENSIONS.tubularSegments,
} = {}) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0xcdd8ff,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const radii = [ringRadius - halfWidth, ringRadius + halfWidth];
  const depths = [-halfDepth, halfDepth];

  for (const radius of radii) {
    for (const z of depths) {
      const points = [];
      for (let i = 0; i < tubularSegments; i++) {
        const angle = (i / tubularSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z,
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const outline = new THREE.LineLoop(geometry, material);
      outline.renderOrder = 2;
      group.add(outline);
    }
  }

  return group;
}
```

In the non-cube mesh branch, after the tetrahedron overlay block, attach the outline group:

```js
if (cfg.type === "ring" || cfg.type === "torus") {
  mesh.add(buildRingOutlineGroup());
}
```

- [ ] **Step 4: Document the line treatment**

Extend the tori status entry in `bg-lab/README.md` with: `Four blue-white line loops define the front and rear boundaries of the inner and outer walls without forming a full wireframe.`

- [ ] **Step 5: Run focused and syntax verification**

Run: `node --test bg-lab/shapes.test.mjs`

Expected: PASS, 1 test and 0 failures.

Run: `node --check bg-lab/shapes.js`

Expected: exit code 0 with no output.

- [ ] **Step 6: Inspect the scoped diff and commit**

Run: `git diff -- bg-lab/shapes.js bg-lab/shapes.test.mjs bg-lab/README.md`

Confirm that only ring dimensions, outline construction/attachment, tests, and documentation changed.

```bash
git add bg-lab/shapes.js bg-lab/shapes.test.mjs bg-lab/README.md
git commit -m "feat: add torus side outlines"
```
