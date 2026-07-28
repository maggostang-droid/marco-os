# Boot Screen & Scene Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the boot screen (more lines, typewriter effect, project names
pulled from `data/projects.js`) and make the graph scene build itself up
node-by-node right after boot completes, instead of appearing instantly.

**Architecture:** `boot.js` builds its line list dynamically from generic
system lines plus one line per project, typing each character-by-character;
`scene.js` tags each node/edge with an inline reveal delay at build time and
adds an `is-revealed` class to `#scene` once `state.bootComplete` flips —
CSS handles the actual fade/scale transition, gated entirely behind
`@media (prefers-reduced-motion: no-preference)`.

**Tech Stack:** Plain vanilla JS (ES modules), CSS transitions. No new
dependencies, no build tool.

## Global Constraints

- No build tool, no npm dependencies (project-wide).
- `boot.js`/`scene.js` stay DOM-heavy, untested-by-`node:test` modules,
  consistent with existing project precedent (starfield, window-manager) —
  no new automated tests for this plan; verification is manual/Playwright.
- `npm test` must stay at 32/32 passing after every task (regression check
  only — this plan touches no tested module).
- Reveal/typewriter effects must be fully inert under
  `prefers-reduced-motion: reduce` — instant final state, no delays, no
  animation — matching the existing pattern used by `.edge--active`,
  `.star-layer`, `.nebula`-era work, and `.graph-viewport`.
- **Deviation from the design spec's literal CSS mechanism, noted here for
  traceability:** the spec (`docs/superpowers/specs/2026-07-28-boot-reveal-design.md`)
  describes the stagger via a `--reveal-order` CSS custom property consumed
  through `calc()`. While writing this plan, a real CSS-transition timing
  subtlety was found: per-property `transition-delay` interacting with the
  *existing* `.node--project, .edge { transition: opacity .2s ease; }` rule
  (used for the focus-dim effect) could, depending on how a browser resolves
  "before-change vs. after-change style," fail to apply the stagger, or leak
  the stagger delay into unrelated future opacity changes. Task 3 below
  instead sets `transition-delay` as a **plain inline style** per element at
  build time (not a CSS custom property) and keeps the `transition`
  *declaration itself* on unscoped, always-active selectors (`.node-dot`,
  `.node-label`) so only the opacity/transform **values** — never the
  transition definition — depend on the `.is-revealed` ancestor class. This
  produces the same visual result the spec describes (center-out staggered
  reveal, normal snappy dimming afterward) through a mechanism that isn't
  sensitive to that CSS ambiguity. See Task 3 for the reasoning inline.

---

## Vorher: relevanter bestehender Code

`assets/js/boot.js` (wird in Task 1 komplett ersetzt):

```js
import { completeBoot } from "./state.js";

const BOOT_LINES = [
  "[ OK ] neural-link.service gestartet",
  "[ OK ] netzwerk-graph geladen",
  "[ .. ] warte auf Nutzereingabe_"
];

export function initBoot(overlay, { durationMs = 1800 } = {}) {
  overlay.innerHTML = BOOT_LINES.map((line) => `<div class="boot-line">${line}</div>`).join("");
  overlay.setAttribute("role", "status");

  const controller = new AbortController();

  const finish = () => {
    controller.abort();
    clearTimeout(timer);
    overlay.remove();
    completeBoot();
  };

  const timer = setTimeout(finish, durationMs);

  overlay.addEventListener("click", finish, { signal: controller.signal });
  document.addEventListener("keydown", finish, { signal: controller.signal });
}
```

`assets/js/main.js:9`: `initBoot(document.querySelector("#boot-overlay"));`

`assets/js/scene.js` `render()` (current, after the earlier zoom-stutter fix
— **do not** re-introduce a full rebuild on every notify; Task 3 adds
exactly one line before the existing early-return):

```js
  function render() {
    const viewportSize = Math.min(container.clientWidth, window.innerHeight);
    const { nodes, edges } = computeLayout(projects, viewportSize);
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const focusedProjectId = state.activeProjectId;

    const effectiveZoom = state.zoomLevel * (focusedProjectId ? FOCUS_ZOOM_BONUS : 1);
    const focusedNode = focusedProjectId ? nodesById[focusedProjectId] : null;
    const translateX = focusedNode ? -focusedNode.x * effectiveZoom : 0;
    const translateY = focusedNode ? -focusedNode.y * effectiveZoom : 0;
    viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${effectiveZoom})`;

    const contentKey = `${focusedProjectId ?? ""}:${viewportSize}`;
    if (contentKey === lastContentKey) return;
    lastContentKey = contentKey;

    const previouslyFocusedId = document.activeElement?.dataset?.nodeId ?? null;

    content.innerHTML = "";
    content.appendChild(buildEdgeLayer(edges, nodesById, focusedProjectId));
    content.appendChild(buildNodeLayer(nodes, projects, focusedProjectId));

    if (previouslyFocusedId) {
      container.querySelector(`[data-node-id="${CSS.escape(previouslyFocusedId)}"]`)?.focus({ preventScroll: true });
    }
  }
```

---

### Task 1: Typewriter boot screen with project lines

**Files:**
- Modify: `assets/js/boot.js` (full rewrite)
- Modify: `assets/js/main.js:9`

**Interfaces:**
- Consumes: `projects` array from `data/projects.js` (already imported in
  `main.js`), each with a `.title` string field.
- Produces: `initBoot(overlay, projects)` — signature change from
  `initBoot(overlay, options)`. No other module calls `initBoot`, so this is
  a safe, self-contained signature change.

- [ ] **Step 1: Replace `assets/js/boot.js`**

```js
import { completeBoot } from "./state.js";

const GENERIC_LINES = [
  "[ OK ] neural-link.service gestartet",
  "[ OK ] netzwerk-graph geladen",
  "[ OK ] projekt-index initialisiert"
];

const MAX_PROJECT_LINES = 6;
const PROMPT_LINE = "[ .. ] warte auf Nutzereingabe_";

const TYPE_INTERVAL_MS = 10;
const LINE_PAUSE_MS = 80;
const FINISH_PAUSE_MS = 500;

function buildBootLines(projects) {
  const projectLines = projects
    .slice(0, MAX_PROJECT_LINES)
    .map((project) => `[ OK ] Projekt geladen: ${project.title}`);
  return [...GENERIC_LINES, ...projectLines, PROMPT_LINE];
}

export function initBoot(overlay, projects) {
  const lines = buildBootLines(projects);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  overlay.innerHTML = "";
  overlay.setAttribute("role", "status");

  const controller = new AbortController();
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    controller.abort();
    overlay.remove();
    completeBoot();
  };

  overlay.addEventListener("click", finish, { signal: controller.signal });
  document.addEventListener("keydown", finish, { signal: controller.signal });

  if (prefersReducedMotion) {
    overlay.innerHTML = lines.map((line) => `<div class="boot-line">${line}</div>`).join("");
    setTimeout(finish, FINISH_PAUSE_MS);
    return;
  }

  typeLines(overlay, lines, controller.signal, finish);
}

function typeLines(overlay, lines, signal, finish) {
  let lineIndex = 0;

  typeNextLine();

  function typeNextLine() {
    if (signal.aborted) return;
    if (lineIndex >= lines.length) {
      setTimeout(finish, FINISH_PAUSE_MS);
      return;
    }

    const lineEl = document.createElement("div");
    lineEl.className = "boot-line";
    overlay.appendChild(lineEl);

    const text = lines[lineIndex];
    let charIndex = 0;
    typeNextChar();

    function typeNextChar() {
      if (signal.aborted) return;
      if (charIndex >= text.length) {
        lineIndex += 1;
        setTimeout(typeNextLine, LINE_PAUSE_MS);
        return;
      }
      lineEl.textContent += text[charIndex];
      charIndex += 1;
      setTimeout(typeNextChar, TYPE_INTERVAL_MS);
    }
  }
}
```

Notes for the implementer:
- `signal.aborted` is checked at the top of every scheduled step
  (`typeNextLine`/`typeNextChar`), so calling `finish()` (from the click/key
  listener, which calls `controller.abort()`) stops the typing chain from
  scheduling any further steps. One already-queued `setTimeout` callback may
  still fire once after abort, but it no-ops immediately via that same
  check — harmless, does not touch the removed `overlay`.
- `finished` guard prevents `finish()` running twice (e.g. a key press
  arriving right as the natural end-of-typing timer also fires).
- `lineEl.textContent += text[charIndex]` is safe against injection — no
  `innerHTML` is used for per-character typing, and project titles reach the
  page only as plain text content this way too (no `escapeHtml` needed here
  specifically because `textContent` never interprets markup).

- [ ] **Step 2: Update `assets/js/main.js:9`**

Change:

```js
  initBoot(document.querySelector("#boot-overlay"));
```

to:

```js
  initBoot(document.querySelector("#boot-overlay"), projects);
```

- [ ] **Step 3: Syntax-check and regression test**

Run: `node --check assets/js/boot.js && node --check assets/js/main.js && npm test`
Expected: both `node --check` calls print nothing (success), `npm test`
prints `# pass 32` / `# fail 0`.

- [ ] **Step 4: Manual browser verification**

Start `python -m http.server 8000` in the repo root, open
`http://localhost:8000/` (hard-refresh — the server sends no cache-busting
headers). Confirm:
- More boot lines than before appear, one per project plus the generic
  ones, each visibly typed character-by-character.
- Clicking the overlay or pressing any key at any point during typing
  immediately ends the boot screen (same as before).
- With the OS/browser "reduce motion" setting enabled, all lines appear
  instantly (no per-character typing), boot still ends after a short pause
  or on click/key.

- [ ] **Step 5: Commit**

```bash
git add assets/js/boot.js assets/js/main.js
git commit -m "feat: add typewriter boot screen with per-project lines"
```

---

### Task 2: CSS scaffolding for the scene reveal

**Files:**
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: nothing new (pure CSS addition).
- Produces: three CSS contracts that Task 3's JS relies on:
  - Adding class `is-revealed` to the `#scene` element (which already has
    class `scene`) reveals all currently-hidden `.node-dot`/`.node-label`/
    `.edge` descendants via a CSS transition.
  - Any element matching `.node-dot`/`.node-label` gets its
    `transition-delay` from its own **inline style** (set by Task 3), not
    from a CSS variable — the stylesheet rules below intentionally do not
    set `transition-delay` themselves.
  - `.edge`'s reveal fade reuses the transition already declared at
    `assets/css/style.css:251-256` (`.node--project, .edge { transition:
    opacity .2s ease; }`) — this task does not touch that rule.

- [ ] **Step 1: Add reveal rules**

Insert the following block directly after the existing
`.node--project.is-dimmed { opacity: .32; }` /
`@media (prefers-reduced-motion: no-preference) { .node--project, .edge {
transition: opacity .2s ease; } }` block (`assets/css/style.css`, currently
ending around line 256), and before `.window-layer`:

```css
@media (prefers-reduced-motion: no-preference) {
  .node-dot {
    transition: opacity .25s ease-out, transform .25s ease-out;
  }
  .node-label {
    transition: opacity .2s ease-out;
  }
  .scene:not(.is-revealed) .node-dot {
    opacity: 0;
    transform: scale(0);
  }
  .scene:not(.is-revealed) .node-label {
    opacity: 0;
  }
  .scene:not(.is-revealed) .node {
    pointer-events: none;
  }
  .scene:not(.is-revealed) .edge {
    opacity: 0;
  }
}
```

Why the `transition` declarations sit on the bare `.node-dot`/`.node-label`
selectors (always active) rather than inside the `:not(.is-revealed)`
block: only the **values** being transitioned (opacity, transform) should
depend on whether `.is-revealed` is present. The `transition` property
itself must be identical before and after that class toggles, or the
browser may not animate the change at all. `.edge` doesn't need its own
`transition` here because the pre-existing rule at line ~251-256 already
declares one unconditionally.

Everything is inside `@media (prefers-reduced-motion: no-preference)`, so
under `prefers-reduced-motion: reduce` none of this applies — nodes/edges
render at their normal, fully visible state immediately, with no
`pointer-events: none` gate either.

- [ ] **Step 2: Regression test**

Run: `npm test`
Expected: `# pass 32`

- [ ] **Step 3: Manual sanity check**

Hard-refresh `http://localhost:8000/`. At this point Task 3 hasn't wired up
`is-revealed` or the per-element delays yet, so expect **no visible change**
— nodes/edges should render exactly as before (the new CSS only affects
elements that are descendants of `.scene:not(.is-revealed)`, which is true
right now for every page load since nothing ever adds `.is-revealed` yet,
but since Task 3 hasn't set `.node-dot`/`.node-label`/`.edge` to actually
start hidden via matching inline delays, this step only needs to confirm no
console/rendering errors — full visual verification happens in Task 3).

Actually verify concretely: open browser dev tools, confirm the page loads
without console errors, and inspect one `.node-dot` element — it should
show `opacity: 0` and `transform: scale(0)` in computed styles (since
`.scene` never gets `.is-revealed` yet), meaning **planets are currently
invisible** until Task 3 adds the class toggle. This is expected and
correct for this intermediate step — Task 3 completes the feature.

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css
git commit -m "feat: add CSS scaffolding for staggered scene reveal"
```

---

### Task 3: Wire up reveal order and the `is-revealed` toggle

**Files:**
- Modify: `assets/js/scene.js`

**Interfaces:**
- Consumes: `.node-dot`, `.node-label`, `.edge`, `.scene:not(.is-revealed)`
  CSS contract from Task 2. `state.bootComplete` from `state.js` (already
  imported in `scene.js` via the `state` object).
- Produces: final, complete feature — no further tasks depend on this one.

- [ ] **Step 1: Add reveal-timing constants and the `is-revealed` toggle**

In `assets/js/scene.js`, add near the top (after the existing
`const FOCUS_ZOOM_BONUS = 2.6;` line):

```js
const REVEAL_STAGGER_MS = 90;
const REVEAL_LABEL_EXTRA_MS = 60;
```

In `render()`, add one line immediately before the existing
`const contentKey = ...` line:

```js
    if (state.bootComplete) container.classList.add("is-revealed");

    const contentKey = `${focusedProjectId ?? ""}:${viewportSize}`;
```

This must run before the `contentKey` early-return so the boot-complete
transition is never skipped by that guard. `classList.add` is a no-op if
the class is already present, so no extra guard against repeated calls is
needed — `render()` runs on every subsequent notify (e.g. zoom ticks) and
will just keep re-adding a class that's already there.

- [ ] **Step 2: Set per-edge reveal delay in `buildEdgeLayer`**

Change the `edges.forEach` callback signature to also receive the index
(it already does — `edges.forEach((edge, index) => {` — reuse the existing
`index`, currently used only for `EDGE_RUNNER_STAGGER_S`). Add the reveal
delay right after the existing `line.style.transform = ...` line:

```js
    line.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`;

    const edgeRevealOrder = index * 2 + 1;
    line.style.transitionDelay = `${edgeRevealOrder * REVEAL_STAGGER_MS}ms`;
```

(This sits alongside the existing `EDGE_RUNNER_STAGGER_S`-based
`animationDelay` on the separate `.edge-runner` child — two different
elements, two different delay mechanisms, no conflict.)

- [ ] **Step 3: Set per-node reveal delay in `buildNodeLayer`**

Change `nodes.forEach((node) => {` to `nodes.forEach((node, nodeIndex) => {`
so the reveal order can be computed per node position. Add the delay
computation right after that line, and use it in both `innerHTML` branches:

```js
  nodes.forEach((node, nodeIndex) => {
    const isProject = node.type === "project";
    const el = document.createElement(isProject ? "button" : "div");
    el.classList.add("node", `node--${node.type}`);
    if (isProject && focusedProjectId && node.id !== focusedProjectId) el.classList.add("is-dimmed");
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;
    el.dataset.nodeId = node.id;

    const revealOrder = nodeIndex === 0 ? 0 : nodeIndex * 2;
    const dotDelay = `${revealOrder * REVEAL_STAGGER_MS}ms`;
    const labelDelay = `${revealOrder * REVEAL_STAGGER_MS + REVEAL_LABEL_EXTRA_MS}ms`;

    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
    } else {
      const project = projectById[node.id];
      if (node.tier === "idea") el.classList.add("node--idea");
      el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(node.id === state.activeProjectId));
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><span class="node-label" style="transition-delay: ${labelDelay}">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(node.id));
    }

    layer.appendChild(el);
  });
```

`nodeIndex === 0` is always the center node (`computeLayout` in
`assets/js/graph-layout.js` always pushes the center node first, before any
project nodes), and for `nodeIndex >= 1`, `nodeIndex` maps 1:1 to
`(project index) + 1`, giving reveal order `nodeIndex * 2` — which lines up
with that same project's edge at reveal order `(nodeIndex - 1) * 2 + 1 =
nodeIndex * 2 - 1`, i.e. exactly one stagger step before its node. This
matches the edge computation in Step 2 (`index * 2 + 1` where `index` is
the edge's 0-based position, equal to `nodeIndex - 1` for that project).

`dotDelay`/`labelDelay` are computed from array indices only (never from
user-controlled project data), so interpolating them directly into the
`style="..."` attribute string is safe — no `escapeHtml` needed for these
two values specifically (unlike `project.title`, which already goes through
`escapeHtml` as before, unchanged).

- [ ] **Step 4: Syntax-check and regression test**

Run: `node --check assets/js/scene.js && npm test`
Expected: `node --check` prints nothing, `npm test` prints `# pass 32`.

- [ ] **Step 5: Full manual verification (Playwright, per this session's established pattern)**

Start the dev server if not already running
(`python -m http.server 8000` in the repo root), then drive it headlessly:

```js
// scratch script, run with: node <file>.js
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://localhost:8000/", { waitUntil: "networkidle" });

  // Let the typewriter boot play out fully instead of skipping it.
  await page.waitForSelector(".boot-overlay", { state: "detached", timeout: 15000 });

  // Immediately after boot removal, planets should still be mid-reveal or
  // just starting — capture a frame during the stagger.
  await page.screenshot({ path: "reveal-mid.png" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "reveal-done.png" });

  const finalOpacity = await page.evaluate(() => {
    const dot = document.querySelector(".node--center .node-dot");
    return getComputedStyle(dot).opacity;
  });
  console.log("center dot final opacity:", finalOpacity, "(expect 1)");
  console.log("console errors:", JSON.stringify(errors));
  await browser.close();
})();
```

(If `playwright` isn't installed in this environment yet, install it once
in the scratchpad directory — **not** as a project dependency — per this
session's established pattern: `npm install playwright` in a scratch
folder outside the repo, browser binaries are typically already cached
locally from prior sessions.)

Confirm from the two screenshots: `reveal-mid.png` shows the scene
partway through (e.g. center planet visible, some project planets still
faded/scaled down or edges still fading in), `reveal-done.png` shows
everything fully visible. `center dot final opacity` prints `1`. No console
errors.

Also manually confirm in a real (non-headless) browser or via the same
script:
- Skipping the boot screen early (click during typing) still lets the full
  staggered reveal play out afterward.
- With "reduce motion" enabled, the scene is fully visible immediately —
  no fade-in, no delay, planets clickable right away.
- Clicking a project planet, then a different one, still works normally
  (dimming/focus-zoom from the earlier session's work is unaffected —
  since those interactions always rebuild `content` fresh with
  `.is-revealed` already set on `#scene`, the newly built elements never
  pass through the hidden state at all).

- [ ] **Step 6: Commit**

```bash
git add assets/js/scene.js
git commit -m "feat: stagger scene reveal after boot completes"
```

---

## Self-Review Notes (for the planning session)

- **Spec coverage:** Typewriter boot text (Task 1), project-line generation
  with the 6-line cap (Task 1), reduced-motion instant fallback for both
  boot text (Task 1) and scene reveal (Task 2, via the media query gate),
  skip-still-reveals behavior (Task 1's `finish()` + Task 3's independent
  `is-revealed` toggle path — skipping only shortens the boot lines, never
  touches the reveal logic), center-then-edge-then-node stagger ordering
  (Task 3), pointer-events guard on not-yet-revealed nodes (Task 2) — all
  spec sections have a corresponding task.
- **Placeholder scan:** No TBD/TODO markers; every code block is complete
  and copy-pasteable.
- **Type/name consistency:** `REVEAL_STAGGER_MS`/`REVEAL_LABEL_EXTRA_MS`
  defined once in Task 3 Step 1, used consistently in Steps 2-3. `is-revealed`
  class name matches between Task 2's CSS and Task 3's JS. `.node-dot`/
  `.node-label` selectors match the existing markup structure introduced by
  the earlier center-fix work in this same session (`assets/css/style.css`
  current `.node-label` rule already uses `position: absolute`, confirmed
  compatible with adding a `transition` to it here).
