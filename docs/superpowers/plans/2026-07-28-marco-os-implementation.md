# marco-os Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build marco-os — a static single-page site presenting Marco Stang's KI-Portfolio as a "MARCO.OS" terminal desktop whose background is a live neural-network graph; clicking a project node opens a terminal window with that project's details.

**Architecture:** Plain HTML/CSS/Vanilla-JS (ES modules), no build tool, no framework. A single central state object (`assets/js/state.js`) drives three independent renderers (graph scene, project window, taskbar) via a subscribe/notify pattern. Node positions are computed by a pure, unit-tested layout function — no hardcoded per-project coordinates.

**Tech Stack:** HTML5, CSS3 (custom properties, flexbox, CSS transforms — no SVG, no Canvas), Vanilla JS ES modules, Node's built-in `node:test` runner for unit tests, GitHub Pages ("Deploy from branch") for hosting.

## Global Constraints

- No build tool, no npm dependencies, no bundler — `package.json` exists only to declare `"type": "module"` for Node's ES module resolution.
- No Canvas/WebGL for the graph — real DOM/button elements for nodes so keyboard focus and screen readers work without extra ARIA plumbing.
- Exactly one project window open at a time — no multi-window manager.
- No classic list/fallback view — the scene itself must be fully keyboard-operable (Tab reaches every project node, Enter/Space opens it, Escape closes the open window).
- Creating the GitHub remote repo and enabling Pages deployment is explicitly **out of scope** for this plan (per the design spec's "Verhältnis zu stangfolio" / Tech-Architektur section) — this plan only produces a working local static site.
- Testing: `node --test` with real assertions for pure-logic modules (`graph-layout.js`, `state.js`); manual browser verification (375px and 1280px+) for DOM-rendering modules; `node --check` for syntax verification of every JS file.
- Data structure for `data/projects.js` must match stangfolio's existing shape exactly: `id`, `title`, `summary`, `description`, `tags`, `demoUrl`, `repoUrl`, `status` (optional `coldStartNote`).

---

### Task 1: Projekt-Grundgerüst, Manifest & Datenquelle

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `assets/css/style.css`
- Create: `data/projects.js`
- Test: `tests/projects.test.js`

**Interfaces:**
- Produces: `projects` (named export from `data/projects.js`) — array of objects `{ id: string, title: string, summary: string, description: string, tags: string[], demoUrl: string|null, repoUrl: string|null, status: string }`. All later tasks import this array.
- Produces: DOM containers in `index.html` that later tasks render into: `#boot-overlay`, `#scene`, `#window-layer`, `#taskbar`.

- [ ] **Step 1: Write the failing test**

Create `tests/projects.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { projects } from "../data/projects.js";

test("projects is a non-empty array", () => {
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length > 0);
});

test("every project has the required fields", () => {
  const requiredFields = [
    "id", "title", "summary", "description", "tags", "demoUrl", "repoUrl", "status"
  ];
  for (const project of projects) {
    for (const field of requiredFields) {
      assert.ok(field in project, `${project.id ?? "<unknown>"} is missing "${field}"`);
    }
    assert.ok(Array.isArray(project.tags), `${project.id} tags must be an array`);
  }
});

test("every project id is unique", () => {
  const ids = projects.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/projects.test.js`
Expected: FAIL — `Cannot find module '../data/projects.js'`

- [ ] **Step 3: Create the manifest**

Create `package.json`:

```json
{
  "name": "marco-os",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 4: Create the data source**

Create `data/projects.js`:

```js
export const projects = [
  {
    id: "sql-agent",
    title: "sql-agent",
    summary: "Text-to-SQL-Agent für Fachabteilungen ohne SQL-Kenntnisse.",
    description:
      "Fachabteilungen brauchen schnelle Antworten aus Firmendaten, aber die wenigsten " +
      "können SQL schreiben. sql-agent ist ein LangGraph-basierter Text-to-SQL-Agent, der " +
      "natürlichsprachige Fragen gegen eine echte PostgreSQL-Datenbank beantwortet — inklusive " +
      "Schema-Exploration, Guardrails (nur lesende SELECT-Queries, read-only DB-User) und einem " +
      "Selbstkorrektur-Loop bei fehlerhaften Queries.",
    tags: ["LangGraph", "LangChain", "Python", "PostgreSQL", "Streamlit"],
    demoUrl: null,
    repoUrl: "https://github.com/marco-stang/sql-agent",
    status: "coming-soon"
  },
  {
    id: "bi-dashboard-assistent",
    title: "BI-Dashboard-Assistent",
    summary: "Natürlichsprachige Abfragen gegen BI-Dashboards/KPIs statt manuellem Filtern.",
    description:
      "Idee: Fachabteilungen filtern und interpretieren Dashboards oft manuell, was Zeit kostet " +
      "und Rückfragen an BI-Teams erzeugt. Ziel ist ein Assistent, der Fragen in natürlicher Sprache " +
      "entgegennimmt und passende KPI-Ansichten oder Kennzahlen direkt liefert.",
    tags: ["Python", "Streamlit"],
    demoUrl: null,
    repoUrl: null,
    status: "planned"
  },
  {
    id: "rag-wissens-assistent",
    title: "RAG-Wissens-Assistent",
    summary: "Chatbot über interne Dokumente per Retrieval-Augmented Generation.",
    description:
      "Idee: Interne Dokumentation (Wikis, PDFs, Handbücher) ist oft schwer durchsuchbar. " +
      "Ziel ist ein Chatbot, der Fragen gegen eine Vektor-Datenbank aus internen Dokumenten " +
      "beantwortet und dabei Quellen mit angibt.",
    tags: ["LangChain", "Pinecone"],
    demoUrl: null,
    repoUrl: null,
    status: "planned"
  }
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/projects.test.js`
Expected: PASS (3 tests)

- [ ] **Step 6: Create the HTML skeleton**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MARCO.OS — KI-Portfolio von Marco Stang</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <div class="chrome">
    <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
    <span class="chrome-url">marcostang.dev</span>
  </div>
  <main class="desktop">
    <div id="boot-overlay" class="boot-overlay"></div>
    <div id="scene" class="scene"></div>
    <div id="window-layer" class="window-layer"></div>
  </main>
  <footer id="taskbar" class="taskbar"></footer>
  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 7: Create the base stylesheet**

Create `assets/css/style.css`:

```css
:root {
  --bg-deep: #06040d;
  --bg-mid: #0a0716;
  --violet: #a78bfa;
  --teal: #5eead4;
  --amber: #fbbf24;
  --dim: #8a86a8;
  --border: #2a2340;
  --panel: #0f0c1c;
  --panel-2: #150f28;
  --text: #e7e4f5;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  height: 100%;
}

body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-deep);
  color: var(--text);
  font-family: "Segoe UI", system-ui, sans-serif;
}

.chrome {
  flex: 0 0 auto;
  background: #140f24;
  border-bottom: 1px solid var(--border);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot--1 { background: #ff5f57; }
.dot--2 { background: #febc2e; }
.dot--3 { background: #28c840; }

.chrome-url {
  margin-left: 10px;
  background: #0b0817;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--dim);
  font-family: "Cascadia Code", "Consolas", ui-monospace, monospace;
}

.desktop {
  position: relative;
  flex: 1 1 auto;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, rgba(167, 139, 250, .14), transparent 60%),
    radial-gradient(ellipse at 85% 85%, rgba(94, 234, 212, .09), transparent 55%),
    linear-gradient(180deg, var(--bg-mid), var(--bg-deep) 75%);
}

.taskbar {
  flex: 0 0 auto;
  height: 42px;
  background: rgba(10, 14, 24, .9);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 12px;
  font-family: "Cascadia Code", "Consolas", ui-monospace, monospace;
  font-size: 11px;
  color: var(--dim);
}
```

- [ ] **Step 8: Manually verify in a browser**

Open `index.html` directly in a browser (double-click or `start index.html` on Windows).

Expected:
- Dark violet/teal gradient background fills the page, thin top chrome bar with 3 dots + "marcostang.dev" is visible, empty taskbar strip at the bottom.
- DevTools console shows exactly one error: a 404 for `assets/js/main.js` (expected — created in Task 4). No other errors.

- [ ] **Step 9: Commit**

```bash
git add package.json index.html assets/css/style.css data/projects.js tests/projects.test.js
git commit -m "feat: scaffold marco-os shell, manifest and project data"
```

---

### Task 2: Layout-Algorithmus (`graph-layout.js`)

**Files:**
- Create: `assets/js/graph-layout.js`
- Test: `tests/graph-layout.test.js`

**Interfaces:**
- Consumes: project objects shaped `{ id, tags, status, ... }` (from Task 1's `data/projects.js`; the function only reads `id`, `tags`, `status`).
- Produces: `computeLayout(projects, focusedProjectId = null) -> { nodes: Array<{id, type: "center"|"project"|"tag", tier?: "active"|"idea", label?: string, x: number, y: number}>, edges: Array<{from: string, to: string, kind: "active"|"idea"|"tag"}> }`. Task 4's `scene.js` consumes this directly.

- [ ] **Step 1: Write the failing tests**

Create `tests/graph-layout.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout } from "../assets/js/graph-layout.js";

test("returns only the center node when there are no projects", () => {
  const { nodes, edges } = computeLayout([]);
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].id, "center");
  assert.equal(edges.length, 0);
});

test("places one node and one edge per project", () => {
  const projects = [
    { id: "a", status: "coming-soon", tags: [] },
    { id: "b", status: "planned", tags: [] }
  ];
  const { nodes, edges } = computeLayout(projects);
  assert.equal(nodes.length, 3);
  assert.equal(edges.length, 2);
  assert.ok(nodes.some((n) => n.id === "a"));
  assert.ok(nodes.some((n) => n.id === "b"));
});

test("planned projects sit further from the center than active ones", () => {
  const projects = [
    { id: "active", status: "coming-soon", tags: [] },
    { id: "idea", status: "planned", tags: [] }
  ];
  const { nodes } = computeLayout(projects);
  const dist = (id) => {
    const node = nodes.find((n) => n.id === id);
    return Math.hypot(node.x, node.y);
  };
  assert.ok(dist("idea") > dist("active"));
});

test("renders tag nodes only for the focused project", () => {
  const projects = [
    { id: "a", status: "coming-soon", tags: ["Python", "SQL"] },
    { id: "b", status: "planned", tags: ["React"] }
  ];
  const { nodes } = computeLayout(projects, "a");
  assert.ok(nodes.some((n) => n.id === "a:Python"));
  assert.ok(nodes.some((n) => n.id === "a:SQL"));
  assert.ok(!nodes.some((n) => n.id === "b:React"));
});

test("base radius grows once there are more than three projects", () => {
  const makeProjects = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: `p${i}`, status: "coming-soon", tags: [] }));

  const distOfFirst = (count) => {
    const { nodes } = computeLayout(makeProjects(count));
    const node = nodes.find((n) => n.id === "p0");
    return Math.hypot(node.x, node.y);
  };

  assert.ok(distOfFirst(5) > distOfFirst(3));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/graph-layout.test.js`
Expected: FAIL — `Cannot find module '../assets/js/graph-layout.js'`

- [ ] **Step 3: Write the implementation**

Create `assets/js/graph-layout.js`:

```js
const BASE_RADIUS = 150;
const RADIUS_STEP_PER_EXTRA_PROJECT = 20;
const IDEA_RADIUS_MULTIPLIER = 1.35;
const TAG_RADIUS = 85;
const TAG_ANGLE_SPREAD = 0.35;

export function computeLayout(projects, focusedProjectId = null) {
  const nodes = [{ id: "center", type: "center", x: 0, y: 0 }];
  const edges = [];

  const count = projects.length;
  const baseRadius = BASE_RADIUS + Math.max(0, count - 3) * RADIUS_STEP_PER_EXTRA_PROJECT;

  projects.forEach((project, index) => {
    const angle = (2 * Math.PI * index) / Math.max(count, 1);
    const tier = project.status === "planned" ? "idea" : "active";
    const radius = tier === "idea" ? baseRadius * IDEA_RADIUS_MULTIPLIER : baseRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({ id: project.id, type: "project", tier, x, y });
    edges.push({ from: "center", to: project.id, kind: tier });

    if (project.id === focusedProjectId) {
      const tagCount = project.tags.length;
      project.tags.forEach((tag, tagIndex) => {
        const tagAngle = angle + (tagIndex - (tagCount - 1) / 2) * TAG_ANGLE_SPREAD;
        const tagX = x + Math.cos(tagAngle) * TAG_RADIUS;
        const tagY = y + Math.sin(tagAngle) * TAG_RADIUS;
        const tagId = `${project.id}:${tag}`;
        nodes.push({ id: tagId, type: "tag", label: tag, x: tagX, y: tagY });
        edges.push({ from: project.id, to: tagId, kind: "tag" });
      });
    }
  });

  return { nodes, edges };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/graph-layout.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Syntax-check**

Run: `node --check assets/js/graph-layout.js`
Expected: no output (success)

- [ ] **Step 6: Commit**

```bash
git add assets/js/graph-layout.js tests/graph-layout.test.js
git commit -m "feat: add radial graph layout algorithm"
```

---

### Task 3: Zentrales State-Modul (`state.js`)

**Files:**
- Create: `assets/js/state.js`
- Test: `tests/state.test.js`

**Interfaces:**
- Produces: `state` (mutable singleton object `{ bootComplete: boolean, activeProjectId: string|null }`), `subscribe(listener: (state) => void) -> unsubscribe: () => void`, `completeBoot()`, `focusProject(projectId: string)`, `closeWindow()`, `resetState()` (test-only reset helper). Tasks 4, 5, 6, 7 all import from this module and call `subscribe` to re-render on change.

- [ ] **Step 1: Write the failing tests**

Create `tests/state.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { state, subscribe, completeBoot, focusProject, closeWindow, resetState } from "../assets/js/state.js";

test("completeBoot flips bootComplete to true", () => {
  resetState();
  completeBoot();
  assert.equal(state.bootComplete, true);
});

test("focusProject sets activeProjectId", () => {
  resetState();
  focusProject("sql-agent");
  assert.equal(state.activeProjectId, "sql-agent");
});

test("closeWindow clears activeProjectId", () => {
  resetState();
  focusProject("sql-agent");
  closeWindow();
  assert.equal(state.activeProjectId, null);
});

test("subscribers are notified on every state change", () => {
  resetState();
  let callCount = 0;
  subscribe(() => { callCount += 1; });
  focusProject("sql-agent");
  closeWindow();
  assert.equal(callCount, 2);
});

test("unsubscribe stops further notifications", () => {
  resetState();
  let callCount = 0;
  const unsubscribe = subscribe(() => { callCount += 1; });
  focusProject("sql-agent");
  unsubscribe();
  closeWindow();
  assert.equal(callCount, 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/state.test.js`
Expected: FAIL — `Cannot find module '../assets/js/state.js'`

- [ ] **Step 3: Write the implementation**

Create `assets/js/state.js`:

```js
let listeners = new Set();

export const state = {
  bootComplete: false,
  activeProjectId: null
};

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function completeBoot() {
  state.bootComplete = true;
  notify();
}

export function focusProject(projectId) {
  state.activeProjectId = projectId;
  notify();
}

export function closeWindow() {
  state.activeProjectId = null;
  notify();
}

export function resetState() {
  state.bootComplete = false;
  state.activeProjectId = null;
  listeners = new Set();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/state.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Syntax-check**

Run: `node --check assets/js/state.js`
Expected: no output (success)

- [ ] **Step 6: Commit**

```bash
git add assets/js/state.js tests/state.test.js
git commit -m "feat: add central state module with subscribe/notify"
```

---

### Task 4: Graph-Szene rendern (`scene.js` + `main.js`)

**Files:**
- Create: `assets/js/scene.js`
- Create: `assets/js/main.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: `computeLayout` from `assets/js/graph-layout.js` (Task 2); `state`, `subscribe`, `focusProject` from `assets/js/state.js` (Task 3); `projects` from `data/projects.js` (Task 1).
- Produces: `initScene(container: HTMLElement, projects: Array) -> void`. Renders edges and nodes into `container` and re-renders on every state change.

- [ ] **Step 1: Write the scene renderer**

Create `assets/js/scene.js`:

```js
import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject } from "./state.js";

export function initScene(container, projects) {
  render();
  subscribe(render);

  function render() {
    const { nodes, edges } = computeLayout(projects, state.activeProjectId);
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));

    container.innerHTML = "";
    container.appendChild(buildEdgeLayer(edges, nodesById));
    container.appendChild(buildNodeLayer(nodes, projects));
  }
}

function buildEdgeLayer(edges, nodesById) {
  const layer = document.createElement("div");
  layer.className = "graph-edges";

  edges.forEach((edge) => {
    const from = nodesById[edge.from];
    const to = nodesById[edge.to];
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const line = document.createElement("div");
    line.className = `edge edge--${edge.kind}`;
    line.style.width = `${length}px`;
    line.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`;
    layer.appendChild(line);
  });

  return layer;
}

function buildNodeLayer(nodes, projects) {
  const layer = document.createElement("div");
  layer.className = "graph-nodes";
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  nodes.forEach((node) => {
    const isProject = node.type === "project";
    const el = document.createElement(isProject ? "button" : "div");
    el.classList.add("node", `node--${node.type}`);
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;

    if (node.type === "center") {
      el.innerHTML = `<span class="node-dot"></span><span class="node-label">Marco Stang</span>`;
    } else if (isProject) {
      const project = projectById[node.id];
      if (node.tier === "idea") el.classList.add("node--idea");
      el.type = "button";
      el.setAttribute("aria-pressed", String(node.id === state.activeProjectId));
      el.innerHTML = `<span class="node-dot"></span><span class="node-label">${project.title}</span>`;
      el.addEventListener("click", () => focusProject(node.id));
    } else {
      el.innerHTML = `<span class="node-dot"></span><span class="node-label">${node.label}</span>`;
    }

    layer.appendChild(el);
  });

  return layer;
}
```

- [ ] **Step 2: Wire it up in main.js**

Create `assets/js/main.js`:

```js
import { projects } from "../../data/projects.js";
import { initScene } from "./scene.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene(document.querySelector("#scene"), projects);
});
```

- [ ] **Step 3: Append scene/node/edge styles**

Append to `assets/css/style.css`:

```css
.scene {
  position: absolute;
  inset: 0;
}

.graph-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.edge {
  position: absolute;
  left: 50%;
  top: 50%;
  height: 2px;
  background: rgba(167, 139, 250, .55);
  transform-origin: 0 50%;
}
.edge--idea {
  background: repeating-linear-gradient(90deg, rgba(138, 134, 168, .5) 0 6px, transparent 6px 11px);
}
.edge--tag {
  height: 1px;
  background: rgba(94, 234, 212, .4);
}
@media (prefers-reduced-motion: no-preference) {
  .edge--active {
    background: var(--teal);
    box-shadow: 0 0 6px rgba(94, 234, 212, .6);
    animation: edgePulse 2.4s ease-in-out infinite;
  }
}
@keyframes edgePulse {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}

.graph-nodes {
  position: absolute;
  inset: 0;
}

.node {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  padding: 4px;
  font-family: inherit;
  color: var(--text);
  cursor: default;
}
button.node {
  cursor: pointer;
}
button.node:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 4px;
  border-radius: 8px;
}

.node-dot {
  border-radius: 50%;
  display: block;
}
.node-label {
  font-size: 11px;
  white-space: nowrap;
}

.node--center .node-dot {
  width: 52px;
  height: 52px;
  background: radial-gradient(circle at 35% 30%, #fff, var(--violet) 60%, #4c3a8f);
  box-shadow: 0 0 32px rgba(167, 139, 250, .55);
}

.node--project .node-dot {
  width: 34px;
  height: 34px;
  background: radial-gradient(circle at 35% 30%, #fff6db, var(--amber) 55%, #8a5f10);
  box-shadow: 0 0 22px rgba(251, 191, 36, .5);
}
.node--project.node--idea .node-dot {
  width: 22px;
  height: 22px;
  background: radial-gradient(circle at 35% 30%, #c9c6df, #514c6e 60%, #332e4d);
  box-shadow: none;
  opacity: .75;
}

.node--tag .node-dot {
  width: 8px;
  height: 8px;
  background: var(--teal);
  box-shadow: 0 0 6px rgba(94, 234, 212, .7);
}
.node--tag .node-label {
  font-size: 9px;
  color: var(--dim);
}
```

- [ ] **Step 4: Syntax-check**

Run: `node --check assets/js/scene.js && node --check assets/js/main.js`
Expected: no output (success)

- [ ] **Step 5: Manually verify in a browser**

Open `index.html`.

Expected:
- One bright violet center node labeled "Marco Stang", 3 project nodes around it (sql-agent, BI-Dashboard-Assistent, RAG-Wissens-Assistent — the two `planned` ones dimmer/smaller and further out than sql-agent).
- Lines connect the center to each project node; the connection to sql-agent (status `coming-soon`, tier `active`) gently pulses, the two `planned` connections are static dashed lines.
- Click the sql-agent node: its `aria-pressed` attribute (inspect via DevTools) becomes `"true"`, and the tag nodes (LangGraph, LangChain, Python, PostgreSQL, Streamlit) appear branching off it. Click it again or click another node and the tag nodes update accordingly.
- Press Tab from the top of the page: focus reaches each project button in turn with a visible teal focus ring; pressing Enter or Space toggles it exactly like a click.

- [ ] **Step 6: Commit**

```bash
git add assets/js/scene.js assets/js/main.js assets/css/style.css
git commit -m "feat: render graph scene with keyboard-accessible project nodes"
```

---

### Task 5: Projekt-Fenster (`window-manager.js`)

**Files:**
- Create: `assets/js/window-manager.js`
- Modify: `assets/js/main.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: `state`, `subscribe`, `closeWindow` from `assets/js/state.js` (Task 3).
- Produces: `initWindowManager(container: HTMLElement, projects: Array) -> void`.

- [ ] **Step 1: Write the window manager**

Create `assets/js/window-manager.js`:

```js
import { subscribe, state, closeWindow } from "./state.js";

export function initWindowManager(container, projects) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  render();
  subscribe(render);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeProjectId) {
      closeWindow();
    }
  });

  function render() {
    const project = state.activeProjectId ? projectById[state.activeProjectId] : null;
    container.innerHTML = "";
    if (!project) return;

    const isLive = Boolean(project.demoUrl);
    const statusLabel = isLive ? "● LIVE" : "● DEMO FOLGT";
    const actionHtml = isLive
      ? `<a class="btn primary" href="${project.demoUrl}" target="_blank" rel="noopener">Demo starten</a>`
      : `<span class="btn primary disabled" aria-disabled="true">Demo folgt</span>`;
    const repoHtml = project.repoUrl
      ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noopener">Repo öffnen</a>`
      : "";

    const win = document.createElement("div");
    win.className = "window";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", project.title);
    win.innerHTML = `
      <div class="win-title">
        <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
        <span class="win-name">app://${project.id} — Terminal</span>
        <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
      </div>
      <div class="win-body">
        <p class="prompt">marco@portfolio:~$ open ${project.id} --info</p>
        <p class="status-badge">${statusLabel}</p>
        <h3>${project.title}</h3>
        <p class="description">${project.description}</p>
        <div class="tags">${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        <div class="btn-row">${actionHtml}${repoHtml}</div>
      </div>
    `;

    win.querySelector(".win-close").addEventListener("click", closeWindow);
    container.appendChild(win);
  }
}
```

- [ ] **Step 2: Wire it up in main.js**

Modify `assets/js/main.js`:

```js
import { projects } from "../../data/projects.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
});
```

- [ ] **Step 3: Append window styles**

Append to `assets/css/style.css`:

```css
.window-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 24px;
}

.window {
  pointer-events: auto;
  width: 380px;
  max-width: 100%;
  background: var(--panel);
  border: 1px solid rgba(167, 139, 250, .4);
  border-radius: 9px;
  box-shadow: 0 26px 60px rgba(0, 0, 0, .6), 0 0 30px rgba(167, 139, 250, .12);
  overflow: hidden;
}

.win-title {
  background: var(--panel-2);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  border-bottom: 1px solid var(--border);
}
.win-name {
  margin-left: 6px;
  font-size: 11px;
  color: var(--dim);
  flex: 1;
}
.win-close {
  background: none;
  border: none;
  color: var(--dim);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}
.win-close:focus-visible {
  outline: 2px solid var(--teal);
}

.win-body {
  padding: 16px 18px;
  font-family: "Segoe UI", sans-serif;
}
.prompt {
  color: var(--teal);
  font-size: 11px;
  font-family: "Cascadia Code", monospace;
  margin: 0 0 6px;
}
.status-badge {
  display: inline-block;
  font-size: 9.5px;
  color: #0b2e2a;
  background: var(--teal);
  border-radius: 4px;
  padding: 2px 6px;
  font-weight: 700;
  margin: 0 0 6px;
}
.win-body h3 {
  margin: 4px 0;
  font-size: 17px;
}
.description {
  font-size: 12px;
  line-height: 1.6;
  color: #c9c5e8;
  margin: 6px 0 12px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.tag {
  font-size: 9.5px;
  color: var(--teal);
  border: 1px solid rgba(94, 234, 212, .35);
  background: rgba(94, 234, 212, .08);
  padding: 3px 8px;
  border-radius: 5px;
}
.btn-row {
  display: flex;
  gap: 8px;
}
.btn {
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 5px;
  border: 1px solid var(--border);
  text-decoration: none;
  color: var(--text);
}
.btn.primary {
  background: linear-gradient(90deg, var(--violet), var(--teal));
  color: #0b0817;
  font-weight: 700;
  border: none;
}
.btn.primary.disabled {
  background: none;
  border: 1px solid var(--border);
  color: var(--dim);
  font-weight: 400;
}
.btn.ghost {
  color: var(--dim);
}
.btn:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Syntax-check**

Run: `node --check assets/js/window-manager.js && node --check assets/js/main.js`
Expected: no output (success)

- [ ] **Step 5: Manually verify in a browser**

Reload `index.html`.

Expected:
- Clicking the sql-agent node opens a terminal-style window top-right showing: prompt line, "● DEMO FOLGT" badge (since `demoUrl` is `null`), title, description, 5 tag pills, a disabled "Demo folgt" pill and a working "Repo öffnen" link pointing to the GitHub URL.
- Clicking BI-Dashboard-Assistent or RAG-Wissens-Assistent swaps the window content (both show "Demo folgt", no repo link since `repoUrl` is `null` for both).
- Clicking the × closes the window; pressing Escape while a window is open also closes it.

- [ ] **Step 6: Commit**

```bash
git add assets/js/window-manager.js assets/js/main.js assets/css/style.css
git commit -m "feat: add single-window project detail panel"
```

---

### Task 6: Taskbar (`taskbar.js`)

**Files:**
- Create: `assets/js/taskbar.js`
- Modify: `assets/js/main.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: `state`, `subscribe` from `assets/js/state.js` (Task 3).
- Produces: `initTaskbar(container: HTMLElement, projects: Array, options?: { tipIntervalMs?: number }) -> void`.

- [ ] **Step 1: Write the taskbar**

Create `assets/js/taskbar.js`:

```js
import { subscribe, state } from "./state.js";

const TIPS = [
  "KI-Guide: „Klick auf sql-agent, um Details zu sehen“",
  "KI-Guide: „Neue Projekte erscheinen automatisch als neue Knoten“",
  "KI-Guide: „Tab + Enter funktioniert genauso wie ein Klick“"
];

export function initTaskbar(container, projects, { tipIntervalMs = 6000 } = {}) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  let tipIndex = 0;

  renderTaskbar();
  subscribe(renderTaskbar);
  setInterval(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    renderTaskbar();
  }, tipIntervalMs);
  setInterval(renderTaskbar, 1000);

  function renderTaskbar() {
    const project = state.activeProjectId ? projectById[state.activeProjectId] : null;
    const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    container.innerHTML = `
      <span class="tb-start">◆ MARCO.OS</span>
      ${project ? `<span class="tb-app active">${project.id}.exe</span>` : ""}
      <span class="tb-spacer"></span>
      <span class="tb-guide">${TIPS[tipIndex]}</span>
      <span class="tb-clock">${time}</span>
    `;
  }
}
```

- [ ] **Step 2: Wire it up in main.js**

Modify `assets/js/main.js`:

```js
import { projects } from "../../data/projects.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
  initTaskbar(document.querySelector("#taskbar"), projects);
});
```

- [ ] **Step 3: Append taskbar styles**

Append to `assets/css/style.css`:

```css
.tb-start {
  font-weight: 700;
  letter-spacing: .04em;
  background: linear-gradient(90deg, var(--violet), var(--teal));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tb-app {
  border: 1px solid var(--border);
  padding: 4px 9px;
  border-radius: 5px;
  color: var(--teal);
  border-color: rgba(94, 234, 212, .4);
}
.tb-spacer {
  flex: 1;
}
.tb-clock {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 4: Syntax-check**

Run: `node --check assets/js/taskbar.js && node --check assets/js/main.js`
Expected: no output (success)

- [ ] **Step 5: Manually verify in a browser**

Reload `index.html`.

Expected:
- Taskbar shows "◆ MARCO.OS" on the left, a rotating KI-Guide tip in the middle, and the current time (updating every minute) on the right.
- Opening a project node adds a `<project-id>.exe` chip to the taskbar; closing the window removes it.
- Wait ~6 seconds without interacting: the tip text changes to the next one in the list.

- [ ] **Step 6: Commit**

```bash
git add assets/js/taskbar.js assets/js/main.js assets/css/style.css
git commit -m "feat: add taskbar with clock, active app and rotating tips"
```

---

### Task 7: Boot-Sequenz (`boot.js`)

**Files:**
- Create: `assets/js/boot.js`
- Modify: `assets/js/main.js`
- Modify: `assets/css/style.css`

**Interfaces:**
- Consumes: `completeBoot` from `assets/js/state.js` (Task 3).
- Produces: `initBoot(overlay: HTMLElement, options?: { durationMs?: number }) -> void`.

- [ ] **Step 1: Write the boot sequence**

Create `assets/js/boot.js`:

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

  const finish = () => {
    overlay.remove();
    completeBoot();
  };

  const timer = setTimeout(finish, durationMs);

  overlay.addEventListener("click", () => {
    clearTimeout(timer);
    finish();
  });
  document.addEventListener(
    "keydown",
    () => {
      clearTimeout(timer);
      finish();
    },
    { once: true }
  );
}
```

- [ ] **Step 2: Wire it up in main.js (boot runs first)**

Modify `assets/js/main.js`:

```js
import { projects } from "../../data/projects.js";
import { initBoot } from "./boot.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initBoot(document.querySelector("#boot-overlay"));
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
  initTaskbar(document.querySelector("#taskbar"), projects);
});
```

- [ ] **Step 3: Append boot overlay styles**

Append to `assets/css/style.css`:

```css
.boot-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  background: var(--bg-deep);
  font-family: "Cascadia Code", "Consolas", ui-monospace, monospace;
  font-size: 13px;
  color: var(--teal);
  cursor: pointer;
}
.boot-line {
  opacity: .8;
  line-height: 1.8;
}
```

- [ ] **Step 4: Syntax-check**

Run: `node --check assets/js/boot.js && node --check assets/js/main.js`
Expected: no output (success)

- [ ] **Step 5: Manually verify in a browser**

Reload `index.html` (hard refresh).

Expected:
- Three boot lines are visible over a solid dark background for ~1.8 seconds, then disappear automatically revealing the graph scene, taskbar and no errors in the console.
- Reload again and immediately click anywhere on the boot overlay (or press any key): the scene appears instantly instead of waiting.

- [ ] **Step 6: Commit**

```bash
git add assets/js/boot.js assets/js/main.js assets/css/style.css
git commit -m "feat: add skippable boot sequence"
```

---

### Task 8: Responsive & Tastatur-Durchgang

**Files:**
- Modify: `assets/css/style.css`

**Interfaces:**
- None (styling-only task; no new exports).

- [ ] **Step 1: Append the mobile breakpoint**

Append to `assets/css/style.css`:

```css
@media (max-width: 720px) {
  .window-layer {
    align-items: flex-end;
    justify-content: center;
    padding: 0;
  }
  .window {
    width: 100%;
    border-radius: 12px 12px 0 0;
  }
  .node-label {
    font-size: 9px;
  }
}
```

- [ ] **Step 2: Manually verify at 375px width**

Open `index.html`, open browser DevTools, switch to responsive/device mode at 375×667.

Expected:
- No horizontal scrollbar appears.
- Graph nodes and labels are still legible and tappable.
- Tapping a project node opens the window as a full-width bottom sheet instead of a floating top-right card.

- [ ] **Step 3: Manually verify at 1280px+ width**

Switch DevTools back to a desktop viewport (1280px or wider, or exit responsive mode).

Expected: layout matches the approved fusion mockup — graph centered, window floats top-right, taskbar spans the bottom.

- [ ] **Step 4: Full keyboard-only pass**

With the mouse untouched, reload the page and use only the keyboard:

Expected:
- `Tab` moves focus through the project nodes in order (visible teal focus ring each time), never getting stuck (no keyboard trap).
- `Enter` or `Space` on a focused node opens its window.
- `Escape` closes the open window from anywhere on the page.

- [ ] **Step 5: Commit**

```bash
git add assets/css/style.css
git commit -m "style: add mobile breakpoint for the project window"
```

---

### Task 9: Integrations- und Edge-Case-Verifikation

**Files:**
- None expected (fix-only if a check below fails).

**Interfaces:**
- None.

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test tests/`
Expected: PASS — 13 tests total (3 from `projects.test.js`, 5 from `graph-layout.test.js`, 5 from `state.test.js`).

- [ ] **Step 2: Syntax-check every JS file**

Run:

```bash
node --check data/projects.js
node --check assets/js/state.js
node --check assets/js/graph-layout.js
node --check assets/js/scene.js
node --check assets/js/window-manager.js
node --check assets/js/taskbar.js
node --check assets/js/boot.js
node --check assets/js/main.js
```

Expected: no output for any of them (all succeed).

- [ ] **Step 3: End-to-end manual walkthrough**

Open `index.html` fresh (hard refresh) and walk through:

1. Boot sequence plays, then the scene appears.
2. Click sql-agent → window shows correct title/description/tags, "● DEMO FOLGT" badge, disabled "Demo folgt" pill, working "Repo öffnen" link.
3. Click BI-Dashboard-Assistent → window content swaps, no repo link (its `repoUrl` is `null`), tag nodes around it update to `Python`, `Streamlit`.
4. Click RAG-Wissens-Assistent → same check with tags `LangChain`, `Pinecone`.
5. Confirm the two `planned` projects render smaller/dimmer and further from the center than sql-agent, matching what `graph-layout.test.js` asserts numerically.
6. Confirm the taskbar clock is ticking and the KI-Guide tip rotates.

Expected: all six checks pass with no console errors.

- [ ] **Step 4: Commit (only if Step 1–3 required fixes)**

```bash
git add -A
git commit -m "fix: address integration verification findings"
```

If no fixes were needed, skip this step — Task 9 is verification-only.
