# Parallax-Sternfeld Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `.desktop` gradient background's flatness with a parallaxing, mouse-reactive starfield across three depth layers, per `docs/superpowers/specs/2026-07-28-parallax-starfield-design.md`.

**Architecture:** One new module `assets/js/starfield.js` exporting `initStarfield(container)`. It appends three `<div class="star-layer">` elements (each rendering many stars via a single CSS `box-shadow` list — no per-star DOM nodes) as the first children of `.desktop`, then shifts each layer's `transform: translate()` on `mousemove` proportional to cursor offset from center, with layers closer to the "camera" moving further. No dependency on `state.js` — this is a self-contained visual layer, independent of the app's central state.

**Tech Stack:** Vanilla JS ES module, CSS (no new dependencies).

## Global Constraints

- No build tool, no npm dependencies — plain ES module, same as every other file in `assets/js/`.
- `node --check assets/js/starfield.js` must succeed (syntax check).
- No unit test for this module: it's DOM/randomness-driven (star positions, `mousemove`) with no isolable pure-logic function, same category as `scene.js`/`window-manager.js`. Verification is manual, in a real browser, at 375px and 1280px+ widths.
- Respect `prefers-reduced-motion: reduce` — stars must render but not move.
- Must not intercept clicks meant for graph nodes or the project window (`pointer-events: none` on the star layers).

---

### Task 1: Starfield module, styles, and wiring

**Files:**
- Create: `assets/js/starfield.js`
- Modify: `assets/js/main.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Produces: `initStarfield(container: HTMLElement) -> void`. Called once from `main.js` with `document.querySelector(".desktop")`.
- Consumes: nothing from other app modules (no import from `state.js` or `data/projects.js`).

- [ ] **Step 1: Create the starfield module**

Create `assets/js/starfield.js`:

```js
const STAR_COLOR_RGB = "231, 228, 245";
const FIELD_WIDTH = 2200;
const FIELD_HEIGHT = 1400;

const LAYERS = [
  { className: "star-layer--far", count: 90, opacity: 0.45, maxShift: 4 },
  { className: "star-layer--mid", count: 55, opacity: 0.65, maxShift: 9 },
  { className: "star-layer--near", count: 28, opacity: 0.85, maxShift: 16 }
];

export function initStarfield(container) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const layers = LAYERS.map((layer) => {
    const el = document.createElement("div");
    el.className = `star-layer ${layer.className}`;
    el.style.boxShadow = randomStarShadow(layer.count, layer.opacity);
    container.prepend(el);
    return { el, maxShift: layer.maxShift };
  });

  if (prefersReducedMotion) return;

  container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    layers.forEach(({ el, maxShift }) => {
      const x = (relX * 2 * maxShift).toFixed(1);
      const y = (relY * 2 * maxShift).toFixed(1);
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
}

function randomStarShadow(count, opacity) {
  const shadows = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(Math.random() * FIELD_WIDTH) - FIELD_WIDTH / 2;
    const y = Math.floor(Math.random() * FIELD_HEIGHT) - FIELD_HEIGHT / 2;
    shadows.push(`${x}px ${y}px 0 rgba(${STAR_COLOR_RGB}, ${opacity})`);
  }
  return shadows.join(", ");
}
```

- [ ] **Step 2: Syntax-check**

Run: `node --check assets/js/starfield.js`
Expected: no output (success)

- [ ] **Step 3: Append starfield styles**

Append to `assets/css/style.css`:

```css
.star-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  pointer-events: none;
}
.star-layer--near {
  width: 3px;
  height: 3px;
}
@media (prefers-reduced-motion: no-preference) {
  .star-layer {
    transition: transform 0.3s ease-out;
  }
}
```

- [ ] **Step 4: Wire it up in main.js**

Modify `assets/js/main.js` — add the import and call `initStarfield` first, before `initScene` (so its `prepend`-ed layers land behind the scene, and so it's visually established before the graph renders):

```js
import { projects } from "../../data/projects.js";
import { initBoot } from "./boot.js";
import { initStarfield } from "./starfield.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initBoot(document.querySelector("#boot-overlay"));
  initStarfield(document.querySelector(".desktop"));
  // initScene must run before initWindowManager: window-manager's focus
  // restore on close queries scene-rendered [data-node-id] elements.
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
  initTaskbar(document.querySelector("#taskbar"), projects);
});
```

- [ ] **Step 5: Syntax-check main.js**

Run: `node --check assets/js/main.js`
Expected: no output (success)

- [ ] **Step 6: Manually verify in a browser**

Start a local server and open the page (`python -m http.server 8000`, then `http://localhost:8000/`).

Expected at 1280px+ width:
- Three depth layers of small dots are visible over the existing violet/teal gradient, behind the graph nodes and edges (not covering them).
- Moving the mouse across `.desktop` shifts the star layers slightly — the "near" layer (bigger, brighter dots) moves noticeably more than the "far" layer (smaller, dimmer dots).
- Clicking a project node still opens its window normally (stars don't intercept the click).

Expected at 375px width:
- Stars are visible and don't cause horizontal scrolling.
- No console errors.

Expected with reduced motion:
- Enable "prefers-reduced-motion: reduce" via DevTools (Rendering tab → "Emulate CSS media feature prefers-reduced-motion") or your OS accessibility settings, then reload.
- Stars are visible but do not shift when the mouse moves.

- [ ] **Step 7: Commit**

```bash
git add assets/js/starfield.js assets/js/main.js assets/css/style.css
git commit -m "feat: add parallaxing starfield background"
```
