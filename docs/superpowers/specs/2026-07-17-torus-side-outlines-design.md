# Torus Side Outlines Design

## Goal

Make every transparent torus in `bg-lab` read as a three-dimensional ring by
adding subtle, visible boundaries around its inner and outer sides.

## Visual treatment

- Add four circular line loops to each `ring` or `torus`: the front and rear
  boundaries of both the inner wall and outer wall.
- Use a soft blue-white tint consistent with the existing shape outlines.
- Render the lines transparently at approximately 40% opacity with additive
  blending.
- Disable depth testing and depth writing for the loops so the rear boundaries
  remain legible through the transparent torus faces.
- Preserve the existing torus face opacity, animation, sizing, orientation, and
  placement.

## Implementation

Create a reusable outline group from the same ring radius, half-width, and
half-depth values used by the rounded-ring geometry. Attach that group as a
child of each torus mesh so it automatically inherits layout and animation.

## Verification

- Add a regression test confirming both `ring` and `torus` aliases receive the
  outline group.
- Run the focused Node test and a JavaScript syntax check.
- Visually confirm that all three rings show inner and outer side boundaries
  without becoming a full wireframe when a browser preview is available.
