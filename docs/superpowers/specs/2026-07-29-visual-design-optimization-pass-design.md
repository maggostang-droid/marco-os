# Visual design optimization pass

## Context

MARCO.OS's current visual design (dark space theme, violet/teal/amber cluster
colors, fake browser chrome + terminal windows) is functional and already
scores well on core accessibility/contrast checks. This is a targeted
optimization pass, not a rebuild — the CSS custom-property system, cluster
color semantics, and Segoe UI/Cascadia Code font stack (deliberately chosen to
mimic real Windows system fonts, reinforcing the fictional-OS conceit) all
stay as-is.

This follows an earlier full redesign attempt
(`redesign/frontend-design-overhaul`, see project memory) that was abandoned
because the visual changes read as either unchanged or glitchy once actually
viewed in a browser. This pass is deliberately scoped smaller, with concrete
before/after values per change, and an explicit browser-verification step
before any change is called done.

**Audit findings used to scope this pass** (via `ui-ux-pro-max` skill —
contrast ratios computed directly, not estimated):
- Contrast: all current text/background pairs measured at 5.36:1–15.43:1 —
  well above the 4.5:1 WCAG minimum. No contrast fixes needed.
- All icon-only buttons already have `aria-label`s. No fix needed.
- Real gaps found: undersized touch targets (zoom buttons, close button),
  repeated raw hex color values where a token should exist, hard `hidden`
  toggles with no transition, one gray token (`--dim`) overloaded across
  unrelated meanings (system chrome vs. in-content metadata), and the "LIVE"
  status badge reusing the cluster-semantic teal for an unrelated meaning.

## Scope

Three additive layers, all in `assets/css/style.css` (plus minor markup/JS
touch-ups only where a CSS-only fix isn't possible):

### 1. Hygiene (no visual change)

- `.tb-zoom-btn`: grow hit box from 20×20px to 32×32px (padding-based; the
  visible glyph does not need to grow at the same rate).
- `.win-close`: give it an explicit 28×28px box, flex-centered, with a
  `rgba(255,255,255,.08)` hover circle (currently only a color change on
  hover, no hit-box at all).
- Consolidate repeated raw hex text colors into two new tokens:
  `--text-secondary: #c9c5e8;` (replaces the hex currently inlined in
  `.description`, `.resume-bullets`, `.resume-extra`) and
  `--text-bright: #eae7fb;` (replaces the hex in `.summary`,
  `.resume-station-header`). Same values, zero visual diff — purely so future
  tuning is a one-line change.
- `.tech-toggle`/`.resume-toggle` reveal: replace the hard `hidden` attribute
  swap with a `max-height`/`opacity` transition (~200ms), gated behind
  `prefers-reduced-motion: no-preference` like the rest of the codebase's
  motion.

### 2. Hierarchy polish (visible, targeted)

- New `--meta: #a29cc7;` token (a step lighter than `--dim`) applied to
  in-content metadata: `.win-name` and `.resume-station-period`. `--dim`
  keeps its current darker-gray role for outer OS chrome (taskbar,
  `.chrome-url`), so content metadata and system chrome read as two distinct
  layers instead of one flat gray.
- `.win-body h3` (project title): 17px → 19px, add explicit
  `font-weight: 700` (currently inherited/default).
- `.summary`: 13px → 14px, to separate it more clearly from `.description`
  (stays 12px).

### 3. Visual depth (visible, moderate)

- `--panel-2`: `#150f28` → `#1a1330` (lighter step) for clearer separation
  between a window's title bar and body. `.window` background becomes a
  subtle top-down gradient (`--panel` → a slightly darker shade of itself)
  instead of a flat fill, for a touch more depth.
- New `--success: #34d399;` token used only by `.status-badge` ("LIVE"
  indicator). Currently `.status-badge` reuses `--teal`, which also carries
  cluster-membership meaning in the graph (cloud cluster = teal). Splitting
  these means a violet- or amber-cluster project's "LIVE" badge no longer
  visually implies "this is a cloud-cluster project."
- Subtle vignette + fine noise overlay on `.desktop`'s background (~4%
  opacity corner darkening + a low-opacity static noise texture, CSS-only via
  layered gradients or an inline SVG `feTurbulence` data-URI). Static, not
  animated — no `prefers-reduced-motion` interaction needed. Purely additive
  depth behind the existing graph/starfield layers.

## Non-goals

- No palette hue changes to `--violet`/`--teal`/`--amber` (cluster color
  identity stays fixed).
- No font-family changes (Segoe UI / Cascadia Code stay).
- No structural/markup changes beyond what's needed for the close-button hit
  box and the toggle transition.
- No changes to boot sequence, graph layout, starfield, or window-manager
  logic beyond the two toggle transitions.

## Verification

- `npm test` must still pass (no JS logic changes beyond attribute/class
  toggling for the reveal transition).
- Manual browser check via Playwright at 375px and 1280px+, **before and
  after** each of the three layers, with actual screenshots compared — not
  just CSS-value inspection. This directly addresses the prior redesign
  attempt's failure mode (changes that didn't visually register, then an
  overcorrection that looked broken).
- Confirm `prefers-reduced-motion` still suppresses the new toggle transition
  (existing pattern in the codebase, reused here).
- Confirm existing contrast ratios are not regressed by the new `--meta` /
  `--success` / `--panel-2` values (recompute WCAG ratios for any new
  text/background pairs introduced).
