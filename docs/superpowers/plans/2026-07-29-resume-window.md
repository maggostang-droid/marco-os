# Lebenslauf-Fenster (Marco-Stang-Klick) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking the Marco Stang center node opens a terminal-styled résumé window; clicking the "Ask-Marco Assistant" moon node opens the real embedded second-brain chat (swapping their current click targets).

**Architecture:** Single-window model stays as-is (`state.activeProjectId`, one window at a time). A new sentinel `RESUME_ID` joins the existing `SECOND_BRAIN_CHAT_ID` sentinel. `window-manager.js` gets a third render branch. `scene.js`'s click handlers are reassigned, and a new pure helper resolves either sentinel back to the real graph node it visually belongs to (needed for correct zoom/dim behavior once the chat sentinel no longer belongs to the center node).

**Tech Stack:** Vanilla JS (ES modules), no build step, `node --test` for unit tests, plain static hosting (GitHub Pages, deploy from branch).

## Global Constraints

- No new npm dependencies, no server-side code, no build step (per `CLAUDE.md`).
- No raw phone number or email address (yours or the reference's) may appear in rendered HTML text — only inside the downloadable PDF, which is a deliberate user-initiated download, not passively crawled text.
- Reuse existing CSS/markup patterns (`.win-title`, `.win-body`, `.prompt`, `.tag`, `.btn`/`.btn-row`) rather than inventing a parallel visual language.
- `npm test` must stay green after every task.
- Verify manually in-browser at 375px and 1280px+ widths before calling this done (per `CLAUDE.md`'s stated verification convention).

---

### Task 1: `RESUME_ID` sentinel and node-id resolution helper in `state.js`

**Files:**
- Modify: `assets/js/state.js:11-19` (add `RESUME_ID`, keep `SECOND_BRAIN_CHAT_ID`)
- Modify: `assets/js/state.js` (add `resolveFocusedNodeId` function, anywhere after the sentinel constants)
- Test: `tests/state.test.js`

**Interfaces:**
- Produces: `export const RESUME_ID = "__resume__"` (string constant)
- Produces: `export function resolveFocusedNodeId(activeProjectId: string|null): string|null` — maps a sentinel back to the real `graph-layout.js` node id it visually represents (`RESUME_ID` → `"center"`, `SECOND_BRAIN_CHAT_ID` → `"second-brain"`, anything else passes through unchanged, `null`/falsy → `null`). Consumed by Task 4 (`scene.js`).

- [ ] **Step 1: Write the failing tests**

Add to `tests/state.test.js` (near the existing `SECOND_BRAIN_CHAT_ID` tests at the bottom):

```js
import { state, subscribe, completeBoot, focusProject, closeWindow, resetState, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID, RESUME_ID, resolveFocusedNodeId } from "../assets/js/state.js";
```

(replace the existing import line at the top of the file with this one — it just adds `RESUME_ID` and `resolveFocusedNodeId` to the existing import list)

```js
test("RESUME_ID is a stable, non-empty identifier distinct from SECOND_BRAIN_CHAT_ID", () => {
  assert.equal(RESUME_ID, "__resume__");
  assert.notEqual(RESUME_ID, SECOND_BRAIN_CHAT_ID);
});

test("focusProject accepts the resume sentinel id like any other id", () => {
  resetState();
  focusProject(RESUME_ID);
  assert.equal(state.activeProjectId, RESUME_ID);
});

test("resolveFocusedNodeId maps RESUME_ID to the center node", () => {
  assert.equal(resolveFocusedNodeId(RESUME_ID), "center");
});

test("resolveFocusedNodeId maps SECOND_BRAIN_CHAT_ID to the second-brain moon node", () => {
  assert.equal(resolveFocusedNodeId(SECOND_BRAIN_CHAT_ID), "second-brain");
});

test("resolveFocusedNodeId passes through a real project id unchanged", () => {
  assert.equal(resolveFocusedNodeId("sql-agent"), "sql-agent");
});

test("resolveFocusedNodeId returns null for a null/empty input", () => {
  assert.equal(resolveFocusedNodeId(null), null);
  assert.equal(resolveFocusedNodeId(""), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `RESUME_ID`/`resolveFocusedNodeId` are not exported yet (`undefined` comparisons / import errors).

- [ ] **Step 3: Implement in `state.js`**

Change the sentinel comment block and constant (currently lines 7-13):

```js
// Deliberately not a plausible data/projects.js id (those are always plain
// kebab-case repo-name strings, e.g. "sql-agent" — this repo *has* a real
// project literally id'd "second-brain", so a bare "second-brain" sentinel
// would collide with it and hijack that project's own window).
export const SECOND_BRAIN_CHAT_ID = "__second-brain-chat__";

// Same reasoning as SECOND_BRAIN_CHAT_ID above — the résumé window isn't a
// real data/projects.js entry either, so it needs its own collision-proof id.
export const RESUME_ID = "__resume__";
```

Add this function after `resetState()` at the bottom of the file:

```js
// SECOND_BRAIN_CHAT_ID and RESUME_ID are UI sentinels, not real
// graph-layout.js node ids — the résumé "lives" at the center node, the chat
// "lives" at the second-brain moon node (see data/projects.js's
// orbitsCenter entry). scene.js needs the *real* node id a sentinel
// represents to correctly zoom/dim the right graph node — this is that
// mapping, kept here (next to the sentinels themselves) so the two can't
// drift apart.
export function resolveFocusedNodeId(activeProjectId) {
  if (!activeProjectId) return null;
  if (activeProjectId === RESUME_ID) return "center";
  if (activeProjectId === SECOND_BRAIN_CHAT_ID) return "second-brain";
  return activeProjectId;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests including the six new ones.

- [ ] **Step 5: Commit**

```bash
git add assets/js/state.js tests/state.test.js
git commit -m "feat: add RESUME_ID sentinel and resolveFocusedNodeId helper"
```

---

### Task 2: Résumé content data (`data/resume.js`)

**Files:**
- Create: `data/resume.js`
- Test: `tests/resume.test.js`

**Interfaces:**
- Produces: `export const resume = { name, headline, intro, currentStations, skills, extendedHistory, pdfUrl }` — consumed by Task 5 (`window-manager.js`).
  - `name: string`, `headline: string`, `intro: string`
  - `currentStations: Array<{ role: string, org: string, period: string, bullets: string[] }>`
  - `skills: string[]`
  - `extendedHistory: string[]` (each entry a pre-formatted display line, no further structure needed)
  - `pdfUrl: string` (relative path to the downloadable PDF)

- [ ] **Step 1: Write the failing test**

Create `tests/resume.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { resume } from "../data/resume.js";

test("resume has the required top-level fields", () => {
  const requiredFields = ["name", "headline", "intro", "currentStations", "skills", "extendedHistory", "pdfUrl"];
  for (const field of requiredFields) {
    assert.ok(field in resume, `resume is missing "${field}"`);
  }
});

test("currentStations is a non-empty array of well-formed stations", () => {
  assert.ok(Array.isArray(resume.currentStations));
  assert.ok(resume.currentStations.length > 0);
  for (const station of resume.currentStations) {
    assert.equal(typeof station.role, "string");
    assert.equal(typeof station.org, "string");
    assert.equal(typeof station.period, "string");
    assert.ok(Array.isArray(station.bullets) && station.bullets.length > 0);
  }
});

test("skills is a non-empty array of strings", () => {
  assert.ok(Array.isArray(resume.skills));
  assert.ok(resume.skills.length > 0);
  for (const skill of resume.skills) assert.equal(typeof skill, "string");
});

test("extendedHistory is a non-empty array of strings", () => {
  assert.ok(Array.isArray(resume.extendedHistory));
  assert.ok(resume.extendedHistory.length > 0);
  for (const line of resume.extendedHistory) assert.equal(typeof line, "string");
});

test("pdfUrl is a relative path ending in .pdf", () => {
  assert.equal(typeof resume.pdfUrl, "string");
  assert.ok(resume.pdfUrl.endsWith(".pdf"));
  assert.ok(!resume.pdfUrl.startsWith("/"), "pdfUrl should be relative so it works under any base path");
});

test("no rendered field contains a raw phone number or email address", () => {
  const haystack = JSON.stringify(resume);
  assert.ok(!/@/.test(haystack), "resume data must not contain an email address");
  assert.ok(!/0176|t-online/.test(haystack), "resume data must not contain the phone number or personal email domain");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../data/resume.js'`.

- [ ] **Step 3: Create `data/resume.js`**

```js
export const resume = {
  name: "Dr.-Ing. Marco Stang",
  headline: "KI-Spezialist & Data Scientist",
  intro:
    "Dr.-Ing. mit über 10 Jahren Erfahrung in Entwicklung, Validierung und " +
    "Operationalisierung von KI- und Data-Science-Lösungen. Fokus auf Machine " +
    "Learning, Deep Learning und generative KI.",
  currentStations: [
    {
      role: "Solution Architect",
      org: "ILI.DIGITAL AG",
      period: "10.2025–05.2026",
      bullets: [
        "Leitung von Projektteams, Requirements-Workshops, Lösungsarchitekturen",
        "LLM-Datenextraktionspipelines auf AWS & Azure",
        "Entwicklung von maika.digital (KI-Abrechnungsassistent, RAG-System)"
      ]
    },
    {
      role: "Promotion Dr.-Ing., Note \u201eSehr gut\u201c",
      org: "KIT / ITIV",
      period: "10.2019–05.2025",
      bullets: [
        "Dissertationsthema: Validierung von KI-Systemen durch Szenarien-Verknüpfung und metamorphes Testen",
        "Industriekooperation mit Mercedes-Benz AG (Autonomous Comfort)"
      ]
    }
  ],
  skills: [
    "Python",
    "Machine Learning",
    "Deep Learning",
    "LLM/RAG",
    "Agentische Workflows",
    "TensorFlow",
    "React",
    "FastAPI",
    "AWS",
    "Azure",
    "Docker",
    "n8n",
    "Power Automate",
    "C++",
    "Projektleitung"
  ],
  extendedHistory: [
    "Data-Scientist FZI, Future Bus mit Daimler Trucks (09.2015–12.2016)",
    "Lehre: AMALEA-Kursentwicklung, Übungsleiter Software Engineering",
    "Studium: M.Sc. Elektro-/Informationstechnik KIT (Note 1.7), Auslandspraktikum INIT AG (USA)",
    "Sprachen: Deutsch (Muttersprache), Englisch (verhandlungssicher)",
    "Referenz: auf Anfrage"
  ],
  pdfUrl: "assets/docs/lebenslauf-marco-stang.pdf"
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `resume.test.js` cases green.

- [ ] **Step 5: Commit**

```bash
git add data/resume.js tests/resume.test.js
git commit -m "feat: add structured résumé data"
```

---

### Task 3: Add the downloadable résumé PDF asset

**Files:**
- Create: `assets/docs/lebenslauf-marco-stang.pdf` (binary copy)

**Interfaces:**
- Produces: a static file served at the relative path `assets/docs/lebenslauf-marco-stang.pdf`, which `data/resume.js`'s `pdfUrl` (Task 2) and `window-manager.js`'s download button (Task 5) both reference by that exact path.

- [ ] **Step 1: Create the target directory and copy the file**

```bash
mkdir -p assets/docs
cp "../Unterlagen_Marco/Lebenslauf_Marco_Stang.pdf" "assets/docs/lebenslauf-marco-stang.pdf"
```

(Run from the repo root, `c:/Users/Marco/OneDrive/02_Portfolio/marco-os` — `Unterlagen_Marco` is a sibling directory one level up, at `c:/Users/Marco/OneDrive/02_Portfolio/Unterlagen_Marco/Lebenslauf_Marco_Stang.pdf`.)

- [ ] **Step 2: Verify the copy**

```bash
ls -la assets/docs/lebenslauf-marco-stang.pdf
```

Expected: file exists, size matches the source (~1.2MB), non-zero.

- [ ] **Step 3: Commit**

```bash
git add assets/docs/lebenslauf-marco-stang.pdf
git commit -m "chore: add résumé PDF for download"
```

---

### Task 4: Reassign click targets and fix focus/dim resolution in `scene.js`

**Files:**
- Modify: `assets/js/scene.js:2` (import)
- Modify: `assets/js/scene.js:68-117` (`render()` — focus/translate calc + call sites)
- Modify: `assets/js/scene.js:139-163` (`buildOrbitLayer` — param rename only)
- Modify: `assets/js/scene.js:165-256` (`buildEdgeLayer` — param rename + dim check)
- Modify: `assets/js/scene.js:268-341` (`buildNodeLayer` — center + moon click/aria logic)

**Interfaces:**
- Consumes: `RESUME_ID`, `SECOND_BRAIN_CHAT_ID`, `resolveFocusedNodeId` from `./state.js` (Task 1)
- Produces: no new exports — internal behavior change only, verified by manual browser check in Task 8 (this file has no existing unit test coverage; `graph-layout.js`, which it depends on, is already covered separately).

This task has no isolated unit test (scene.js is DOM-rendering code with no existing test harness, consistent with the rest of the file) — correctness is verified by the manual browser pass in Task 8, plus keeping `npm test` green throughout (no pure-logic regressions).

- [ ] **Step 1: Update the import**

In `assets/js/scene.js`, change line 2 from:

```js
import { subscribe, state, focusProject, closeWindow, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID } from "./state.js";
```

to:

```js
import { subscribe, state, focusProject, closeWindow, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID, RESUME_ID, resolveFocusedNodeId } from "./state.js";
```

- [ ] **Step 2: Fix focus/translate resolution in `render()`**

Replace this block (currently lines 72-86):

```js
    const focusedProjectId = state.activeProjectId;

    // When the chat window is open, focusedProjectId is SECOND_BRAIN_CHAT_ID
    // (truthy), so FOCUS_ZOOM_BONUS still applies here — but that sentinel
    // matches no entry in nodesById, so focusedNode below is null and the
    // translate stays (0,0). Because the center node itself sits at (0,0),
    // this accidentally produces the desired "zoom in on Marco, dim the rest"
    // effect without focusedNode ever actually resolving to the center node.
    // Not deliberate — don't "fix" this into computing a real focusedNode for
    // the sentinel without checking it doesn't change the translate math.
    const effectiveZoom = state.zoomLevel * (focusedProjectId ? FOCUS_ZOOM_BONUS : 1);
    const focusedNode = focusedProjectId ? nodesById[focusedProjectId] : null;
    const translateX = focusedNode ? -focusedNode.x * effectiveZoom : 0;
    const translateY = focusedNode ? -focusedNode.y * effectiveZoom : 0;
    viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${effectiveZoom})`;
```

with:

```js
    const focusedProjectId = state.activeProjectId;
    // RESUME_ID and SECOND_BRAIN_CHAT_ID are UI sentinels, not real
    // graph-layout.js node ids — résumé "lives" at the center node, chat
    // "lives" at the second-brain moon node. Resolve to the real node id
    // before using it for zoom-centering or dimming, so e.g. opening the
    // chat (now reached via the moon, not the center) zooms in on and
    // un-dims the moon, not the center.
    const focusedNodeId = resolveFocusedNodeId(focusedProjectId);

    const effectiveZoom = state.zoomLevel * (focusedProjectId ? FOCUS_ZOOM_BONUS : 1);
    const focusedNode = focusedNodeId ? nodesById[focusedNodeId] : null;
    const translateX = focusedNode ? -focusedNode.x * effectiveZoom : 0;
    const translateY = focusedNode ? -focusedNode.y * effectiveZoom : 0;
    viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${effectiveZoom})`;
```

- [ ] **Step 3: Pass the resolved id into the three build\* functions**

Change (currently lines 109-111):

```js
    content.appendChild(buildOrbitLayer(rings, nodeBatchCount, focusedProjectId));
    content.appendChild(buildEdgeLayer(edges, nodesById, focusedProjectId, nodeBatchCount, projectById));
    content.appendChild(buildNodeLayer(nodes, projects, focusedProjectId));
```

to:

```js
    content.appendChild(buildOrbitLayer(rings, nodeBatchCount, focusedNodeId));
    content.appendChild(buildEdgeLayer(edges, nodesById, focusedNodeId, nodeBatchCount, projectById));
    content.appendChild(buildNodeLayer(nodes, projects, focusedNodeId));
```

- [ ] **Step 4: Rename the parameter through `buildOrbitLayer`, `buildEdgeLayer`, `buildNodeLayer`**

In `buildOrbitLayer(rings, nodeBatchCount, focusedProjectId)` — rename the parameter to `focusedNodeId` (signature and its one usage `if (focusedProjectId) ellipse.classList.add("is-dimmed");` → `if (focusedNodeId) ellipse.classList.add("is-dimmed");`). Behavior is unchanged (still just a truthiness check), this is a rename for clarity only.

In `buildEdgeLayer(edges, nodesById, focusedProjectId, nodeBatchCount, projectById)` — rename the parameter to `focusedNodeId` and update its one comparison:

```js
    if (focusedProjectId && edge.to !== focusedProjectId) line.classList.add("is-dimmed");
```

to:

```js
    if (focusedNodeId && edge.to !== focusedNodeId) line.classList.add("is-dimmed");
```

In `buildNodeLayer(nodes, projects, focusedProjectId)` — rename the parameter to `focusedNodeId` and update:

```js
    if (isProject && focusedProjectId && node.id !== focusedProjectId) el.classList.add("is-dimmed");
```

to:

```js
    if (isProject && focusedNodeId && node.id !== focusedNodeId) el.classList.add("is-dimmed");
```

- [ ] **Step 5: Reassign the center node's click target to the résumé**

Inside `buildNodeLayer`, in the `if (node.type === "center") { ... }` branch, change:

```js
      el.setAttribute("aria-expanded", String(state.activeProjectId === SECOND_BRAIN_CHAT_ID));
      el.setAttribute("aria-label", "Marco Stang — Chat mit second-brain öffnen");
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
      el.addEventListener("click", () => focusProject(SECOND_BRAIN_CHAT_ID));
```

to:

```js
      el.setAttribute("aria-expanded", String(state.activeProjectId === RESUME_ID));
      el.setAttribute("aria-label", "Marco Stang — Lebenslauf öffnen");
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
      el.addEventListener("click", () => focusProject(RESUME_ID));
```

- [ ] **Step 6: Reassign the "second-brain" moon node's click target to the chat**

Still inside `buildNodeLayer`, in the `else { ... }` branch (non-center nodes), change:

```js
      if (node.tier !== "moon") el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(node.id === state.activeProjectId));
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><span class="node-label" style="transition-delay: ${labelDelay}">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(node.id));
```

to:

```js
      if (node.tier !== "moon") el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      // The "second-brain" data/projects.js entry (title "Ask-Marco
      // Assistant") is rendered as a moon orbiting Marco. Clicking it opens
      // the real embedded chat (SECOND_BRAIN_CHAT_ID) instead of its own
      // generic project card — the chat now lives at the node whose name
      // ("Ask-Marco") actually promises it, freeing the center node for the
      // résumé. focusedNodeId is already resolved (see render()), so it
      // reads as "second-brain" whenever the chat is open, matching node.id
      // directly here.
      const clickTargetId = node.id === "second-brain" ? SECOND_BRAIN_CHAT_ID : node.id;
      el.setAttribute("aria-expanded", String(node.id === focusedNodeId));
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><span class="node-label" style="transition-delay: ${labelDelay}">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(clickTargetId));
```

- [ ] **Step 7: Syntax check and run the test suite**

Run: `node --check assets/js/scene.js`
Expected: no output (valid syntax).

Run: `npm test`
Expected: PASS — no test in the suite touches `scene.js` directly, so this just confirms nothing else broke.

- [ ] **Step 8: Commit**

```bash
git add assets/js/scene.js
git commit -m "feat: center node opens résumé, Ask-Marco moon opens the chat"
```

---

### Task 5: Résumé window markup in `window-manager.js`

**Files:**
- Modify: `assets/js/window-manager.js:1` (import)
- Modify: `assets/js/window-manager.js:8` (`initWindowManager` signature)
- Modify: `assets/js/window-manager.js:51-57` (`render()` branch dispatch)
- Modify: `assets/js/window-manager.js` (add `buildResumeWindow` and `wireResumeWindowInteractions` functions, near `buildChatWindow`)
- Modify: `assets/js/main.js:1,16` (import résumé data, pass into `initWindowManager`)

**Interfaces:**
- Consumes: `RESUME_ID` from `./state.js` (Task 1), `resume` from `../../data/resume.js` (Task 2), `escapeHtml` from `./html-utils.js` (existing)
- Produces: no new exports — `initWindowManager(container, projects, resume)` gains a third parameter; `main.js` is the only other caller and is updated in this same task so the signature change lands atomically.

- [ ] **Step 1: Wire `resume` data through `main.js`**

In `assets/js/main.js`, change the import block (line 1) from:

```js
import { projects } from "../../data/projects.js";
```

to:

```js
import { projects } from "../../data/projects.js";
import { resume } from "../../data/resume.js";
```

and change line 16 from:

```js
  initWindowManager(document.querySelector("#window-layer"), projects);
```

to:

```js
  initWindowManager(document.querySelector("#window-layer"), projects, resume);
```

- [ ] **Step 2: Update `window-manager.js`'s imports and function signature**

Change line 1 from:

```js
import { subscribe, state, closeWindow, SECOND_BRAIN_CHAT_ID } from "./state.js";
```

to:

```js
import { subscribe, state, closeWindow, SECOND_BRAIN_CHAT_ID, RESUME_ID } from "./state.js";
```

Change line 8 from:

```js
export function initWindowManager(container, projects) {
```

to:

```js
export function initWindowManager(container, projects, resume) {
```

- [ ] **Step 3: Branch on `RESUME_ID` in `render()`**

Change (currently lines 51-57):

```js
    const isChat = activeId === SECOND_BRAIN_CHAT_ID;
    const { win, closeBtn } = isChat ? buildChatWindow() : buildProjectWindow(projectById[activeId]);

    closeBtn.addEventListener("click", closeWindow);
    if (!isChat) wireProjectWindowInteractions(win);

    container.appendChild(win);
```

to:

```js
    const isChat = activeId === SECOND_BRAIN_CHAT_ID;
    const isResume = activeId === RESUME_ID;
    const { win, closeBtn } = isChat
      ? buildChatWindow()
      : isResume
        ? buildResumeWindow(resume)
        : buildProjectWindow(projectById[activeId]);

    closeBtn.addEventListener("click", closeWindow);
    if (isResume) wireResumeWindowInteractions(win);
    if (!isChat && !isResume) wireProjectWindowInteractions(win);

    container.appendChild(win);
```

- [ ] **Step 4: Add `buildResumeWindow` and `wireResumeWindowInteractions`**

Add these two functions after `buildChatWindow` (end of file):

```js
function buildResumeWindow(resume) {
  const stationsHtml = resume.currentStations
    .map(
      (station) => `
        <div class="resume-station">
          <p class="resume-station-header">${escapeHtml(station.role)} | ${escapeHtml(station.org)}</p>
          <p class="resume-station-period">${escapeHtml(station.period)}</p>
          <ul class="resume-bullets">${station.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
        </div>
      `
    )
    .join("");
  const skillsHtml = resume.skills.map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`).join("");
  const extraHtml = resume.extendedHistory.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const win = document.createElement("div");
  win.className = "window window--resume";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "Lebenslauf");
  win.innerHTML = `
    <div class="win-title">
      <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
      <span class="win-name">app://lebenslauf — Terminal</span>
      <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
    </div>
    <div class="win-body">
      <p class="prompt">marco@portfolio:~$ cat lebenslauf.txt</p>
      <h3>${escapeHtml(resume.name)}</h3>
      <p class="resume-headline">${escapeHtml(resume.headline)}</p>
      <p class="resume-intro">${escapeHtml(resume.intro)}</p>
      ${stationsHtml}
      <div class="tags">${skillsHtml}</div>
      <button type="button" class="resume-toggle" aria-expanded="false">▸ Vollständigen Werdegang anzeigen</button>
      <ul class="resume-extra" hidden>${extraHtml}</ul>
      <div class="btn-row">
        <a class="btn primary" href="${resume.pdfUrl}" target="_blank" rel="noopener" download>Vollständigen Lebenslauf laden (PDF)</a>
      </div>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}

function wireResumeWindowInteractions(win) {
  const toggle = win.querySelector(".resume-toggle");
  const extra = win.querySelector(".resume-extra");
  toggle.addEventListener("click", () => {
    const expanding = extra.hidden;
    extra.hidden = !expanding;
    toggle.setAttribute("aria-expanded", String(expanding));
    toggle.textContent = expanding ? "▾ Vollständigen Werdegang verbergen" : "▸ Vollständigen Werdegang anzeigen";
  });
}
```

- [ ] **Step 5: Syntax check and run the test suite**

Run: `node --check assets/js/window-manager.js && node --check assets/js/main.js`
Expected: no output (valid syntax).

Run: `npm test`
Expected: PASS — no existing test imports `window-manager.js` or `main.js` directly, so this confirms no regressions elsewhere.

- [ ] **Step 6: Commit**

```bash
git add assets/js/window-manager.js assets/js/main.js
git commit -m "feat: render résumé window content"
```

---

### Task 6: CSS for the résumé window

**Files:**
- Modify: `assets/css/style.css` (insert after the `.tag { ... }` block, currently ending at line 532, before `.btn-row`)

**Interfaces:**
- Consumes: existing custom properties `--teal`, `--dim` (defined in `:root`, line 1-11)
- Produces: `.window--resume`, `.resume-headline`, `.resume-intro`, `.resume-station`, `.resume-station-header`, `.resume-station-period`, `.resume-bullets`, `.resume-toggle`, `.resume-toggle:focus-visible`, `.resume-extra` — consumed by the markup Task 5 already wrote.

- [ ] **Step 1: Insert the new rules**

Insert immediately after the `.tag { ... }` block (right before `.btn-row {`):

```css
.window--resume {
  width: 460px;
}
.resume-headline {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .03em;
  color: var(--teal);
  margin: 0 0 6px;
}
.resume-intro {
  font-size: 12px;
  line-height: 1.6;
  color: #c9c5e8;
  margin: 0 0 14px;
}
.resume-station {
  margin: 0 0 12px;
}
.resume-station-header {
  font-size: 12.5px;
  font-weight: 600;
  color: #eae7fb;
  margin: 0 0 2px;
}
.resume-station-period {
  font-size: 10.5px;
  color: var(--dim);
  margin: 0 0 4px;
}
.resume-bullets {
  margin: 0 0 4px;
  padding-left: 16px;
  font-size: 11.5px;
  line-height: 1.5;
  color: #c9c5e8;
}
.resume-toggle {
  display: block;
  background: none;
  border: none;
  color: var(--teal);
  font-family: inherit;
  font-size: 11px;
  padding: 0;
  margin: 4px 0 8px;
  cursor: pointer;
}
.resume-toggle:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}
.resume-extra {
  margin: 0 0 12px;
  padding-left: 16px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #c9c5e8;
}
```

- [ ] **Step 2: Manual visual check**

Run: `python -m http.server 8000` (from the repo root), open `http://localhost:8000/`, hard-refresh (Ctrl+Shift+R), click Marco Stang. Expected: résumé window renders with visible headline/intro/stations/tags, toggle button and download button styled consistently with existing project windows (same panel background, border, font sizes in the same range).

- [ ] **Step 3: Commit**

```bash
git add assets/css/style.css
git commit -m "style: add résumé window layout rules"
```

---

### Task 7: Taskbar label for the résumé window

**Files:**
- Modify: `assets/js/taskbar.js:1` (import)
- Modify: `assets/js/taskbar.js:25-30` (label logic)

**Interfaces:**
- Consumes: `RESUME_ID` from `./state.js` (Task 1)
- Produces: no new exports — internal rendering change only.

- [ ] **Step 1: Update the import**

Change line 1 from:

```js
import { subscribe, state, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID } from "./state.js";
```

to:

```js
import { subscribe, state, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID, RESUME_ID } from "./state.js";
```

- [ ] **Step 2: Add the résumé chip/label case**

Change (currently lines 25-30):

```js
  function renderTaskbar() {
    // The chat window's activeProjectId is the SECOND_BRAIN_CHAT_ID sentinel,
    // not a real data/projects.js id, so it never matches projectById — special-
    // case it here rather than letting the chip silently disappear.
    const isChatOpen = state.activeProjectId === SECOND_BRAIN_CHAT_ID;
    const project = state.activeProjectId && !isChatOpen ? projectById[state.activeProjectId] : null;
```

to:

```js
  function renderTaskbar() {
    // The chat/résumé windows' activeProjectId is a sentinel, not a real
    // data/projects.js id, so it never matches projectById — special-case
    // both here rather than letting the chip silently disappear.
    const isChatOpen = state.activeProjectId === SECOND_BRAIN_CHAT_ID;
    const isResumeOpen = state.activeProjectId === RESUME_ID;
    const project = state.activeProjectId && !isChatOpen && !isResumeOpen ? projectById[state.activeProjectId] : null;
```

Then change the taskbar chip markup line:

```js
      ${isChatOpen ? `<span class="tb-app">second-brain.exe</span>` : project ? `<span class="tb-app">${project.id}.exe</span>` : ""}
```

to:

```js
      ${isChatOpen ? `<span class="tb-app">second-brain.exe</span>` : isResumeOpen ? `<span class="tb-app">lebenslauf.exe</span>` : project ? `<span class="tb-app">${project.id}.exe</span>` : ""}
```

- [ ] **Step 3: Syntax check and run the test suite**

Run: `node --check assets/js/taskbar.js`
Expected: no output.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add assets/js/taskbar.js
git commit -m "feat: show a taskbar chip for the résumé window"
```

---

### Task 8: Correct the stale "second-brain" project copy, then full manual verification

**Files:**
- Modify: `data/projects.js:147` (last sentence of the `second-brain` entry's `description`)
- Test: `tests/projects.test.js` (no change needed — existing tests already cover required fields; this step just re-runs them)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing new — copy correction plus the final end-to-end manual verification pass for the whole feature.

- [ ] **Step 1: Fix the stale sentence**

In `data/projects.js`, the `second-brain` entry's `description` field currently ends with (line ~147):

```js
      "kann. Live und erreichbar über den Marco-Zentrum-Knoten in der Graph-Ansicht.",
```

Change it to:

```js
      "kann. Live und erreichbar über den Ask-Marco-Mond-Knoten in der Graph-Ansicht.",
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — every test file green, including the new `resume.test.js` and the extended `state.test.js`.

- [ ] **Step 3: Manual browser verification**

Run: `python -m http.server 8000` from the repo root, open `http://localhost:8000/`, hard-refresh (Ctrl+Shift+R). At both 375px and 1280px+ browser widths:

1. Click "Marco Stang" (center node) → the résumé window opens (`app://lebenslauf — Terminal`), showing name/headline/intro/two current stations/skills tags/toggle button/download button, no raw phone number or email visible anywhere in the window.
2. Click "▸ Vollständigen Werdegang anzeigen" → the extended history list expands, button label flips to "▾ … verbergen"; click again to collapse.
3. Click "Vollständigen Lebenslauf laden (PDF)" → the PDF opens/downloads correctly.
4. Close the résumé window (× or Escape), click the "Ask-Marco Assistant" moon node (small node orbiting close to Marco) → the real embedded chat window opens (`app://second-brain — Terminal`, iframe loads `second-brain-projects.streamlit.app`).
5. With the chat open, confirm the moon node is NOT visually dimmed (it's the focused node) and the view has zoomed toward the moon's position, not toward Marco's center.
6. Click the taskbar chip while each window is open → confirms `lebenslauf.exe` and `second-brain.exe` labels respectively, and clicking a background area or pressing Escape closes the open window.
7. Click any other planet node (a normal project) → confirms normal project windows still open correctly and are unaffected by this change.

- [ ] **Step 4: Commit**

```bash
git add data/projects.js
git commit -m "fix: correct stale second-brain reachability copy"
```
