// Canonical ring geometry constants + helpers, shared by the bg-lab sandbox and
// the Next.js app. Pure data/logic — no THREE, no DOM — so it stays testable and
// browser-independent. (Moved here from bg-lab/ring-specs.mjs as the single source.)

export const RING_DIMENSIONS = Object.freeze({
  ringRadius: 0.84,
  halfWidth: 0.16,
  halfDepth: 0.11,
  fillet: 0.055,
  tubularSegments: 168,
});

export const RING_OUTLINE_MATERIAL = Object.freeze({
  color: 0xcdd8ff,
  transparent: true,
  opacity: 0.4,
  additive: true,
  depthWrite: false,
  depthTest: false,
});

export const NON_OCCLUDING_FACE_MATERIAL = Object.freeze({
  opacity: 0.1,
  depthWrite: false,
});

export function usesNonOccludingFaceMaterial(type) {
  return type === "tetrahedron" || type === "ring" || type === "torus";
}

export function buildRingOutlineSpecs({
  ringRadius = RING_DIMENSIONS.ringRadius,
  halfWidth = RING_DIMENSIONS.halfWidth,
  halfDepth = RING_DIMENSIONS.halfDepth,
  fillet = RING_DIMENSIONS.fillet,
} = {}) {
  const radii = [ringRadius - halfWidth, ringRadius + halfWidth];
  const wallHalfDepth = halfDepth - fillet;
  const depths = [-wallHalfDepth, wallHalfDepth];

  return radii.flatMap((radius) => (
    depths.map((depth) => ({ radius, depth }))
  ));
}
