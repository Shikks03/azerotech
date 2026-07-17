// Canonical idle-background scene — the single source of truth shared by the
// bg-lab sandbox and the Next.js app. Frame-work agnostic: it takes a <canvas>
// plus options and returns a lifecycle handle. The lab adds HUD/guides/capture;
// the app adds quality tiers + an FPS watchdog. Neither owns the scene logic.
//
// Uses bare specifiers ("three", "three/addons/...") that resolve under the lab's
// import map AND the app's bundler (three exposes ./addons/* -> ./examples/jsm/*).

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  buildRingOutlineSpecs,
  NON_OCCLUDING_FACE_MATERIAL,
  RING_DIMENSIONS,
  RING_OUTLINE_MATERIAL,
  usesNonOccludingFaceMaterial,
} from "./ringSpecs.mjs";
import { SHAPES } from "./shapes.mjs";

// ─── Scene background — CanvasTexture with dark navy + blue radial glow + grid ──
function buildBackgroundTexture() {
  const W = 1024, H = 683;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

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
  const vpX = W * 0.60, vpY = H * 0.35;
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#4F6EF7";
  ctx.lineWidth = 0.6;

  const gridLines = 14;
  const angleStart = Math.PI * 0.02;
  const angleEnd   = Math.PI * 0.52;
  for (let i = 0; i <= gridLines; i++) {
    const a = angleStart + (angleEnd - angleStart) * (i / gridLines);
    const ex = vpX + Math.cos(a) * W * 1.5;
    const ey = vpY + Math.sin(a) * H * 1.5;
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  const crossLines = 8;
  for (let i = 1; i <= crossLines; i++) {
    const t = i / crossLines;
    const aL = angleStart, aR = angleEnd;
    const dist = 80 + t * W * 0.9;
    const lx = vpX + Math.cos(aL) * dist, ly = vpY + Math.sin(aL) * dist;
    const rx = vpX + Math.cos(aR) * dist, ry = vpY + Math.sin(aR) * dist;
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

// ─── Glass material factory — frosted transparent glassmorphism ─────────────────
function buildMaterial(cfg, sizePx) {
  const params = {
    color: new THREE.Color(cfg.tint),
    transmission: 1.0,
    roughness: 0.28,                 // frosted — softly blurs what's behind
    ior: 1.4,                        // gentle bend, keeps it see-through
    thickness: sizePx * 0.5,
    iridescence: 0.45,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [100, 800],
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
    transparent: true,
    opacity: 1.0,                    // transmission (not alpha) = the transparency
    dispersion: 1.6,                 // faint prism rainbow at the edges
    reflectivity: 0.3,
    specularColor: new THREE.Color(0xbcc6ff),
    specularIntensity: 0.7,
    envMapIntensity: cfg.envIntensity * 0.85,
    // Faint luminous body so frosted glass stays visible on the dark background.
    emissive: new THREE.Color(0x3a4a7a),
    emissiveIntensity: 0.1,
    attenuationColor: new THREE.Color(0xaab6ff),
    attenuationDistance: sizePx * 6,
    side: THREE.DoubleSide,
  };

  if (usesNonOccludingFaceMaterial(cfg.type)) {
    Object.assign(params, NON_OCCLUDING_FACE_MATERIAL);
  }

  return new THREE.MeshPhysicalMaterial(params);
}

// ─── Tesseract wireframe (cube-in-cube), 32 edges / 64 vertices ─────────────────
function buildTesseractGeometry() {
  const o = 0.5;   // outer half-extent
  const i = 0.25;  // inner half-extent

  // prettier-ignore
  const verts = [
    -o, -o, -o,   -o, -o,  o,   -o,  o, -o,   -o,  o,  o,
     o, -o, -o,    o, -o,  o,    o,  o, -o,    o,  o,  o,
    -i, -i, -i,   -i, -i,  i,   -i,  i, -i,   -i,  i,  i,
     i, -i, -i,    i, -i,  i,    i,  i, -i,    i,  i,  i,
  ];

  // prettier-ignore
  const edges = [
    0, 4,  1, 5,  2, 6,  3, 7,
    0, 2,  1, 3,  4, 6,  5, 7,
    0, 1,  2, 3,  4, 5,  6, 7,
    8, 12,  9, 13,  10, 14,  11, 15,
    8, 10,  9, 11,  12, 14,  13, 15,
    8, 9,  10, 11,  12, 13,  14, 15,
    0, 8,  1, 9,  2, 10,  3, 11,
    4, 12,  5, 13,  6, 14,  7, 15,
  ];

  const positions = new Float32Array(edges.length * 3);
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

// ─── Rounded-rectangle-cross-section ring, as a surface of revolution ───────────
function buildRoundedRingGeometry({
  ringRadius = RING_DIMENSIONS.ringRadius,
  halfWidth = RING_DIMENSIONS.halfWidth,
  halfDepth = RING_DIMENSIONS.halfDepth,
  fillet = RING_DIMENSIONS.fillet,
  tubularSegments = RING_DIMENSIONS.tubularSegments,
  filletSegments = 6,
} = {}) {
  const a = halfWidth, b = halfDepth;
  const f = Math.min(fillet, Math.min(a, b));

  const profile = [];
  const arc = (cx, cy, a0, a1) => {
    for (let k = 0; k <= filletSegments; k++) {
      const ang = a0 + (a1 - a0) * (k / filletSegments);
      const nu = Math.cos(ang), nv = Math.sin(ang);
      profile.push([cx + f * nu, cy + f * nv, nu, nv]);
    }
  };
  const H = Math.PI / 2;
  arc( a - f,   b - f,   H,        0);
  arc( a - f, -(b - f),  0,       -H);
  arc(-(a - f), -(b - f), -H,     -Math.PI);
  arc(-(a - f),  b - f,  Math.PI,  H);

  const profCount = profile.length;
  const stride = profCount + 1;

  const positions = [], normals = [], uvs = [], indices = [];
  for (let i = 0; i <= tubularSegments; i++) {
    const theta = (i / tubularSegments) * Math.PI * 2;
    const cos = Math.cos(theta), sin = Math.sin(theta);
    for (let j = 0; j <= profCount; j++) {
      const [u, v, nu, nv] = profile[j % profCount];
      const r = ringRadius + u;
      positions.push(r * cos, r * sin, v);
      normals.push(nu * cos, nu * sin, nv);
      uvs.push(i / tubularSegments, j / profCount);
    }
  }
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < profCount; j++) {
      const A = i * stride + j;
      const B = (i + 1) * stride + j;
      const C = (i + 1) * stride + (j + 1);
      const D = i * stride + (j + 1);
      indices.push(A, B, D, B, C, D);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function buildRingOutlineGroup({
  ringRadius = RING_DIMENSIONS.ringRadius,
  halfWidth = RING_DIMENSIONS.halfWidth,
  halfDepth = RING_DIMENSIONS.halfDepth,
  fillet = RING_DIMENSIONS.fillet,
  tubularSegments = RING_DIMENSIONS.tubularSegments,
} = {}) {
  const group = new THREE.Group();
  const { additive, ...materialValues } = RING_OUTLINE_MATERIAL;
  const material = new THREE.LineBasicMaterial({
    ...materialValues,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  for (const { radius, depth } of buildRingOutlineSpecs({ ringRadius, halfWidth, halfDepth, fillet })) {
    const points = [];
    for (let i = 0; i < tubularSegments; i++) {
      const angle = (i / tubularSegments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, depth));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const outline = new THREE.LineLoop(geometry, material);
    outline.renderOrder = 2;
    group.add(outline);
  }

  return group;
}

function buildGeometry(type) {
  switch (type) {
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1, 0);
    case "ring":
    case "torus":
      return buildRoundedRingGeometry();
    default:
      return new THREE.TorusGeometry(1, 0.16, 32, 96);
  }
}

const CAMERA_Z = 1000;

/**
 * Create the idle-background scene bound to `canvas`.
 * @param {HTMLCanvasElement} canvas
 * @param {object} [options]
 * @param {number} [options.dprCap=2]            max device-pixel-ratio
 * @param {number} [options.internalResScale=1]  drawing-buffer scale (CSS size unchanged)
 * @param {boolean} [options.transmission=true]  enable glass transmission (the big cost)
 * @param {number} [options.fpsCap=Infinity]     render-loop frame cap
 * @param {boolean} [options.antialias=true]     MSAA (fixed at creation)
 * @param {() => void} [options.onFirstFrame]    fired once after the first render
 * @param {(frameMs: number) => void} [options.onFrame]  fired each rendered frame
 * @param {boolean} [options.pauseOnHidden=true] pause the loop while the tab is hidden
 */
export function createScene(canvas, options = {}) {
  const opts = {
    dprCap: 2,
    internalResScale: 1,
    transmission: true,
    fpsCap: Infinity,
    antialias: true,
    pauseOnHidden: true,
    onFirstFrame: undefined,
    onFrame: undefined,
    ...options,
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: opts.antialias });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 3000);
  camera.position.z = CAMERA_Z;
  let viewW = 0, viewH = 0;

  // Environment map (PMREM RoomEnvironment) for physical glass reflections.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envTexture = pmrem.fromScene(roomEnv).texture;
  scene.environment = envTexture;
  pmrem.dispose();
  roomEnv.dispose();

  // Soft blue & purple rim lighting from behind, plus a faint camera-side fill.
  const blueRim = new THREE.DirectionalLight(0x4f6ef7, 2.4);
  blueRim.position.set(-1.0, 0.6, -0.5);
  scene.add(blueRim);
  const purpleRim = new THREE.DirectionalLight(0xb388ff, 2.1);
  purpleRim.position.set(1.0, -0.5, -0.6);
  scene.add(purpleRim);
  const fill = new THREE.DirectionalLight(0xaab4d8, 0.35);
  fill.position.set(0, 0.2, 1);
  scene.add(fill);

  const bgTexture = buildBackgroundTexture();
  scene.background = bgTexture;

  // Build all meshes once.
  const shapeMeshes = SHAPES.map((cfg) => {
    let mesh;

    if (cfg.type === "cube") {
      const faceGeo = new THREE.BoxGeometry(1, 1, 1);
      const faceMat = buildMaterial(cfg, 100);
      mesh = new THREE.Mesh(faceGeo, faceMat);

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
      const mat = buildMaterial(cfg, 100);
      mesh = new THREE.Mesh(geo, mat);

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

      if (cfg.type === "ring" || cfg.type === "torus") {
        mesh.add(buildRingOutlineGroup());
      }
    }

    mesh.userData.cfg = cfg;
    mesh.userData.phase = cfg.phase;
    mesh.userData.spinAccum = { x: cfg.rotBase[0], y: cfg.rotBase[1], z: cfg.rotBase[2] };

    scene.add(mesh);
    return mesh;
  });

  function anchorToWorld(fx, fy) {
    return { x: (fx - 0.5) * viewW, y: (0.5 - fy) * viewH, z: 0 };
  }

  // Optional placement guides (lab dev aid; off by default).
  const guideGroup = new THREE.Group();
  guideGroup.visible = false;
  scene.add(guideGroup);
  function layoutGuides() {
    guideGroup.clear();
    for (const cfg of SHAPES) {
      const p = anchorToWorld(cfg.x, cfg.y);
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(6, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xff5577 }),
      );
      marker.position.set(p.x, p.y, 50);
      guideGroup.add(marker);
    }
  }

  function layoutShapes() {
    for (const mesh of shapeMeshes) {
      const { cfg } = mesh.userData;
      const p = anchorToWorld(cfg.x, cfg.y);
      mesh.userData.base = p;
      mesh.position.set(p.x, p.y, p.z);

      const sizePx = cfg.size * viewW;
      mesh.userData.sizePx = sizePx;

      let s;
      switch (cfg.type) {
        case "cube": s = sizePx * 0.62; break;
        case "tetrahedron": s = sizePx; break;
        case "torus":
        case "ring": s = sizePx * 0.5; break;
      }
      mesh.scale.set(s, s, s);

      if (mesh.material && mesh.material.isMeshPhysicalMaterial) {
        mesh.material.thickness = sizePx * 0.35;
      }
    }
    if (guideGroup.visible) layoutGuides();
  }

  function applyResolution() {
    const effectiveDpr = Math.min(window.devicePixelRatio, opts.dprCap) * opts.internalResScale;
    renderer.setPixelRatio(effectiveDpr);
    renderer.setSize(viewW, viewH, true); // updateStyle=true keeps canvas CSS full-size
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

  function applyTransmission(on) {
    for (const mesh of shapeMeshes) {
      const m = mesh.material;
      if (m && m.isMeshPhysicalMaterial) {
        m.transmission = on ? 1.0 : 0.0;
        // Cubes are the only occluding glass faces; approximate them with alpha
        // when transmission is off. Other faces are already non-occluding.
        if (mesh.userData.cfg.type === "cube") {
          m.transparent = true;
          m.opacity = on ? 1.0 : 0.5;
        }
        m.needsUpdate = true;
      }
    }
  }

  const clock = new THREE.Clock();
  let acc = 0;
  let firstFrameSent = false;
  let running = false;

  function renderShapes(dt, t) {
    for (const mesh of shapeMeshes) {
      const { cfg, base, phase, spinAccum } = mesh.userData;

      const floatY = Math.sin((t / cfg.float.period) * Math.PI * 2 + phase) * cfg.float.amp;
      const floatX = Math.cos((t / (cfg.float.period * 1.4)) * Math.PI * 2 + phase)
                     * cfg.float.amp * cfg.hFloatRatio;
      mesh.position.x = base.x + floatX;
      mesh.position.y = base.y + floatY;

      if (cfg.type === "ring" || cfg.type === "torus") {
        const w = cfg.wobble;
        mesh.rotation.x = cfg.rotBase[0] + Math.sin((t / w.period) * Math.PI * 2 + phase) * w.amp;
        mesh.rotation.y = cfg.rotBase[1] + Math.cos((t / (w.period * 1.6)) * Math.PI * 2 + phase) * w.amp * 0.6;
        mesh.rotation.z = cfg.rotBase[2] + t * (cfg.spin ?? 0);
      } else {
        spinAccum.x += cfg.spinAxes[0] * dt;
        spinAccum.y += cfg.spinAxes[1] * dt;
        mesh.rotation.set(spinAccum.x, spinAccum.y, spinAccum.z);
      }
    }
  }

  function tick() {
    const dt = clock.getDelta();
    acc += dt;
    const minFrame = 1 / opts.fpsCap; // Infinity -> 0 -> render every frame
    if (acc < minFrame) return;
    const frameMs = acc * 1000;
    acc = 0;

    renderShapes(dt, clock.elapsedTime);
    renderer.render(scene, camera);

    if (!firstFrameSent) {
      firstFrameSent = true;
      if (opts.onFirstFrame) opts.onFirstFrame();
    }
    if (opts.onFrame) opts.onFrame(frameMs);
  }

  function onVisibility() {
    if (!running) return;
    renderer.setAnimationLoop(document.hidden ? null : tick);
    if (!document.hidden) clock.getDelta(); // drop the hidden-time delta
  }

  // Layout must run before any render (sets mesh.userData.base).
  resize();
  window.addEventListener("resize", resize);
  applyTransmission(opts.transmission);
  if (opts.pauseOnHidden) document.addEventListener("visibilitychange", onVisibility);

  return {
    scene,
    camera,
    renderer,
    start() {
      running = true;
      clock.getDelta(); // drop accumulated idle time
      renderer.setAnimationLoop(tick);
    },
    stop() {
      running = false;
      renderer.setAnimationLoop(null);
    },
    /** Render a single frame (for prefers-reduced-motion). */
    renderStaticFrame() {
      renderShapes(0, clock.elapsedTime);
      renderer.render(scene, camera);
    },
    /** Live-update quality knobs (antialias is fixed at creation). */
    setOptions(partial) {
      Object.assign(opts, partial);
      applyResolution();
      applyTransmission(opts.transmission);
    },
    setGuidesVisible(visible) {
      guideGroup.visible = visible;
      if (visible) layoutGuides();
    },
    /** Render one frame at a fixed size and return it as a PNG blob (dev capture). */
    captureFrame(width, height) {
      const prevW = viewW, prevH = viewH;
      viewW = width; viewH = height;
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = 2 * Math.atan(height / 2 / CAMERA_Z) * (180 / Math.PI);
      camera.updateProjectionMatrix();
      layoutShapes();
      renderShapes(0, clock.elapsedTime);
      renderer.render(scene, camera);
      return new Promise((resolve) => {
        renderer.domElement.toBlob((blob) => {
          viewW = prevW; viewH = prevH;
          resize();
          resolve(blob);
        }, "image/png");
      });
    },
    dispose() {
      running = false;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mat = o.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      bgTexture.dispose();
      envTexture.dispose();
      renderer.dispose();
    },
  };
}
