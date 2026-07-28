# Graph-Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors zoom the graph scene in/out (mouse wheel + accessible taskbar buttons), plus a small automatic zoom-in while a project is focused, per `docs/superpowers/specs/2026-07-28-graph-zoom-design.md`.

**Architecture:** `state.js` gains a `zoomLevel` field and `zoomIn()`/`zoomOut()` mutators (clamped, notify-driven, same pattern as `focusProject`/`closeWindow`). `scene.js` wraps its edge/node layers in one element and applies `transform: scale()` derived from `state.zoomLevel` times an extra fixed bonus while a project is focused — no changes to `graph-layout.js`'s coordinate math, no panning. `taskbar.js` gains two focusable +/- buttons calling the same state mutators, so zoom works without a mouse wheel.

**Tech Stack:** Vanilla JS ES module, CSS transforms (no new dependencies).

## Global Constraints

- No build tool, no npm dependencies.
- `zoomIn()`/`zoomOut()`/clamping are pure state mutations — TDD via `node --test`, following the existing pattern in `tests/state.test.js`.
- `node --check` must pass for every modified JS file.
- DOM-facing changes (wheel listener, taskbar buttons, visual transform) are manually verified in a browser at 375px and 1280px+, per this project's established convention (no unit tests for DOM rendering code).
- The graph's center (the Marco Stang node, world coordinate `(0,0)`) must stay visually centered at every zoom level — no panning.
- Any new interactive element must be reachable and operable via keyboard (Tab + Enter/Space), matching every other control in this project.

---

### Task 1: Zoom state in `state.js`

**Files:**
- Modify: `assets/js/state.js`
- Test: `tests/state.test.js`

**Interfaces:**
- Produces: `state.zoomLevel` (number, starts at `1`), `zoomIn() -> void`, `zoomOut() -> void`. `resetState()` resets `zoomLevel` back to `1`. Task 2 (`scene.js`) and Task 3 (`taskbar.js`) both import `zoomIn`/`zoomOut`/`state` from this module.

- [ ] **Step 1: Write the failing tests**

Append to `tests/state.test.js` (add `zoomIn, zoomOut` to the existing import on line 3):

```js
import { state, subscribe, completeBoot, focusProject, closeWindow, resetState, zoomIn, zoomOut } from "../assets/js/state.js";
```

Then add:

```js
test("zoomIn increases zoomLevel by 0.1", () => {
  resetState();
  zoomIn();
  assert.equal(state.zoomLevel, 1.1);
});

test("zoomOut decreases zoomLevel by 0.1", () => {
  resetState();
  zoomOut();
  assert.equal(state.zoomLevel, 0.9);
});

test("zoomIn clamps at the maximum zoom level", () => {
  resetState();
  for (let i = 0; i < 20; i += 1) zoomIn();
  assert.equal(state.zoomLevel, 1.8);
});

test("zoomOut clamps at the minimum zoom level", () => {
  resetState();
  for (let i = 0; i < 20; i += 1) zoomOut();
  assert.equal(state.zoomLevel, 0.6);
});

test("resetState resets zoomLevel back to 1", () => {
  resetState();
  zoomIn();
  resetState();
  assert.equal(state.zoomLevel, 1);
});

test("zoomIn notifies subscribers", () => {
  resetState();
  let callCount = 0;
  subscribe(() => { callCount += 1; });
  zoomIn();
  assert.equal(callCount, 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/state.test.js`
Expected: FAIL — `zoomIn is not a function` (or similar, since `state.js` doesn't export it yet)

- [ ] **Step 3: Implement zoom state**

Modify `assets/js/state.js`. Add constants near the top (after the `listeners` line):

```js
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
```

Add `zoomLevel: 1` to the `state` object:

```js
export const state = {
  bootComplete: false,
  activeProjectId: null,
  zoomLevel: 1
};
```

Add the clamp helper and the two mutators (anywhere after `notify()`):

```js
function clampZoom(value) {
  const rounded = Math.round(value * 10) / 10;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rounded));
}

export function zoomIn() {
  state.zoomLevel = clampZoom(state.zoomLevel + ZOOM_STEP);
  notify();
}

export function zoomOut() {
  state.zoomLevel = clampZoom(state.zoomLevel - ZOOM_STEP);
  notify();
}
```

Update `resetState()` to also reset zoom:

```js
export function resetState() {
  state.bootComplete = false;
  state.activeProjectId = null;
  state.zoomLevel = 1;
  listeners.clear();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/state.test.js`
Expected: PASS (11 tests: the existing 5 plus the 6 new ones)

- [ ] **Step 5: Syntax-check**

Run: `node --check assets/js/state.js`
Expected: no output (success)

- [ ] **Step 6: Commit**

```bash
git add assets/js/state.js tests/state.test.js
git commit -m "feat: add zoomIn/zoomOut state with clamping"
```

---

### Task 2: Apply zoom transform and wheel control in `scene.js`

**Files:**
- Modify: `assets/js/scene.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: `state.zoomLevel`, `zoomIn`, `zoomOut` from `assets/js/state.js` (Task 1).
- Produces: no new exports — `initScene`'s signature is unchanged. Wraps the existing edge/node layers in a new `.graph-viewport` element that later tasks don't need to know about (fully internal to `scene.js`).

- [ ] **Step 1: Wrap the rendered layers and apply the zoom transform**

Modify `assets/js/scene.js`. Update the import line to also pull in the zoom mutators:

```js
import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject, zoomIn, zoomOut } from "./state.js";
import { escapeHtml } from "./html-utils.js";

const FOCUS_ZOOM_BONUS = 1.15;
```

Replace the entire `initScene` function (it currently just calls `render()`/`subscribe(render)` and builds the two layers directly into `container` inside `render()`) with a version that also attaches a wheel listener and wraps the layers in a scaled `.graph-viewport`:

```js
export function initScene(container, projects) {
  render();
  subscribe(render);

  container.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (event.deltaY < 0) zoomIn();
      else if (event.deltaY > 0) zoomOut();
    },
    { passive: false }
  );

  function render() {
    const viewportSize = Math.min(container.clientWidth, window.innerHeight);
    const { nodes, edges } = computeLayout(projects, state.activeProjectId, viewportSize);
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const previouslyFocusedId = document.activeElement?.dataset?.nodeId ?? null;

    const viewport = document.createElement("div");
    viewport.className = "graph-viewport";
    const effectiveZoom = state.zoomLevel * (state.activeProjectId ? FOCUS_ZOOM_BONUS : 1);
    viewport.style.transform = `scale(${effectiveZoom})`;
    viewport.appendChild(buildEdgeLayer(edges, nodesById));
    viewport.appendChild(buildNodeLayer(nodes, projects));

    container.innerHTML = "";
    container.appendChild(viewport);

    if (previouslyFocusedId) {
      container.querySelector(`[data-node-id="${CSS.escape(previouslyFocusedId)}"]`)?.focus();
    }
  }
}
```

(`buildEdgeLayer` and `buildNodeLayer` below stay exactly as they are — only `initScene`'s body changes.)

- [ ] **Step 2: Add the viewport style**

Append to `assets/css/style.css`:

```css
.graph-viewport {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
}
@media (prefers-reduced-motion: no-preference) {
  .graph-viewport {
    transition: transform 0.15s ease-out;
  }
}
```

- [ ] **Step 3: Syntax-check**

Run: `node --check assets/js/scene.js`
Expected: no output (success)

- [ ] **Step 4: Run the full test suite**

Run: `node --test "tests/*.test.js"`
Expected: PASS — all existing tests still green (this task doesn't touch any unit-tested module).

- [ ] **Step 5: Manually verify in a browser**

Reload the page (1280px+ width):
- Scrolling the mouse wheel up/down over the graph zooms it in/out smoothly, stopping at the configured min/max (keep scrolling past the limit — it should stop changing, not error).
- The Marco Stang center node stays visually centered at every zoom level (no drifting/panning).
- Clicking a project node applies a visible extra zoom-in on top of whatever manual zoom level was set; closing the window (Escape or ×) returns to the manual zoom level.
- Tab/Enter/Escape keyboard flow through the graph still works exactly as before.

At 375px width:
- No horizontal scrolling appears.
- Tapping a project node still opens its window (touch has no wheel event, so zoom there will only be reachable via the Task 3 taskbar buttons — expected at this point in the plan).

- [ ] **Step 6: Commit**

```bash
git add assets/js/scene.js assets/css/style.css
git commit -m "feat: apply mouse-wheel and focus-based zoom to the graph scene"
```

---

### Task 3: Accessible zoom buttons in the taskbar

**Files:**
- Modify: `assets/js/taskbar.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: `zoomIn`, `zoomOut` from `assets/js/state.js` (Task 1).
- Produces: no new exports — `initTaskbar`'s signature is unchanged.

**Context:** `renderTaskbar()` fully replaces `container.innerHTML` on every render — which happens on every state change, every 6-second tip rotation, and every minute-boundary clock tick. Before this task, the taskbar had no focusable elements, so that was harmless. Adding real `<button>`s means a keyboard user who tabs into a zoom button can lose focus mid-interaction when a tip rotates. This task restores focus the same way `scene.js`/`window-manager.js` already do for their own re-renders.

- [ ] **Step 1: Add the buttons with focus preservation**

Modify `assets/js/taskbar.js`. Update the import:

```js
import { subscribe, state, zoomIn, zoomOut } from "./state.js";
```

Replace `renderTaskbar()`'s body with:

```js
function renderTaskbar() {
    const project = state.activeProjectId ? projectById[state.activeProjectId] : null;
    const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const focusedZoomDirection = container.contains(document.activeElement)
      ? document.activeElement.dataset.zoom
      : null;

    container.innerHTML = `
      <span class="tb-start">◆ MARCO.OS</span>
      ${project ? `<span class="tb-app">${project.id}.exe</span>` : ""}
      <span class="tb-spacer"></span>
      <span class="tb-guide">${TIPS[tipIndex]}</span>
      <div class="tb-zoom">
        <button type="button" class="tb-zoom-btn" data-zoom="out" aria-label="Rauszoomen">−</button>
        <button type="button" class="tb-zoom-btn" data-zoom="in" aria-label="Reinzoomen">+</button>
      </div>
      <span class="tb-clock">${time}</span>
    `;

    container.querySelector('[data-zoom="out"]').addEventListener("click", zoomOut);
    container.querySelector('[data-zoom="in"]').addEventListener("click", zoomIn);

    if (focusedZoomDirection) {
      container.querySelector(`[data-zoom="${focusedZoomDirection}"]`)?.focus();
    }
  }
```

- [ ] **Step 2: Add taskbar zoom button styles**

Append to `assets/css/style.css`:

```css
.tb-zoom {
  display: flex;
  gap: 4px;
}
.tb-zoom-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: none;
  color: var(--dim);
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}
.tb-zoom-btn:hover {
  color: var(--teal);
  border-color: rgba(94, 234, 212, .4);
}
.tb-zoom-btn:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Syntax-check**

Run: `node --check assets/js/taskbar.js`
Expected: no output (success)

- [ ] **Step 4: Run the full test suite**

Run: `node --test "tests/*.test.js"`
Expected: PASS — all existing tests still green.

- [ ] **Step 5: Manually verify in a browser**

At 1280px+ width:
- Two small "−"/"+" buttons appear in the taskbar, between the KI-Guide tip and the clock.
- Clicking "+" zooms the graph in; clicking "−" zooms it out; both stop at the same limits as the mouse wheel (Task 2).
- Tab to the "+" button (visible teal focus ring), wait 6+ seconds for a tip rotation to fire — focus must still be on the "+" button afterward, not lost to the page body.
- Pressing Enter/Space on a focused zoom button triggers the same zoom as a click.

At 375px width:
- The taskbar (KI-Guide tip already hidden via the existing `@media (max-width: 720px)` rule) still fits the two zoom buttons plus the clock and app chip without horizontal scrolling.
- Tapping "+"/"−" zooms the graph (this is the only zoom path available on touch devices, since there's no wheel event).

- [ ] **Step 6: Commit**

```bash
git add assets/js/taskbar.js assets/css/style.css
git commit -m "feat: add accessible taskbar zoom buttons with focus preservation"
```

---

### Task 4: End-to-end verification

**Files:**
- None expected (fix-only if a check below fails).

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS — 35 tests total (29 from before this feature, plus the 6 new zoom tests from Task 1).

- [ ] **Step 2: Syntax-check every modified JS file**

```bash
node --check assets/js/state.js
node --check assets/js/scene.js
node --check assets/js/taskbar.js
```

Expected: no output for any of them.

- [ ] **Step 3: End-to-end manual walkthrough**

Fresh reload at 1280px+, then at 375px:

1. Scroll-zoom in and out on the graph (1280px+ only); confirm it clamps and the center stays fixed.
2. Click a project node; confirm the extra focus-zoom is visible; close it; confirm zoom returns to the manual level.
3. Use the taskbar +/- buttons at both widths; confirm they work identically to the wheel where applicable.
4. Full keyboard-only pass: Tab through project nodes and the two new zoom buttons, Enter/Space activates each, focus is never lost unexpectedly (including across a tip rotation).
5. Confirm no console errors at either width.

- [ ] **Step 4: Commit (only if Step 1–3 required fixes)**

```bash
git add -A
git commit -m "fix: address zoom feature integration findings"
```

If no fixes were needed, skip this step — Task 4 is verification-only.
