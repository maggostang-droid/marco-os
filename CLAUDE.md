# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A portfolio site for Marco Stang, presented as a fictional operating system
("MARCO.OS"): the desktop background is a live neural-network graph with Marco as
the central node and each project as a satellite node ("planet"). Clicking a node
opens a terminal-style window with project details. Deliberate decision: no
classic card-grid fallback — the graph/OS scene *is* the page. Core value: a
recruiter can try a project's live demo directly in the browser, without a build
step or install.

**The code is built and working** — this is not a spec-only repo. Original
design/build intent lives in:
- `docs/superpowers/specs/2026-07-28-marco-os-design.md`
- `docs/superpowers/plans/2026-07-28-marco-os-implementation.md` (task-by-task,
  written for `superpowers:subagent-driven-development`)

Later features each have their own spec/plan under `docs/superpowers/specs/` and
`docs/superpowers/plans/` (parallax starfield, graph zoom, boot screen + scene
reveal, etc.) — check the most recent ones there before assuming current
behavior, since individual features have evolved past their original specs
through live tuning.

## Relationship to sibling repos

This is one of two independent, uncoordinated successor concepts to
`stangfolio` (the original static card-grid portfolio, which stays untouched as
a legacy/backup repo). The other is `stangverse` (an isometric walkable Phaser
world). Neither knows about the other's progress — no decision has been made on
which (if either) becomes the permanent portfolio. Don't assume parity with
stangverse's implementation choices.

A `second-brain` chat app (separate repo/Streamlit) is planned to be embedded
later via `<iframe>` once it has a live URL — see the "Zukünftig geplant"
section of the design spec. Not yet implemented.

## Commands

```bash
npm test                     # runs `node --test`, discovers tests/*.test.js — 32/32 passing
node --check <file>.js       # per-file syntax check
python -m http.server 8000   # serve locally, then open http://localhost:8000/
```

`node --test tests/` (passing the directory explicitly) does **not** work on
this Node build — use `npm test` or `node --test "tests/*.test.js"` instead.

No build tool, bundler, or framework — plain HTML/CSS/vanilla JS (ES modules).
`package.json` exists only to declare `"type": "module"` and the test script.
Hosting is GitHub Pages ("Deploy from branch"), no CI pipeline. Verify manually
in a browser at 375px and 1280px+ widths — most visual/animation work in this
project is verified via a locally-installed Playwright (installed in a scratch
directory outside the repo, never as a project dependency, to keep the
"no dependencies" principle) rather than automated tests.

**Cache trap:** `python -m http.server` sends no cache-busting headers — hard
refresh (Ctrl+Shift+R) after JS/CSS changes or you'll see stale output.

## Architecture

- `data/projects.js` — project data (`id`, `title`, `summary`, `description`,
  `tags`, `demoUrl`, `repoUrl`, `status`, `cluster`, optional
  `coldStartNote`). No position field — layout is computed at runtime.
- `assets/js/state.js` — central state singleton (`activeProjectId`,
  `bootComplete`, `zoomLevel`) with a subscribe/notify pattern.
- `assets/js/boot.js` — typewriter-style boot-line overlay (generic system
  lines + one line per project), skippable by click/keypress at any point,
  respects `prefers-reduced-motion`. Once it finishes, `state.bootComplete`
  flips and the background overlay fades out while the graph scene reveals
  itself.
- `assets/js/graph-layout.js` — pure function computing node/edge coordinates.
  Projects are grouped by `cluster` (`agentic-ai`/`cloud`/`full-stack`) onto
  their own concentric elliptical orbit around the center node, evenly
  spaced within each ring; `status: "planned"` projects sit further out on
  their own ring via `IDEA_ORBIT_MULTIPLIER`. Viewport-responsive radius.
  No tag/tech-stack nodes in the graph itself anymore — tech stack shows in
  the project window's collapsible list instead. Kept unit-tested and
  DOM-free.
- `assets/js/scene.js` — renders the graph: `.graph-viewport` (gets the
  zoom/pan transform) wraps a `.graph-content` div (edges + nodes, rebuilt
  only when the focused project or viewport size changes — *not* on every
  zoom tick, to avoid restarting CSS animations). After boot, nodes/edges/
  edge-runner lights reveal themselves in staggered phases (planets → lines →
  runner lights) via CSS transitions gated on an `is-revealed` class.
  Clicking a planet centers/zooms on it and dims the rest; clicking the
  background closes the open window.
- `assets/js/starfield.js` — parallax star field (`box-shadow`-based, no
  per-star DOM nodes), lives inside `.graph-viewport` so it zooms/pans with
  the graph. Mouse-reactive parallax only, respects reduced-motion.
- `assets/js/window-manager.js` — renders the single open "terminal window"
  for the active project.
- `assets/js/taskbar.js` — real system clock, active-window indicator,
  zoom buttons, rotating static "AI guide" tips (no real LLM behind it).
- `assets/js/focus-target.js` / `assets/js/html-utils.js` — small pure
  helpers (focus-restore decision logic, `escapeHtml`), unit-tested.
- `index.html` — containers: `#boot-overlay`, `#scene`, `#window-layer`,
  `#taskbar`.

## Working style notes for this repo

- Work happens directly on `master`, no worktrees/branches — an explicit,
  repeated choice by the project owner, not an oversight. Ask before
  introducing one for new work.
- Bigger features go through `superpowers:brainstorming` →
  `superpowers:writing-plans` → `superpowers:subagent-driven-development`
  (spec + plan committed under `docs/superpowers/`). Small visual/timing
  tweaks (animation speed, color, stagger delays) are made directly and
  verified in-browser — no need for the full process for those.
