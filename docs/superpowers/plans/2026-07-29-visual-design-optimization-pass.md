# Visual Design Optimization Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the three-layer CSS/markup optimization pass (hygiene, hierarchy, visual depth) from `docs/superpowers/specs/2026-07-29-visual-design-optimization-pass-design.md` to `assets/css/style.css` and the two small JS spots it touches, without changing the site's architecture, palette identity, or fonts.

**Architecture:** Single-file CSS changes (`assets/css/style.css`) plus a minimal JS refactor in `assets/js/window-manager.js` (swap a `hidden`-attribute toggle for a class + `aria-hidden` toggle so the reveal can transition). No new files, no build step, no new dependencies.

**Tech Stack:** Plain CSS custom properties, vanilla JS (ES modules), verified manually via the already-installed Playwright MCP tools (`browser_navigate`, `browser_resize`, `browser_take_screenshot`, `browser_snapshot`, `browser_click`) against `python -m http.server 8000` — Playwright is not a project dependency.

## Global Constraints

- No changes to `--violet` (#a78bfa), `--teal` (#5eead4), or `--amber` (#fbbf24) hue values — cluster color identity is fixed.
- No font-family changes — Segoe UI / Cascadia Code stay exactly as-is.
- No changes to boot sequence, graph layout, starfield, or window-manager logic beyond the two toggle-reveal transitions (Task 2).
- `npm test` must pass after every task.
- Every new transition must be gated behind `@media (prefers-reduced-motion: no-preference)`, matching the existing codebase convention (see `.edge-runner`, `.node-dot` rules already in `style.css`).
- Every task that changes something visible must be verified in-browser at 375px and 1280px width via Playwright screenshots, before and after — not just inspected as CSS source. This directly addresses the prior redesign attempt's failure mode (a change that didn't visually register, followed by an overcorrection that looked broken).
- Any new color pairing must be checked against WCAG 4.5:1 minimum contrast (values below are pre-computed in this plan; re-verify if you change any of them).

---

### Task 1: Consolidate repeated text-color tokens + enlarge undersized touch targets

**Files:**
- Modify: `assets/css/style.css:1-12` (root tokens), `:451`, `:454-464`, `:491-502`, `:543-591` (approximate line numbers — CSS may reflow slightly as earlier tasks land; find blocks by selector, not line number, if they've shifted), `:735-758`

**Interfaces:**
- Produces: two new CSS custom properties, `--text-secondary` and `--text-bright`, available to all later tasks in this plan and to any future style work in this file.

- [ ] **Step 1: Capture baseline screenshots**

Start the dev server, then use the Playwright MCP tools to capture a "before" reference:

```bash
python -m http.server 8000
```

Using the Playwright browser tools: `browser_navigate` to `http://localhost:8000/`, click a project node to open its window, `browser_resize` to 1280×800 and `browser_take_screenshot` (save as `before-task1-desktop.png`), then `browser_resize` to 375×800 and `browser_take_screenshot` (`before-task1-mobile.png`).

- [ ] **Step 2: Add the two new tokens**

In `assets/css/style.css`, inside the `:root { ... }` block (currently ends at line 12 with `--text: #e7e4f5;`), add:

```css
  --text-secondary: #c9c5e8;
  --text-bright: #eae7fb;
```

- [ ] **Step 3: Replace the raw hex values these tokens represent**

Each of these is a pure find-and-replace — same visual value, now referencing the token:

```css
/* .summary — was: color: #eae7fb; */
.summary {
  color: var(--text-bright);
}

/* .description — was: color: #c9c5e8; */
.description {
  color: var(--text-secondary);
}

/* .resume-intro — was: color: #c9c5e8; */
.resume-intro {
  color: var(--text-secondary);
}

/* .resume-station-header — was: color: #eae7fb; */
.resume-station-header {
  color: var(--text-bright);
}

/* .resume-bullets — was: color: #c9c5e8; */
.resume-bullets {
  color: var(--text-secondary);
}

/* .resume-extra — was: color: #c9c5e8; */
.resume-extra {
  color: var(--text-secondary);
}
```

- [ ] **Step 4: Enlarge the zoom button hit targets**

`.tb-zoom-btn` currently declares `width: 20px; height: 20px;`. Change both to 32px:

```css
.tb-zoom-btn {
  width: 32px;
  height: 32px;
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
```

(Only `width`/`height` change from 20px to 32px — every other declaration in the rule stays as-is.)

- [ ] **Step 5: Give `.win-close` an explicit hit box and hover affordance**

Currently `.win-close` has no explicit width/height at all (just font-size + line-height). Replace the rule with:

```css
.win-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--dim);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  transition: background-color 150ms ease;
}
.win-close:hover {
  background: rgba(255, 255, 255, .08);
}
.win-close:focus-visible {
  outline: 2px solid var(--teal);
}
```

- [ ] **Step 6: Verify no regressions**

Run:

```bash
npm test
```

Expected: all existing tests still pass (this task touches no JS, so this is a sanity check, not expected to catch anything).

Using Playwright: `browser_navigate` to `http://localhost:8000/` (hard refresh — this server sends no cache-busting headers), reopen the same project window, resize to 1280×800 and take `after-task1-desktop.png`, resize to 375×800 and take `after-task1-mobile.png`. Compare against the Step 1 screenshots: text should look pixel-identical (same colors, just tokenized), and the zoom/close buttons should visibly have a larger clickable area (confirm by hovering — the `.win-close` hover circle should now appear centered around the × and clearly bigger than the glyph itself).

- [ ] **Step 7: Commit**

```bash
git add assets/css/style.css
git commit -m "style: consolidate text-color tokens and enlarge touch targets"
```

---

### Task 2: Animate the tech-details / résumé-extra reveal instead of hard-toggling `hidden`

**Files:**
- Modify: `assets/css/style.css` (`.description`, `.resume-extra` rules)
- Modify: `assets/js/window-manager.js:91-98` (`buildProjectWindow` markup + `wireProjectWindowInteractions`, lines 106-115), `:168-169` (`buildResumeWindow` markup) and `:179-188` (`wireResumeWindowInteractions`)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: a reusable pattern (grid-rows collapse + `is-expanded` class + synced `aria-hidden`) — no new exported functions, this is internal to `window-manager.js`.

- [ ] **Step 1: Capture baseline screenshots and accessibility snapshot**

With the dev server still running, `browser_navigate` to a project window, `browser_click` the "Technische Details anzeigen" toggle, then `browser_snapshot` to record the current accessibility tree (confirms today's behavior: the collapsed `<p class="description" hidden>` is absent from the tree; expanding it makes it appear). Save this as your reference for Step 4.

- [ ] **Step 2: Replace `hidden`-attribute CSS with an animatable collapse**

The current `.description` rule (a flat block) and `.resume-extra` rule need to become collapsible via the CSS grid-rows trick (animates to the content's natural height, no hardcoded max-height guess). Replace:

```css
.description {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 6px 0 12px;
}
```

with:

```css
.description {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  opacity: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.description.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  margin: 6px 0 12px;
}
@media (prefers-reduced-motion: no-preference) {
  .description {
    transition: grid-template-rows 200ms ease, opacity 200ms ease, margin 200ms ease;
  }
}
```

And replace:

```css
.resume-extra {
  margin: 0 0 12px;
  padding-left: 16px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-secondary);
}
```

with:

```css
.resume-extra {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  opacity: 0;
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.resume-extra.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  margin: 0 0 12px;
}
@media (prefers-reduced-motion: no-preference) {
  .resume-extra {
    transition: grid-template-rows 200ms ease, opacity 200ms ease, margin 200ms ease;
  }
}
```

(Both rules already picked up `var(--text-secondary)` from Task 1 — keep that.)

- [ ] **Step 3: Swap the `hidden` attribute for the new class in the markup**

In `assets/js/window-manager.js`, in `buildProjectWindow` (around line 92):

```js
// was: <p class="description" hidden>${escapeHtml(project.description)}</p>
<p class="description" aria-hidden="true">${escapeHtml(project.description)}</p>
```

In `buildResumeWindow` (around line 169):

```js
// was: <ul class="resume-extra" hidden>${extraHtml}</ul>
<ul class="resume-extra" aria-hidden="true">${extraHtml}</ul>
```

- [ ] **Step 4: Update the two toggle handlers to drive the class + `aria-hidden` together**

Replace `wireProjectWindowInteractions` (lines 106-115):

```js
function wireProjectWindowInteractions(win) {
  const techToggle = win.querySelector(".tech-toggle");
  const descriptionEl = win.querySelector(".description");
  techToggle.addEventListener("click", () => {
    const expanding = !descriptionEl.classList.contains("is-expanded");
    descriptionEl.classList.toggle("is-expanded", expanding);
    descriptionEl.setAttribute("aria-hidden", String(!expanding));
    techToggle.setAttribute("aria-expanded", String(expanding));
    techToggle.textContent = expanding ? "▾ Technische Details verbergen" : "▸ Technische Details anzeigen";
  });
}
```

Replace `wireResumeWindowInteractions` (lines 179-188):

```js
function wireResumeWindowInteractions(win) {
  const toggle = win.querySelector(".resume-toggle");
  const extra = win.querySelector(".resume-extra");
  toggle.addEventListener("click", () => {
    const expanding = !extra.classList.contains("is-expanded");
    extra.classList.toggle("is-expanded", expanding);
    extra.setAttribute("aria-hidden", String(!expanding));
    toggle.setAttribute("aria-expanded", String(expanding));
    toggle.textContent = expanding ? "▾ Vollständigen Werdegang verbergen" : "▸ Vollständigen Werdegang anzeigen";
  });
}
```

- [ ] **Step 5: Run the automated test suite**

```bash
npm test
```

Expected: all tests still pass (no existing test covers `window-manager.js`'s DOM output, so this is a regression check on the rest of the suite, not new coverage).

- [ ] **Step 6: Verify the reveal behavior and accessibility in-browser**

Using Playwright: navigate to a project window, `browser_click` the tech-details toggle, `browser_take_screenshot` mid-toggle if possible (or immediately after) to confirm a smooth ~200ms expand rather than an instant cut, then `browser_snapshot` and confirm the description text is now present/exposed in the accessibility tree with `aria-hidden="false"` (or absent from the `aria-hidden="true"` state when collapsed). Repeat for the résumé window's "Vollständigen Werdegang" toggle.

Then re-run with reduced motion emulated (Playwright's `browser_evaluate` can set `window.matchMedia` preference via CDP, or use the OS-level reduced-motion emulation if the tool exposes it) and confirm the toggle still works but with no animation — content should appear/disappear instantly.

- [ ] **Step 7: Commit**

```bash
git add assets/css/style.css assets/js/window-manager.js
git commit -m "feat: animate tech-details and résumé-extra reveal transitions"
```

---

### Task 3: Hierarchy polish — differentiate in-content metadata from OS chrome, strengthen title/summary weight

**Files:**
- Modify: `assets/css/style.css` (`:root`, `.win-name`, `.resume-station-period`, `.win-body h3`, `.summary`)

**Interfaces:**
- Consumes: nothing from Tasks 1–2.
- Produces: `--meta` token, usable by any later task or future style work needing "in-content metadata" gray.

- [ ] **Step 1: Capture baseline screenshots**

Same Playwright flow as Task 1 Step 1 — open a project window and the résumé window, screenshot both at 1280×800 and 375×800, before this task's changes.

- [ ] **Step 2: Add the `--meta` token**

In `:root`, add (contrast-checked at 6.88:1–7.87:1 against every background it's used on below — see plan header's constraint on re-verifying if changed):

```css
  --meta: #a29cc7;
```

- [ ] **Step 3: Apply `--meta` to in-content metadata, keep `--dim` for OS chrome**

```css
/* .win-name — was: color: var(--dim); */
.win-name {
  margin-left: 6px;
  font-size: 11px;
  color: var(--meta);
  flex: 1;
}

/* .resume-station-period — was: color: var(--dim); */
.resume-station-period {
  font-size: 10.5px;
  color: var(--meta);
  margin: 0 0 4px;
}
```

Do **not** touch `.chrome-url`, `.taskbar`, `.btn.ghost`, or `.tb-zoom-btn`'s `color: var(--dim)` — those are outer "OS chrome" and stay on `--dim` per the spec's intent (content vs. chrome separation).

- [ ] **Step 4: Strengthen the project-title and summary hierarchy**

```css
/* .win-body h3 — was: margin: 4px 0; font-size: 17px; */
.win-body h3 {
  margin: 4px 0;
  font-size: 19px;
  font-weight: 700;
}

/* .summary — was: font-size: 13px; (weight/line-height/margin/color unchanged) */
.summary {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  color: var(--text-bright);
  margin: 8px 0 10px;
}
```

- [ ] **Step 5: Verify**

```bash
npm test
```

Expected: passes (CSS-only change).

Playwright: reopen the same project + résumé windows, screenshot at both breakpoints, and confirm: the project title and summary now read as a clearer two-step hierarchy (title noticeably bolder/larger than before), and `.win-name`/`.resume-station-period` read slightly lighter/warmer than the taskbar's gray without looking like a contrast regression.

- [ ] **Step 6: Commit**

```bash
git add assets/css/style.css
git commit -m "style: differentiate in-content metadata token, strengthen title hierarchy"
```

---

### Task 4: Visual depth — window panel gradient + dedicated "live" status token

**Files:**
- Modify: `assets/css/style.css` (`:root`, `.window`, `.status-badge`)

**Interfaces:**
- Consumes: nothing from Tasks 1–3.
- Produces: `--panel-deep` and `--success` tokens.

- [ ] **Step 1: Capture baseline screenshots**

Same Playwright flow — a project window (to see the status badge and panel), before this task's changes, at both breakpoints.

- [ ] **Step 2: Add the two new tokens and lighten `--panel-2`**

```css
  --panel-2: #1a1330; /* was: #150f28 — lighter, for clearer title-bar/body separation */
  --panel-deep: #0b0916; /* new — darker step of --panel, for the window body gradient */
  --success: #34d399; /* new — status/"LIVE" indicator, separate from --teal's cluster meaning */
```

(`--panel-2` is an edit to the existing line; `--panel-deep` and `--success` are new lines, added anywhere in `:root`.)

- [ ] **Step 3: Give `.window` a subtle gradient body instead of a flat fill**

```css
/* .window — was: background: var(--panel); (every other declaration unchanged) */
.window {
  pointer-events: auto;
  width: 380px;
  max-width: 100%;
  max-height: calc(100vh - 48px);
  background: linear-gradient(180deg, var(--panel), var(--panel-deep));
  border: 1px solid rgba(167, 139, 250, .4);
  border-radius: 9px;
  box-shadow: 0 26px 60px rgba(0, 0, 0, .6), 0 0 30px rgba(167, 139, 250, .12);
  overflow: hidden;
}
```

- [ ] **Step 4: Split the "LIVE" status color from the cluster-semantic teal**

```css
/* .status-badge — was: color: #0b2e2a; background: var(--teal); */
.status-badge {
  display: inline-block;
  font-size: 9.5px;
  color: #0b2e1f;
  background: var(--success);
  border-radius: 4px;
  padding: 2px 6px;
  font-weight: 700;
  margin: 0 0 6px;
}
```

(Contrast pre-checked: `#0b2e1f` on `#34d399` = 7.67:1.)

- [ ] **Step 5: Verify**

```bash
npm test
```

Expected: passes.

Playwright: reopen a project window at both breakpoints, screenshot, and confirm: the window body now has a faint top-to-bottom depth gradient (not flat), the title bar reads as clearly its own band, and the "● LIVE" badge is now green rather than teal (and a violet- or amber-cluster project's badge no longer visually implies "cloud cluster").

- [ ] **Step 6: Commit**

```bash
git add assets/css/style.css
git commit -m "style: add window body gradient and dedicated success/live status token"
```

---

### Task 5: Desktop vignette + fine noise texture

**Files:**
- Modify: `assets/css/style.css` (`.desktop`)

**Interfaces:**
- Consumes: nothing from Tasks 1–4.
- Produces: nothing consumed elsewhere — purely additive background layers on `.desktop`.

- [ ] **Step 1: Capture baseline screenshots**

Playwright: navigate to the site with the boot screen skipped (click/press a key to skip, per existing boot behavior) so the graph scene is fully revealed, screenshot the empty desktop (no window open) at 1280×800 and 375×800.

- [ ] **Step 2: Add the vignette + noise layers to `.desktop`'s background**

```css
/* .desktop — was: background: linear-gradient(180deg, var(--bg-mid), var(--bg-deep) 75%); */
.desktop {
  position: relative;
  flex: 1 1 auto;
  overflow: hidden;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, .35) 100%),
    linear-gradient(180deg, var(--bg-mid), var(--bg-deep) 75%);
}
```

This layers, from front to back: a ~5%-opacity white noise tile (120×120px, repeats automatically — `background-repeat` defaults to `repeat`), a radial vignette that darkens the corners by up to 35% black while leaving the center 60% untouched, then the existing base gradient unchanged.

- [ ] **Step 3: Verify the effect actually registers — this is the step the prior redesign skipped**

```bash
npm test
```

Expected: passes (CSS-only).

Playwright: hard-refresh, skip the boot screen, screenshot the empty desktop at both breakpoints again. Compare side-by-side against Step 1's screenshots:
- The corners/edges should be visibly darker than the center — if you cannot tell the difference at a glance, increase the vignette's `rgba(0, 0, 0, .35)` alpha (try `.45`) and re-screenshot.
- The noise should be visible as a very fine grain when viewed at full resolution but must not read as banding, dithering artifacts, or a rendering glitch — if it looks like static/glitch rather than film-grain-like texture, lower the `feColorMatrix` alpha value (last row, currently `0.05`) to `0.03`, or raise it to `0.07` if it's imperceptible. Do not leave this step until the difference is clearly visible in the screenshot comparison, per the constraint above.
- Confirm the graph nodes, orbit rings, and starfield are all still fully legible on top of the new background layers (nothing should look muddier or lower-contrast than before).

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css
git commit -m "style: add subtle vignette and noise texture to the desktop background"
```

---

### Task 6: Final cross-check against the spec

**Files:**
- None modified — verification only. (If this task finds a regression, fix it in `assets/css/style.css` or `assets/js/window-manager.js` and note the fix in the commit message.)

**Interfaces:**
- Consumes: the full state of `assets/css/style.css` and `assets/js/window-manager.js` after Tasks 1–5.

- [ ] **Step 1: Run the full automated test suite one more time**

```bash
npm test
```

Expected: all tests pass (unchanged count from before this plan started).

- [ ] **Step 2: Full-scene Playwright pass at both breakpoints**

Navigate through the whole flow at both 1280×800 and 375×800: boot screen (let it play and also test skipping it), empty desktop, hovering/opening a project window from each cluster (amber/teal/violet), opening the résumé window, opening the second-brain chat window, expanding both toggles. Screenshot each state. Confirm:
- No horizontal scrollbar appears at 375px.
- The `.win-close` and `.tb-zoom-btn` hit areas are visibly larger without looking oversized relative to the rest of the taskbar/title bar.
- Text contrast still reads clearly on every background (chrome, taskbar, window body, status badge).

- [ ] **Step 3: Confirm the plan's non-goals held**

Grep to confirm no unintended changes:

```bash
grep -n "violet\|teal\|amber" assets/css/style.css | grep -v "var(--" 
```

Expected: no output beyond the three original `:root` hex definitions themselves (i.e., no new raw violet/teal/amber hex values were introduced elsewhere) — confirms cluster hues weren't touched. Also confirm `font-family` lines in `style.css` are unchanged from before this plan (Segoe UI / Cascadia Code only).

- [ ] **Step 4: Confirm reduced-motion still suppresses every new transition**

Using Playwright's reduced-motion emulation (or `browser_evaluate` to check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` after forcing the OS/browser setting), re-test the tech-details and résumé-extra toggles: content should appear/disappear instantly, with no grid-rows/opacity animation.

- [ ] **Step 5: Final commit (only if Step 2–4 surfaced a fix)**

```bash
git add assets/css/style.css assets/js/window-manager.js
git commit -m "fix: address visual regression found in final cross-check"
```

If no regressions were found, no commit is needed for this task — it closes the plan.
