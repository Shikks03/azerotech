// lib/background/scene.ts
// TypeScript port of bg-lab/shapes.js — Three.js idle background scene.
// Factory-scoped: no module-level singletons. Lifecycle managed via SceneHandle.

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { ActiveTier, ShapeConfig } from "./types";
import { SHAPES, TIER_PRESETS } from "./sceneConfig";

export interface SceneCallbacks {
  onFirstFrame?: () => void;
  onFrame?: (frameMs: number) => void;
}

export interface SceneHandle {
  start(): void;
  stop(): void;
  setQuality(tier: ActiveTier): void;
  dispose(): void;
}

// ─── Background texture builder ───────────────────────────────────────────────
// Copied verbatim from bg-lab/shapes.js buildBackgroundTexture (lines 188-259).
function buildBackgroundTexture(): THREE.CanvasTexture {
  const W = 1024, H = 683;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;

  // Base fill — very dark navy
  ctx.fillStyle = "#05070F";
  ctx.fillRect(0, 0, W, H);

  // Blue radial glow — centred lower-right, below the bottom edge
  const gx = W * 0.78, gy = H * 1.05, gr = W * 0.70;
  const radGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
  radGrad.addColorStop(0.0, "rgba(30, 46, 99, 0.72)");
  radGrad.addColorStop(0.5, "rgba(20, 32, 75, 0.35)");
  radGrad.addColorStop(1.0, "rgba(5,  7,  15, 0.0)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, W, H);

  // Very subtle diagonal light beam from top-right toward center (~3% opacity)
  const beamGrad = ctx.createLinearGradient(W, 0, W * 0.35, H * 0.55);
  beamGrad.addColorStop(0.0, "rgba(100, 130, 220, 0.04)");
  beamGrad.addColorStop(0.5, "rgba(100, 130, 220, 0.025)");
  beamGrad.addColorStop(1.0, "rgba(100, 130, 220, 0.0)");
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, W, H);

  // Faint perspective floor grid — lower-right quadrant only
  // Lines converge toward a vanishing point at ~(60%, 35%)
  const vpX = W * 0.60, vpY = H * 0.35;
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#4F6EF7";
  ctx.lineWidth = 0.6;

  // Fan of lines radiating from the vanishing point into the lower-right area
  const gridLines = 14;
  const angleStart = Math.PI * 0.02;  // just below horizontal-right
  const angleEnd   = Math.PI * 0.52;  // just past vertical-down
  for (let i = 0; i <= gridLines; i++) {
    const a = angleStart + (angleEnd - angleStart) * (i / gridLines);
    const ex = vpX + Math.cos(a) * W * 1.5;
    const ey = vpY + Math.sin(a) * H * 1.5;
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Horizontal cross-lines (perspective arcs approximated as straight lines)
  const crossLines = 8;
  for (let i = 1; i <= crossLines; i++) {
    const t = i / crossLines;
    // interpolate between the two bounding fan rays at this depth
    const aL = angleStart, aR = angleEnd;
    const dist = 80 + t * W * 0.9;
    const lx = vpX + Math.cos(aL) * dist, ly = vpY + Math.sin(aL) * dist;
    const rx = vpX + Math.cos(aR) * dist, ry = vpY + Math.sin(aR) * dist;
    // Only draw if at least one endpoint is in the lower-right region
    if (lx > W * 0.3 || rx > W * 0.3 || ly > H * 0.4 || ry > H * 0.4) {
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── Glass material factory ───────────────────────────────────────────────────
// Copied verbatim from bg-lab/shapes.js buildMaterial (lines 264-315).
// ring-specific NON_OCCLUDING_FACE_MATERIAL branch omitted: ShapeConfig has no
// "ring" type (only "cube" | "tetrahedron" | "torus"), so that branch is dead.
function buildMaterial(cfg: ShapeConfig, sizePx: number): THREE.MeshPhysicalMaterial {
  const params: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(cfg.tint),
    transmission: 1.0,
    roughness: 0.35,
    ior: 1.5,
    thickness: sizePx * 0.35,
    iridescence: 0.9,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: cfg.iridThickness,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    transparent: true,
    envMapIntensity: cfg.envIntensity,
    side: THREE.FrontSide,
  };

  // Cube, tetrahedron & torus — frosted transparent glass (glassmorphism).
  params.transmission = 1.0;
  params.roughness = 0.28;                 // frosted — softly blurs what's behind
  params.ior = 1.4;                        // gentle bend, keeps it see-through
  params.thickness = sizePx * 0.5;
  params.opacity = 1.0;                    // transmission (not alpha) = the transparency
  params.dispersion = 1.6;                 // faint prism rainbow at the edges
  params.iridescence = 0.45;               // a bit of rainbow sheen on the glass
  params.iridescenceIOR = 1.35;
  params.iridescenceThicknessRange = [100, 800]; // wide range = more colour bands
  params.reflectivity = 0.3;
  params.clearcoat = 0.35;
  params.clearcoatRoughness = 0.35;
  params.specularColor = new THREE.Color(0xbcc6ff);
  params.specularIntensity = 0.7;
  params.envMapIntensity = cfg.envIntensity * 0.85; // enough for the rainbow to catch, still no chrome
  // Faint luminous body so frosted glass stays visible on the dark background
  // instead of going near-black — mimics a lit glassmorphism panel.
  params.emissive = new THREE.Color(0x3a4a7a);
  params.emissiveIntensity = 0.1;
  params.attenuationColor = new THREE.Color(0xaab6ff);
  params.attenuationDistance = sizePx * 6;
  params.side = THREE.DoubleSide;

  return new THREE.MeshPhysicalMaterial(params);
}

// ─── Tesseract wireframe geometry ────────────────────────────────────────────
// Copied verbatim from bg-lab/shapes.js buildTesseractGeometry (lines 327-391).
function buildTesseractGeometry(): THREE.BufferGeometry {
  // 16 vertices: outer[0..7] then inner[8..15].
  // Corner order: index = (x>0 ? 4 : 0) | (y>0 ? 2 : 0) | (z>0 ? 1 : 0)
  //   0: (-,-,-)  1: (-,-,+)  2: (-,+,-)  3: (-,+,+)
  //   4: (+,-,-)  5: (+,-,+)  6: (+,+,-)  7: (+,+,+)
  const o = 0.5;   // outer half-extent
  const i = 0.25;  // inner half-extent

  // prettier-ignore
  const verts = [
    // outer cube — indices 0..7
    -o, -o, -o,   // 0
    -o, -o,  o,   // 1
    -o,  o, -o,   // 2
    -o,  o,  o,   // 3
     o, -o, -o,   // 4
     o, -o,  o,   // 5
     o,  o, -o,   // 6
     o,  o,  o,   // 7
    // inner cube — indices 8..15
    -i, -i, -i,   // 8
    -i, -i,  i,   // 9
    -i,  i, -i,   // 10
    -i,  i,  i,   // 11
     i, -i, -i,   // 12
     i, -i,  i,   // 13
     i,  i, -i,   // 14
     i,  i,  i,   // 15
  ];

  // 32 edges: each pair is [a, b] meaning one line segment from vertex a to vertex b.
  // Outer cube — 12 edges (the 12 edges of a cube with the corner encoding above):
  //   vary one axis while holding the other two fixed.
  // prettier-ignore
  const edges = [
    // outer — vary x (hold y,z)
    0, 4,  1, 5,  2, 6,  3, 7,
    // outer — vary y (hold x,z)
    0, 2,  1, 3,  4, 6,  5, 7,
    // outer — vary z (hold x,y)
    0, 1,  2, 3,  4, 5,  6, 7,
    // inner — vary x
    8, 12,  9, 13,  10, 14,  11, 15,
    // inner — vary y
    8, 10,  9, 11,  12, 14,  13, 15,
    // inner — vary z
    8, 9,  10, 11,  12, 13,  14, 15,
    // connectors — each outer corner i → inner corner i+8
    0, 8,  1, 9,  2, 10,  3, 11,
    4, 12,  5, 13,  6, 14,  7, 15,
  ];

  // Build flat Float32Array: 64 vertices (2 per edge × 32 edges), 3 components each.
  const positions = new Float32Array(edges.length * 3); // 64 * 3 = 192
  for (let e = 0; e < edges.length; e++) {
    const vi = edges[e] * 3;
    positions[e * 3 + 0] = verts[vi + 0];
    positions[e * 3 + 1] = verts[vi + 1];
    positions[e * 3 + 2] = verts[vi + 2];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geo;
}

// ─── Geometry builder ─────────────────────────────────────────────────────────
// Copied verbatim from bg-lab/shapes.js buildGeometry (lines 501-511).
// "ring" type is mapped through "torus" case (ShapeConfig has no "ring" type).
function buildGeometry(type: ShapeConfig["type"]): THREE.BufferGeometry {
  switch (type) {
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1, 0);
    case "torus":
      return new THREE.TorusGeometry(1, 0.16, 32, 96);
    default:
      return new THREE.TorusGeometry(1, 0.16, 32, 96); // fallback
  }
}

// ─── Scene factory ────────────────────────────────────────────────────────────
export function createScene(
  canvas: HTMLCanvasElement,
  tier: ActiveTier,
  cb: SceneCallbacks = {},
): SceneHandle {
  let preset = TIER_PRESETS[tier];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: preset.antialias, alpha: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const CAMERA_Z = 1000;
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 3000);
  camera.position.z = CAMERA_Z;
  let viewW = 0, viewH = 0;

  // ─── Environment map (RoomEnvironment for physical glass reflections) ─────
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envTexture = pmrem.fromScene(roomEnv).texture;
  scene.environment = envTexture;
  pmrem.dispose();
  roomEnv.dispose();

  const bgTexture = buildBackgroundTexture();
  scene.background = bgTexture;

  // ─── Soft blue & purple rim lighting ─────────────────────────────────────
  // Positioned behind/to the sides of the shapes (camera sits at +z) so they
  // graze the rounded edges as coloured rim light rather than flat front fill.
  const blueRim = new THREE.DirectionalLight(0x4f6ef7, 2.4);
  blueRim.position.set(-1.0, 0.6, -0.5); // upper-left, behind
  scene.add(blueRim);

  const purpleRim = new THREE.DirectionalLight(0xb388ff, 2.1);
  purpleRim.position.set(1.0, -0.5, -0.6); // lower-right, behind
  scene.add(purpleRim);

  // Very soft neutral fill from the camera side so front faces aren't pure black.
  const fill = new THREE.DirectionalLight(0xaab4d8, 0.35);
  fill.position.set(0, 0.2, 1);
  scene.add(fill);

  // ─── Build all meshes ─────────────────────────────────────────────────────
  // Copied from bg-lab/shapes.js SHAPES.map(...) loop (lines 514-573).
  const shapeMeshes: THREE.Object3D[] = SHAPES.map((cfg) => {
    let mesh: THREE.Mesh;

    if (cfg.type === "cube") {
      // Glass cube: a transmissive BoxGeometry for the faces (outer cube of the
      // tesseract, corners at ±0.5) with the tesseract wireframe layered on top.
      const faceGeo = new THREE.BoxGeometry(1, 1, 1);
      const faceMat = buildMaterial(cfg, 100); // placeholder size — updated on first resize
      mesh = new THREE.Mesh(faceGeo, faceMat);

      // Tesseract wireframe overlay — inner cube + connectors show refracted
      // through the glass faces. depthTest:false keeps front and back edges visible.
      const edgeMat = new THREE.LineBasicMaterial({
        color: cfg.edgeTint,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
      const edges = new THREE.LineSegments(buildTesseractGeometry(), edgeMat);
      edges.renderOrder = 2;
      mesh.add(edges);
    } else {
      const geo = buildGeometry(cfg.type);
      // Material is built with a placeholder sizePx — will be updated on first resize
      const mat = buildMaterial(cfg, 100);
      mesh = new THREE.Mesh(geo, mat);

      // Edge overlay for tetrahedrons — built from the same unit geometry.
      // The LineSegments are added as a child so they inherit position/rotation/scale
      // automatically from the parent mesh.
      if (cfg.type === "tetrahedron") {
        const edgeGeo = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineBasicMaterial({
          color: cfg.edgeTint,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        edges.renderOrder = 2;
        mesh.add(edges);
      }
    }

    // Store the starting rotation accumulators (separate from wobble)
    mesh.userData.cfg = cfg;
    mesh.userData.phase = cfg.phase;
    mesh.userData.spinAccum = { x: cfg.rotBase[0], y: cfg.rotBase[1], z: cfg.rotBase[2] };

    scene.add(mesh);
    return mesh;
  });

  // ─── Convert viewport-fraction anchor → world coords at z=0 ──────────────
  // Copied verbatim from bg-lab/shapes.js anchorToWorld (lines 576-582).
  function anchorToWorld(fx: number, fy: number): { x: number; y: number; z: number } {
    return {
      x: (fx - 0.5) * viewW,
      y: (0.5 - fy) * viewH,
      z: 0,
    };
  }

  // ─── Layout: called on every resize ──────────────────────────────────────
  // Copied from bg-lab/shapes.js layoutShapes (lines 585-623).
  // layoutGuides() call omitted (guide group not present in the factory).
  function layoutShapes() {
    for (const mesh of shapeMeshes) {
      const { cfg } = mesh.userData as { cfg: ShapeConfig };
      const p = anchorToWorld(cfg.x, cfg.y);
      mesh.userData.base = p;
      mesh.position.set(p.x, p.y, p.z);

      // Compute size in px from viewport width fraction
      const sizePx = cfg.size * viewW;
      mesh.userData.sizePx = sizePx;

      // Scale geometry — each geometry type maps its unit differently:
      //   cube: unit = 1 edge → scale to edge length = sizePx * 0.62
      //   tetrahedron: unit = 1 circumradius → scale to sizePx
      //   torus: unit = 1 outer radius → scale to sizePx * 0.5 (outer radius)
      let s: number;
      switch (cfg.type) {
        case "cube":
          s = sizePx * 0.62;
          break;
        case "tetrahedron":
          s = sizePx;
          break;
        case "torus":
          // outer diameter ≈ size; scale so outer radius = sizePx * 0.5
          s = sizePx * 0.5;
          break;
      }
      mesh.scale.set(s, s, s);

      // Update material thickness to match new size (targets the face/torus material).
      // LineSegments (tesseracts) use LineBasicMaterial which has no thickness — guard it.
      const mat = (mesh as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
      if (mat && mat.isMeshPhysicalMaterial) {
        mat.thickness = sizePx * 0.35;
      }
    }
  }

  function applyResolution() {
    const effectiveDpr = Math.min(window.devicePixelRatio, preset.dprCap) * preset.internalResScale;
    renderer.setPixelRatio(effectiveDpr);
    renderer.setSize(viewW, viewH, true); // updateStyle=true keeps canvas CSS at full size
  }

  function resize() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    camera.aspect = viewW / viewH;
    camera.fov = 2 * Math.atan(viewH / 2 / CAMERA_Z) * (180 / Math.PI);
    camera.updateProjectionMatrix();
    applyResolution();
    layoutShapes();
  }

  // ─── Transmission toggle ─────────────────────────────────────────────────
  function applyTransmission(on: boolean) {
    for (const mesh of shapeMeshes) {
      const m = (mesh as THREE.Mesh).material;
      if (m && (m as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
        const pm = m as THREE.MeshPhysicalMaterial;
        const isTorus = (mesh.userData.cfg as ShapeConfig).type === "torus";
        pm.transmission = on ? 1.0 : 0.0;
        pm.transparent = true;
        pm.opacity = on ? (isTorus ? 0.85 : 1.0) : (isTorus ? 0.9 : 0.45);
        pm.needsUpdate = true;
      }
    }
  }

  // ─── Animation loop ───────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let acc = 0;
  let firstFrameSent = false;

  function tick() {
    const dt = clock.getDelta();
    acc += dt;
    const minFrame = 1 / preset.fpsCap;
    if (acc < minFrame) return;
    const frameMs = acc * 1000;
    acc = 0;
    const t = clock.elapsedTime;

    for (const mesh of shapeMeshes) {
      // Per-shape float + rotation update.
      // Copied from bg-lab/shapes.js tick() (lines 664-689).
      const { cfg, base, phase, spinAccum } = mesh.userData as {
        cfg: ShapeConfig;
        base: { x: number; y: number; z: number };
        phase: number;
        spinAccum: { x: number; y: number; z: number };
      };

      // --- Floating position (vertical sine + horizontal cosine) ---
      const floatY = Math.sin((t / cfg.float.period) * Math.PI * 2 + phase) * cfg.float.amp;
      const floatX = Math.cos((t / (cfg.float.period * 1.4)) * Math.PI * 2 + phase)
                     * cfg.float.amp * cfg.hFloatRatio;
      mesh.position.x = base.x + floatX;
      mesh.position.y = base.y + floatY;

      // --- Rotation ---
      if (cfg.type === "torus") {
        // Tori: a slow continuous spin about their own axis (z) plus a subtle
        // tilt wobble on X/Y so the flat faces catch the rim light at changing
        // angles. Floating position is applied above.
        const w = cfg.wobble ?? { amp: 0, period: 1 };
        mesh.rotation.x = cfg.rotBase[0] + Math.sin((t / w.period) * Math.PI * 2 + phase) * w.amp;
        mesh.rotation.y = cfg.rotBase[1] + Math.cos((t / (w.period * 1.6)) * Math.PI * 2 + phase) * w.amp * 0.6;
        mesh.rotation.z = cfg.rotBase[2];
      } else {
        // Cubes and tetrahedrons: accumulate tumble on top of base orientation.
        // Edge overlay children inherit rotation automatically via scene graph.
        spinAccum.x += cfg.spinAxes[0] * dt;
        spinAccum.y += cfg.spinAxes[1] * dt;
        mesh.rotation.set(spinAccum.x, spinAccum.y, spinAccum.z);
      }
    }

    renderer.render(scene, camera);

    if (!firstFrameSent) {
      firstFrameSent = true;
      cb.onFirstFrame?.();
    }
    cb.onFrame?.(frameMs);
  }

  // Initialize: resize before start() so layoutShapes() sets mesh.userData.base
  resize();
  window.addEventListener("resize", resize);
  applyTransmission(preset.transmission);

  return {
    start() {
      clock.getDelta(); // drop accumulated idle time
      renderer.setAnimationLoop(tick);
    },
    stop() {
      renderer.setAnimationLoop(null);
    },
    setQuality(next: ActiveTier) {
      preset = TIER_PRESETS[next]; // NOTE: antialias change is ignored (renderer fixed at creation)
      applyResolution();
      applyTransmission(preset.transmission);
    },
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      bgTexture.dispose();
      envTexture.dispose();
      renderer.dispose();
    },
  };
}
