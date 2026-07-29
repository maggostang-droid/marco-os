# Higgsfield-generated planet artwork

**Status:** approved, ready for planning
**Date:** 2026-07-30

## Problem / motivation

Graph nodes ("planets") currently render as pure CSS: a `border-radius: 50%`
`.node-dot` with layered `radial-gradient`s for shading, one of 3 color
variants tied to project cluster (amber/teal/violet, see
`CLUSTER_COLOR_CLASS` in `scene.js`), and one of 3 texture variants
(`node--planet-shaded`, `node--planet-blotchy`, `node--planet-ringed`)
assigned pseudo-randomly per node in render order. No images are involved.

Idea (from the project owner): replace the flat gradient look with real
generated planet artwork via the newly set-up Higgsfield CLI, for a more
visually rich graph scene.

Two sample styles were generated and compared (via the brainstorming
skill's visual companion) using the `z_image` model (the only image model
available on the current free-tier Higgsfield workspace — `gpt_image_2` and
`recraft_v4_1`/`nano_banana_2_lite` require a paid Basic plan and returned
`job_minimum_basic_plan_required`):

- **A — Photoreal:** textured, NASA-photo-style cratered surface.
- **B — Flat/vector-glow:** reduced, neon-outlined, closer to the existing
  minimalist look.

Project owner picked **A — Photoreal**.

## Goals

- Generate 5 photoreal planet/celestial-body images via
  `higgsfield generate create z_image` (confirmed working on the free-tier
  workspace; ~0.15 credits/image):
  - `planet-amber.png` — agentic-ai cluster
  - `planet-teal.png` — cloud cluster
  - `planet-violet.png` — full-stack cluster
  - `sun-center.png` — the Marco center node
  - `moon.png` — the Ask-Marco chat node (`.node--moon`)
- Downscale each from the generated 2048×2048 to a small web-friendly size
  (target ~256×256) using a local one-off tool (e.g. ImageMagick) — not an
  npm dependency, consistent with this repo's no-build-tool/no-dependencies
  principle. Commit the downscaled files to `assets/img/planets/`.
- Swap `.node-dot`'s background from CSS `radial-gradient` to
  `background-image: url(...)` per node, keyed off the same
  `CLUSTER_COLOR_CLASS` mapping already used for the color variant classes
  (`scene.js` sets the image via inline style or a new class per cluster).
- Keep the existing colored `box-shadow` glow per cluster/center/moon as-is
  — it reinforces cluster identity independent of the artwork.
- Keep the `node--planet-ringed` CSS overlay (`::before` Saturn-ring),
  still assigned pseudo-randomly per node in render order — a free,
  image-independent way to keep some per-project visual variety within a
  cluster now that all projects in one cluster share one photo.
- Remove `node--planet-shaded` and `node--planet-blotchy` (the CSS shading
  overlays) — redundant now that the real photo supplies its own texture;
  `PLANET_TEXTURE_VARIANTS` in `scene.js` shrinks to just the ring variant
  (or the ring becomes an independent random boolean rather than a
  variant pick — implementation detail for the plan).
- "idea" tier (`status: "planned"`) nodes stay pure CSS — small, dimmed,
  not worth a photo.

## Non-goals

- No unique per-project artwork. All projects sharing a cluster share one
  image (project owner's explicit choice, trading per-project uniqueness
  for a smaller, cheaper asset set).
- No true alpha-transparency background removal step. Generation prompts
  already target a near-black background close to the scene's
  `--bg-deep: #06040d`, and `.node-dot` already does
  `border-radius: 50%; overflow: hidden`, which crops the square source
  image into a circle and hides any background mismatch. Revisit only if
  the crop looks visibly wrong once real assets are in.
- No animation/video assets — static images only, matching the "no actual
  orbital motion" decision already established in
  `2026-07-29-orbit-clusters-design.md`.
- No change to node sizing, layout, orbit math, or reveal-animation timing
  — only the `.node-dot` background source changes.

## Fallback / error handling

If an image fails to load, `.node-dot`'s existing colored `box-shadow` +
a CSS `background-color` fallback still reads as a plain glowing dot — no
broken-image icon, no layout shift (dimensions are already fixed by CSS,
independent of the image).

## Testing

Visual verification in-browser at 375px and 1280px+, per this repo's
existing convention for visual/animation work (see CLAUDE.md) — no
automated test needed for static image assets.
