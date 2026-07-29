# Orbit clusters: skill-based ellipse rings

**Status:** approved, ready for planning
**Date:** 2026-07-29

## Problem / motivation

The graph currently places every "active" project on one of three cosmetic
distance variants (1×/0.8×/1.2× of a shared base radius), cycled by render
order with no meaning attached. Colors (amber/teal/violet) cycle
independently, also with no meaning. The layout doesn't communicate anything
about how the projects relate to each other.

Idea (from the project owner): give projects on shared skill ground their own
orbit, so the graph reads as "these projects belong together" at a glance,
not just "here are 7 dots around Marco."

## Goals

- Group projects into 3 skill clusters, each on its own concentric elliptical
  orbit around the center node.
- Tie the existing color system (amber/teal/violet) to cluster membership
  instead of cycling randomly.
- Tie edge color to the same cluster color, reinforcing the grouping.
- Keep the existing "idea" tier (status `planned`) visually offset from its
  cluster siblings — still not built, but still visibly part of its cluster.
- Draw the orbit rings themselves as faint dashed ellipses so the grouping is
  legible without opening every project.

## Non-goals

- No actual orbital motion — planets stay static, as today. (Confirmed with
  project owner: animation would add rAF-loop complexity, moving hitboxes,
  and reduced-motion fallback work for a recruiter-facing page where the
  windows/content matter more than motion.)
- No rebalancing of cluster sizes — 4 (agentic-ai) / 1 (cloud) / 2
  (full-stack) stays uneven; that's an honest reflection of the current
  portfolio, not a bug to fix.
- No changes to window content, boot sequence, or taskbar.

## Data model change

`data/projects.js`: every project gets a new required field `cluster`, one
of `"agentic-ai"`, `"cloud"`, `"full-stack"`.

| Cluster | Ring (inner→outer) | Color | Projects |
|---|---|---|---|
| `agentic-ai` | 1 (innermost) | amber | sql-agent, ai-act-validation-toolkit, second-brain, goz-finetune-vs-rag |
| `cloud` | 2 (middle) | teal | cloud-native-pipeline |
| `full-stack` | 3 (outermost) | violet | ai-analytics-portal, amalea |

Ring order rationale: agentic-ai is the largest/most active cluster (current
portfolio center of gravity), so it sits closest to "Marco Stang".

`tests/projects.test.js` gets a new assertion: every project's `cluster` is
one of the three known values (mirrors the existing `status` non-empty-string
check).

## Layout algorithm (`assets/js/graph-layout.js`)

Replaces the current `ACTIVE_RADIUS_VARIANTS` cycling entirely — that
mechanism is superseded by cluster rings, not layered on top of them.

```
CLUSTER_ORDER = ["agentic-ai", "cloud", "full-stack"]
CLUSTER_RX_MULTIPLIER = { "agentic-ai": 0.65, "cloud": 1.0, "full-stack": 1.4 }
ELLIPSE_ASPECT = 0.55        // ry = rx * ELLIPSE_ASPECT
IDEA_ORBIT_MULTIPLIER = 1.25 // applied on top of the project's own cluster ring
CLUSTER_ANGLE_OFFSET_DEG = { "agentic-ai": 0, "cloud": 25, "full-stack": 50 }
```

- `baseRadius` keeps today's formula (grows with total project count, scales
  down on narrow viewports) — it's now the reference `rx` for a ring
  multiplier of 1.0, not a flat radius applied to everyone.
- Group projects by `cluster`, preserving `data/projects.js` order within
  each group.
- For a project at index `i` within its cluster (size `n`):
  `angle = (360° / n) * i + CLUSTER_ANGLE_OFFSET_DEG[cluster]`. The per-ring
  offset keeps the three rings' "first" project from lining up on the same
  radial line, so the field doesn't read as three overlapping spokes.
- `rx = baseRadius * CLUSTER_RX_MULTIPLIER[cluster]`, `ry = rx * ELLIPSE_ASPECT`.
- If `status === "planned"`: multiply both `rx` and `ry` by
  `IDEA_ORBIT_MULTIPLIER` before placing the point, and keep the existing
  `tier: "idea"` flag (still drives the smaller/dimmer CSS + edge dash
  style).
- Point position: `x = rx * cos(angle)`, `y = ry * sin(angle)` (ellipses are
  axis-aligned, no rotation — concentric, not tilted).
- `computeLayout`'s return shape gains one thing: a list of ring descriptors
  (`{ cluster, rx, ry }`, one per cluster actually present in the input) so
  `scene.js` can draw the dashed ellipse paths without recomputing the
  radius math itself.
- Edge `kind` (already used today as the CSS class suffix, `edge--${kind}`)
  changes from the flat `tier` value to: `"idea"` for planned projects
  (unchanged), or `` `cluster-${project.cluster}` `` for everyone else — e.g.
  `"cluster-agentic-ai"`. This is the only place cluster color reaches the
  edge layer; `scene.js` doesn't need extra lookups beyond what `edges`
  already carries.

## Visual rendering (`assets/js/scene.js`, `assets/css/style.css`)

- **Node color**: `node--color-{amber,teal,violet}` is now assigned by a
  fixed `cluster → class` lookup, not the existing round-robin counter
  (`nextColorVariant` goes away). `node--idea` styling still wins for
  `status: planned` regardless of cluster, as today.
- **Edges**: `edge--active` gets three cluster variants
  (`edge--cluster-agentic-ai/cloud/full-stack`) using the matching amber/
  teal/violet color for stroke + glow, replacing the single hardcoded teal.
  The pulse animation is unchanged, just the base color swaps. Idea-tier
  edges keep the existing dashed grey `edge--idea` style untouched.
- **Orbit rings**: new `.graph-orbits` SVG layer, inserted in `graph-content`
  before the edges layer (so it renders behind everything). One `<ellipse>`
  per cluster present, `fill: none`, dashed stroke in the cluster color,
  `pointer-events: none`. Rebuilt on the same `render()` pass as edges/nodes
  (i.e. keyed off the same `contentKey`, not on every zoom tick).
- **Reveal timing**: orbit rings fade in during the existing edge phase (no
  new phase added) — same `EDGE_STAGGER_MS`/`EDGE_FADE_MS`/
  `edgePhaseStartMs` timing already computed in `buildEdgeLayer`. Order
  within that phase: rings first, then edges, both still finishing before
  the runner-light phase starts. This keeps the "planets → lines → runner
  lights" three-phase structure from the boot-reveal spec instead of adding
  a fourth phase.

## Testing

`tests/graph-layout.test.js` changes from generic active-vs-idea assertions
to cluster-aware ones:

- Projects in different clusters sit on different-sized ellipses (`rx`
  differs by cluster).
- Projects within the same cluster are evenly spaced around their ring.
- A `planned` project sits further from center than its own cluster's
  `coming-soon`/`live` siblings (not just "further than some other active
  project" as today).
- Existing viewport-scaling and project-count-growth tests keep their shape,
  just measured against a single-cluster fixture so the assertions stay
  meaningful.

`tests/projects.test.js` gains the `cluster` field validation described
above.

## Migration note

This removes `ACTIVE_RADIUS_VARIANTS` and the standalone `nextColorVariant`
round-robin from the previous session's work — both are fully superseded by
the cluster-driven radius and color, not kept as a fallback.
