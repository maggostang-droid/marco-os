# Orbit Clusters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group the 7 portfolio project planets into 3 skill-based elliptical orbits (agentic-ai / cloud / full-stack) around the center node, with cluster-matched planet/edge color and a visible dashed orbit-ring per cluster, replacing the current cosmetic (meaningless) 3-color/3-distance cycling.

**Architecture:** Pure-function layout change in `graph-layout.js` (adds a `cluster` field to project data, groups projects by cluster, places each cluster on its own concentric ellipse), then a rendering change in `scene.js`/`style.css` (fixed cluster→color mapping, new SVG orbit-ring layer, cluster-colored edges).

**Tech Stack:** Plain ES modules, `node --test`, no new dependencies. Playwright (scratch-installed outside the repo, never a project dependency) for manual visual verification, per this repo's established convention.

## Global Constraints

- No build tool, bundler, framework, or new npm dependency — plain HTML/CSS/vanilla JS (ES modules) stays as-is. `package.json` must not change.
- Tests: `npm test` (runs `node --test`, discovers `tests/*.test.js`). Run this after every task.
- `node --check <file>.js` for a quick per-file syntax check before running the full suite.
- DOM-rendering modules (`scene.js`, CSS) have no automated tests in this repo — verify manually via a locally-installed Playwright in a scratch directory outside the repo (never added to `package.json`), per `CLAUDE.md`.
- Work happens directly on the current branch (`feature/orbit-clusters`, already checked out) — no further branching mid-plan.
- Commit messages follow the existing history's style: short `type: summary` subject (`feat:`, `test:`, etc.), body explaining *why* when non-obvious. Commit after each task.
- Full design rationale lives in `docs/superpowers/specs/2026-07-29-orbit-clusters-design.md` — consult it if anything below is ambiguous.

---

### Task 1: Add `cluster` field to project data

**Files:**
- Modify: `data/projects.js` (all 7 project objects)
- Modify: `tests/projects.test.js`

**Interfaces:**
- Produces: every project object in the `projects` array now has a `cluster` property, one of `"agentic-ai"`, `"cloud"`, `"full-stack"`. Task 2 (`graph-layout.js`) and Task 3 (`scene.js`) both read `project.cluster`.

- [ ] **Step 1: Write the failing tests**

Open `tests/projects.test.js`. Add `"cluster"` to the `requiredFields` array in the existing "every project has the required fields" test:

```js
test("every project has the required fields", () => {
  const requiredFields = [
    "id", "title", "summary", "description", "tags", "demoUrl", "repoUrl", "status", "cluster"
  ];
  for (const project of projects) {
    for (const field of requiredFields) {
      assert.ok(field in project, `${project.id ?? "<unknown>"} is missing "${field}"`);
    }
    assert.ok(Array.isArray(project.tags), `${project.id} tags must be an array`);
  }
});
```

Then add a new test at the end of the file (after the existing "status is a non-empty string" test):

```js
test("every project has a valid cluster", () => {
  const validClusters = ["agentic-ai", "cloud", "full-stack"];
  for (const project of projects) {
    assert.ok(
      validClusters.includes(project.cluster),
      `${project.id}.cluster must be one of ${validClusters.join(", ")}, got ${project.cluster}`
    );
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — both the "required fields" test and the new "valid cluster" test fail, since no project has a `cluster` field yet.

- [ ] **Step 3: Add the `cluster` field to every project**

In `data/projects.js`, add a `cluster` property to each project object, right after its `status` field (this also means adding a trailing comma after `status`'s value, since it's currently the last property in each object).

`status` values repeat across projects (four projects are `"coming-soon"`), so a plain search on the `status` line alone isn't a unique match — use `repoUrl` + `status` together as the anchor for each edit, since that pair is unique per project (verified: `ai-analytics-portal` and `second-brain` are the only two with `repoUrl: null`, but they differ in `status`). Apply all 7 of these find-and-replace edits:

```js
// sql-agent — find:
    repoUrl: "https://github.com/maggostang-droid/sql-agent",
    status: "coming-soon"
// replace with:
    repoUrl: "https://github.com/maggostang-droid/sql-agent",
    status: "coming-soon",
    cluster: "agentic-ai"
```

```js
// ai-act-validation-toolkit — find:
    repoUrl: "https://github.com/maggostang-droid/ai-act-validation-toolkit",
    status: "live"
// replace with:
    repoUrl: "https://github.com/maggostang-droid/ai-act-validation-toolkit",
    status: "live",
    cluster: "agentic-ai"
```

```js
// ai-analytics-portal — find:
    repoUrl: null,
    status: "coming-soon"
// replace with:
    repoUrl: null,
    status: "coming-soon",
    cluster: "full-stack"
```

```js
// amalea — find:
    repoUrl: "https://github.com/maggostang-droid/AMALEA",
    status: "coming-soon"
// replace with:
    repoUrl: "https://github.com/maggostang-droid/AMALEA",
    status: "coming-soon",
    cluster: "full-stack"
```

```js
// cloud-native-pipeline — find:
    repoUrl: "https://github.com/maggostang-droid/cloud-native-pipeline",
    status: "live"
// replace with:
    repoUrl: "https://github.com/maggostang-droid/cloud-native-pipeline",
    status: "live",
    cluster: "cloud"
```

```js
// goz-finetune-vs-rag — find:
    repoUrl: "https://github.com/maggostang-droid/goz-finetune-vs-rag",
    status: "coming-soon"
// replace with:
    repoUrl: "https://github.com/maggostang-droid/goz-finetune-vs-rag",
    status: "coming-soon",
    cluster: "agentic-ai"
```

```js
// second-brain — find:
    repoUrl: null,
    status: "planned"
// replace with:
    repoUrl: null,
    status: "planned",
    cluster: "agentic-ai"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests green, including the two from Step 1.

- [ ] **Step 5: Commit**

```bash
git add data/projects.js tests/projects.test.js
git commit -m "$(cat <<'EOF'
feat: add skill-cluster field to project data

Groups the 7 portfolio projects into agentic-ai/cloud/full-stack —
needed by the upcoming cluster-based orbit layout (graph-layout.js).
EOF
)"
```

---

### Task 2: Cluster-based ellipse layout algorithm

**Files:**
- Modify: `assets/js/graph-layout.js` (full rewrite of `computeLayout`)
- Modify: `tests/graph-layout.test.js` (full rewrite)

**Interfaces:**
- Consumes: `project.cluster` (one of `"agentic-ai"`, `"cloud"`, `"full-stack"`, from Task 1) and `project.status` (existing field; `"planned"` means idea-tier).
- Produces: `computeLayout(projects, viewportSize = null) -> { nodes: Array<{id, type: "center"|"project", tier?: "active"|"idea", x: number, y: number}>, edges: Array<{from: string, to: string, kind: "idea"|"cluster-agentic-ai"|"cluster-cloud"|"cluster-full-stack"}>, rings: Array<{cluster: string, rx: number, ry: number}> }`. `rings` is new — one entry per cluster actually present in the input, in `CLUSTER_ORDER`. Task 3 (`scene.js`) consumes all three fields; `edge.kind` changed shape from the old flat `tier` value (`"active"|"idea"`) to the cluster-specific value above — this is a breaking change from the previous version, intentional per the design spec's migration note (the old `ACTIVE_RADIUS_VARIANTS`/round-robin color mechanism is fully replaced, not kept as a fallback).

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `tests/graph-layout.test.js` with:

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
    { id: "a", status: "coming-soon", cluster: "agentic-ai", tags: [] },
    { id: "b", status: "planned", cluster: "cloud", tags: [] }
  ];
  const { nodes, edges } = computeLayout(projects);
  assert.equal(nodes.length, 3);
  assert.equal(edges.length, 2);
  assert.ok(nodes.some((n) => n.id === "a"));
  assert.ok(nodes.some((n) => n.id === "b"));
});

test("computeLayout returns one ring per cluster present in the input", () => {
  const projects = [
    { id: "a", status: "coming-soon", cluster: "agentic-ai", tags: [] },
    { id: "b", status: "coming-soon", cluster: "agentic-ai", tags: [] },
    { id: "c", status: "coming-soon", cluster: "full-stack", tags: [] }
  ];
  const { rings } = computeLayout(projects);
  assert.equal(rings.length, 2);
  assert.ok(rings.some((r) => r.cluster === "agentic-ai"));
  assert.ok(rings.some((r) => r.cluster === "full-stack"));
  assert.ok(!rings.some((r) => r.cluster === "cloud"));
});

test("clusters sit on differently sized ellipses", () => {
  const projects = [
    { id: "a", status: "coming-soon", cluster: "agentic-ai", tags: [] },
    { id: "b", status: "coming-soon", cluster: "cloud", tags: [] },
    { id: "c", status: "coming-soon", cluster: "full-stack", tags: [] }
  ];
  const { rings } = computeLayout(projects);
  const rxByCluster = Object.fromEntries(rings.map((r) => [r.cluster, r.rx]));
  assert.ok(rxByCluster["agentic-ai"] < rxByCluster["cloud"]);
  assert.ok(rxByCluster["cloud"] < rxByCluster["full-stack"]);
});

test("projects within the same cluster are evenly spaced around their ring", () => {
  const projects = Array.from({ length: 4 }, (_, i) => ({
    id: `p${i}`,
    status: "coming-soon",
    cluster: "agentic-ai",
    tags: []
  }));
  const { nodes, rings } = computeLayout(projects);
  const ring = rings.find((r) => r.cluster === "agentic-ai");

  // Recover each node's parametric angle on the ellipse (x = rx*cos(a),
  // y = ry*sin(a)) rather than comparing raw Euclidean distance — an
  // ellipse's points aren't equidistant from its center, so distance alone
  // can't verify "evenly spaced", but the recovered angle can.
  const angleOf = (id) => {
    const node = nodes.find((n) => n.id === id);
    return Math.atan2(node.y / ring.ry, node.x / ring.rx);
  };

  const angles = projects.map((p) => angleOf(p.id)).sort((a, b) => a - b);
  const step = (2 * Math.PI) / projects.length;
  for (let i = 1; i < angles.length; i++) {
    assert.ok(
      Math.abs(angles[i] - angles[i - 1] - step) < 1e-9,
      `expected a ${step} rad step, got ${angles[i] - angles[i - 1]}`
    );
  }
});

test("a planned project sits further from center than an active same-cluster sibling on the same axis", () => {
  const projects = [
    { id: "active", status: "coming-soon", cluster: "agentic-ai", tags: [] },
    { id: "idea", status: "planned", cluster: "agentic-ai", tags: [] }
  ];
  const { nodes } = computeLayout(projects);
  const dist = (id) => {
    const node = nodes.find((n) => n.id === id);
    return Math.hypot(node.x, node.y);
  };
  assert.ok(dist("idea") > dist("active"));
});

test("edges carry a cluster-specific kind for active projects, 'idea' for planned ones", () => {
  const projects = [
    { id: "a", status: "coming-soon", cluster: "agentic-ai", tags: [] },
    { id: "b", status: "planned", cluster: "cloud", tags: [] }
  ];
  const { edges } = computeLayout(projects);
  const kindOf = (to) => edges.find((e) => e.to === to).kind;
  assert.equal(kindOf("a"), "cluster-agentic-ai");
  assert.equal(kindOf("b"), "idea");
});

test("base radius grows once there are more than three projects", () => {
  const makeProjects = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: `p${i}`, status: "coming-soon", cluster: "cloud", tags: [] }));

  const distOfFirst = (count) => {
    const { nodes } = computeLayout(makeProjects(count));
    const node = nodes.find((n) => n.id === "p0");
    return Math.hypot(node.x, node.y);
  };

  assert.ok(distOfFirst(5) > distOfFirst(3));
});

test("narrow viewports shrink the project radius", () => {
  const projects = [{ id: "a", status: "coming-soon", cluster: "cloud", tags: [] }];

  const distAt = (viewportSize) => {
    const { nodes } = computeLayout(projects, viewportSize);
    const node = nodes.find((n) => n.id === "a");
    return Math.hypot(node.x, node.y);
  };

  assert.ok(distAt(375) < distAt(1280));
});

test("omitting viewportSize keeps the original fixed radius", () => {
  const projects = [{ id: "a", status: "coming-soon", cluster: "agentic-ai", tags: [] }];
  const { nodes } = computeLayout(projects);
  const node = nodes.find((n) => n.id === "a");
  // agentic-ai's rx multiplier is 0.65 and its angle offset is 0°, so a
  // single project lands exactly on the ellipse's major axis (y = 0) —
  // distance from center is exactly rx = 150 (BASE_RADIUS) * 0.65.
  assert.equal(Math.hypot(node.x, node.y), 150 * 0.65);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — most of the new/changed tests fail (`rings` is `undefined`, edge `kind` is still `"active"`/`"idea"`, ellipse math doesn't exist yet).

- [ ] **Step 3: Rewrite `computeLayout`**

Replace the entire contents of `assets/js/graph-layout.js` with:

```js
const BASE_RADIUS = 150;
const RADIUS_STEP_PER_EXTRA_PROJECT = 20;
const REFERENCE_VIEWPORT = 1280;
const MIN_VIEWPORT_SCALE = 0.5;

// Skill clusters, each its own concentric elliptical orbit around the
// center node. Order determines both which ring sits innermost (first =
// smallest) and the reveal stagger order in scene.js.
const CLUSTER_ORDER = ["agentic-ai", "cloud", "full-stack"];

// rx multiplier per cluster (applied to the shared baseRadius). agentic-ai
// is the largest/most active cluster in the current portfolio, so it sits
// closest to the center; full-stack sits furthest out.
const CLUSTER_RX_MULTIPLIER = {
  "agentic-ai": 0.65,
  cloud: 1,
  "full-stack": 1.4
};

// ry = rx * ELLIPSE_ASPECT — flattens each ring into an ellipse (wider than
// tall) instead of a circle, matching the wide viewport.
const ELLIPSE_ASPECT = 0.55;

// Small per-ring rotation so the "first" project in each cluster doesn't
// land on the same radial line as the other rings' first project — keeps
// the field from reading as three overlapping spokes.
const CLUSTER_ANGLE_OFFSET_DEG = {
  "agentic-ai": 0,
  cloud: 25,
  "full-stack": 50
};

// Applied on top of a project's own cluster ring for status: "planned"
// projects, so they sit visibly further out than their cluster siblings —
// "not built yet" stays legible even though they're still grouped by skill.
const IDEA_ORBIT_MULTIPLIER = 1.25;

function viewportScale(viewportSize) {
  if (!viewportSize) return 1;
  return Math.min(1, Math.max(MIN_VIEWPORT_SCALE, viewportSize / REFERENCE_VIEWPORT));
}

export function computeLayout(projects, viewportSize = null) {
  const nodes = [{ id: "center", type: "center", x: 0, y: 0 }];
  const edges = [];
  const rings = [];

  const scale = viewportScale(viewportSize);
  const count = projects.length;
  const baseRadius = (BASE_RADIUS + Math.max(0, count - 3) * RADIUS_STEP_PER_EXTRA_PROJECT) * scale;

  const projectsByCluster = new Map();
  for (const project of projects) {
    const list = projectsByCluster.get(project.cluster) ?? [];
    list.push(project);
    projectsByCluster.set(project.cluster, list);
  }

  for (const cluster of CLUSTER_ORDER) {
    const clusterProjects = projectsByCluster.get(cluster);
    if (!clusterProjects || clusterProjects.length === 0) continue;

    const rx = baseRadius * CLUSTER_RX_MULTIPLIER[cluster];
    const ry = rx * ELLIPSE_ASPECT;
    rings.push({ cluster, rx, ry });

    const angleOffset = (CLUSTER_ANGLE_OFFSET_DEG[cluster] * Math.PI) / 180;
    const clusterCount = clusterProjects.length;

    clusterProjects.forEach((project, index) => {
      const angle = (2 * Math.PI * index) / clusterCount + angleOffset;
      const tier = project.status === "planned" ? "idea" : "active";
      const orbitMultiplier = tier === "idea" ? IDEA_ORBIT_MULTIPLIER : 1;
      const x = Math.cos(angle) * rx * orbitMultiplier;
      const y = Math.sin(angle) * ry * orbitMultiplier;

      nodes.push({ id: project.id, type: "project", tier, x, y });
      edges.push({
        from: "center",
        to: project.id,
        kind: tier === "idea" ? "idea" : `cluster-${project.cluster}`
      });
    });
  }

  return { nodes, edges, rings };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests green, including `tests/projects.test.js` from Task 1 (unaffected by this change) and every test in `tests/graph-layout.test.js`.

- [ ] **Step 5: Commit**

```bash
git add assets/js/graph-layout.js tests/graph-layout.test.js
git commit -m "$(cat <<'EOF'
feat: lay out projects on per-cluster elliptical orbits

Replaces the old flat baseRadius + round-robin distance-variant
mechanic with one concentric ellipse ring per skill cluster
(agentic-ai/cloud/full-stack), evenly spacing each cluster's own
projects around its ring. planned-status projects still sit visibly
further out than their cluster siblings via IDEA_ORBIT_MULTIPLIER.
EOF
)"
```

---

### Task 3: Cluster-colored rendering + visible orbit rings

**Files:**
- Modify: `assets/js/scene.js`
- Modify: `assets/css/style.css`
- Modify: `CLAUDE.md` (Architecture section — stale after Tasks 1 and 2)

**Interfaces:**
- Consumes: `computeLayout`'s `{ nodes, edges, rings }` return shape from Task 2, and `project.cluster` from Task 1.
- Produces: no new exports — this is the terminal rendering layer. `buildOrbitLayer(rings, edgeCount) -> SVGElement` is a new internal function in `scene.js`, called from `render()`.

- [ ] **Step 1: Rewrite `scene.js`**

Replace the entire contents of `assets/js/scene.js` with:

```js
import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject, closeWindow, zoomIn, zoomOut } from "./state.js";
import { escapeHtml } from "./html-utils.js";

const FOCUS_ZOOM_BONUS = 2.6;

// Reveal timing: four distinct phases (planets -> lines -> runner lights,
// center planet leads phase 1) with an explicit pause between each phase.
// Each *_FADE_MS constant must match the transition-duration declared for
// the matching selector in style.css — they're kept here, not read from
// CSS, so phase boundaries can be computed precisely (start delay + fade
// duration = when that element is actually done appearing, not just when
// it started).
const NODE_STAGGER_MS = 380;
const NODE_FADE_MS = 700; // matches .node-dot's transition-duration
const LABEL_EXTRA_MS = 150;
const EDGE_STAGGER_MS = 380;
const EDGE_FADE_MS = 500; // matches the shared .node--project/.edge/.orbit-ring opacity transition-duration
const RUNNER_STAGGER_MS = 700;
const PHASE_GAP_MS = 700; // pause inserted between each phase

export function initScene(container, projects) {
  const viewport = document.createElement("div");
  viewport.className = "graph-viewport";
  // Edges/nodes render into this inner div, which render() below rebuilds on
  // every notify. The starfield prepends its layers directly into `viewport`
  // (not `content`) so they inherit the same zoom/pan transform without
  // getting wiped out by that rebuild.
  const content = document.createElement("div");
  content.className = "graph-content";
  viewport.appendChild(content);
  container.appendChild(viewport);

  const WHEEL_STEP_THRESHOLD = 100; // px of accumulated deltaY per zoom step — matches a
  // typical single mouse-wheel notch, and smooths out high-frequency trackpad gesture events
  // (which fire many small deltas per flick) instead of applying each one as its own step.

  let wheelAccumulator = 0;

  container.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      wheelAccumulator += event.deltaY;
      while (wheelAccumulator <= -WHEEL_STEP_THRESHOLD) {
        zoomIn();
        wheelAccumulator += WHEEL_STEP_THRESHOLD;
      }
      while (wheelAccumulator >= WHEEL_STEP_THRESHOLD) {
        zoomOut();
        wheelAccumulator -= WHEEL_STEP_THRESHOLD;
      }
    },
    { passive: false }
  );

  container.addEventListener("click", (event) => {
    if (state.activeProjectId && !event.target.closest(".node--project")) {
      closeWindow();
    }
  });

  let lastContentKey = null;

  render();
  subscribe(render);

  function render() {
    const viewportSize = Math.min(container.clientWidth, window.innerHeight);
    const { nodes, edges, rings } = computeLayout(projects, viewportSize);
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const focusedProjectId = state.activeProjectId;

    const effectiveZoom = state.zoomLevel * (focusedProjectId ? FOCUS_ZOOM_BONUS : 1);
    const focusedNode = focusedProjectId ? nodesById[focusedProjectId] : null;
    const translateX = focusedNode ? -focusedNode.x * effectiveZoom : 0;
    const translateY = focusedNode ? -focusedNode.y * effectiveZoom : 0;
    viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${effectiveZoom})`;

    // Edge/node geometry depends only on the project list, the focused
    // project, and viewport size — not on zoomLevel, which the transform
    // above already applies to the whole layer. Rebuilding on every zoom
    // tick (mouse wheel fires many notifies) restarted the edge-runner
    // CSS animations from scratch every time, making them visibly stutter.
    if (state.bootComplete) container.classList.add("is-revealed");

    const contentKey = `${focusedProjectId ?? ""}:${viewportSize}`;
    if (contentKey === lastContentKey) return;
    lastContentKey = contentKey;

    const previouslyFocusedId = document.activeElement?.dataset?.nodeId ?? null;

    content.innerHTML = "";
    content.appendChild(buildOrbitLayer(rings, edges.length));
    content.appendChild(buildEdgeLayer(edges, nodesById, focusedProjectId));
    content.appendChild(buildNodeLayer(nodes, projects, focusedProjectId));

    if (previouslyFocusedId) {
      container.querySelector(`[data-node-id="${CSS.escape(previouslyFocusedId)}"]`)?.focus({ preventScroll: true });
    }
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";

// Faint dashed ellipse per skill cluster, drawn behind edges/nodes so the
// cluster grouping is legible at a glance. cx/cy as percentages center each
// ellipse on the container regardless of its pixel size — the same origin
// edges/nodes already position themselves around via `left: 50%; top: 50%`.
function buildOrbitLayer(rings, edgeCount) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "graph-orbits");

  // Same phase-start math as buildEdgeLayer below (kept in sync deliberately
  // — see the NODE_FADE_MS comment above): rings fade in at the start of the
  // "lines" reveal phase, all together, while edges then stagger in across
  // that same phase.
  const nodePhaseEndMs = edgeCount * NODE_STAGGER_MS + NODE_FADE_MS;
  const edgePhaseStartMs = nodePhaseEndMs + PHASE_GAP_MS;

  rings.forEach((ring) => {
    const ellipse = document.createElementNS(SVG_NS, "ellipse");
    ellipse.setAttribute("cx", "50%");
    ellipse.setAttribute("cy", "50%");
    ellipse.setAttribute("rx", String(ring.rx));
    ellipse.setAttribute("ry", String(ring.ry));
    ellipse.setAttribute("class", `orbit-ring orbit-ring--${ring.cluster}`);
    ellipse.style.transitionDelay = `${edgePhaseStartMs}ms`;
    svg.appendChild(ellipse);
  });

  return svg;
}

function buildEdgeLayer(edges, nodesById, focusedProjectId) {
  const layer = document.createElement("div");
  layer.className = "graph-edges";

  // Phase boundaries computed from actual finish times (start delay + fade
  // duration), not just stagger order — so e.g. the edge phase only starts
  // once the *last* planet has actually finished fading in, not merely
  // once it started. edgeCount == project count == (node count - 1), since
  // computeLayout emits exactly one edge and one node per project plus the
  // center node.
  const edgeCount = edges.length;
  const nodePhaseEndMs = edgeCount * NODE_STAGGER_MS + NODE_FADE_MS;
  const edgePhaseStartMs = nodePhaseEndMs + PHASE_GAP_MS;
  const edgePhaseEndMs = edgePhaseStartMs + Math.max(edgeCount - 1, 0) * EDGE_STAGGER_MS + EDGE_FADE_MS;
  const runnerPhaseStartMs = edgePhaseEndMs + PHASE_GAP_MS;

  // Only the very first build (before boot has completed) needs the long
  // phased delay — it's timed against .is-revealed being added at boot
  // completion (see the CSS rule this pairs with). Later rebuilds (e.g.
  // after focusing a project) happen once .is-revealed is already present,
  // so the animation would apply immediately regardless of delay; keep
  // runners starting right away for those, matching pre-existing behavior.
  const isInitialReveal = !state.bootComplete;

  edges.forEach((edge, index) => {
    const from = nodesById[edge.from];
    const to = nodesById[edge.to];
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const line = document.createElement("div");
    line.className = `edge edge--${edge.kind}`;
    if (focusedProjectId && edge.to !== focusedProjectId) line.classList.add("is-dimmed");
    line.style.width = `${length}px`;
    line.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`;
    line.style.transitionDelay = `${edgePhaseStartMs + index * EDGE_STAGGER_MS}ms`;

    // Positive delay so the runner sits invisible (its 0% keyframe is
    // opacity: 0) until after the whole edge-reveal phase has settled,
    // then starts flowing — the fourth and final reveal phase. Still
    // staggered per-edge so runners don't all launch in perfect lockstep.
    const runner = document.createElement("div");
    runner.className = "edge-runner";
    const runnerDelayMs = isInitialReveal ? runnerPhaseStartMs + index * RUNNER_STAGGER_MS : 0;
    runner.style.animationDelay = `${runnerDelayMs}ms`;
    line.appendChild(runner);

    layer.appendChild(line);
  });

  return layer;
}

const PLANET_TEXTURE_VARIANTS = ["node--planet-shaded", "node--planet-ringed", "node--planet-blotchy"];

// Fixed cluster -> color mapping (not round-robin) so color reinforces which
// orbit a planet belongs to instead of being purely decorative.
const CLUSTER_COLOR_CLASS = {
  "agentic-ai": "node--color-amber",
  cloud: "node--color-teal",
  "full-stack": "node--color-violet"
};

function buildNodeLayer(nodes, projects, focusedProjectId) {
  const layer = document.createElement("div");
  layer.className = "graph-nodes";
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  // Cycle through the texture variants in render order (not a content hash)
  // so with only 3 variants and few planet nodes, every variant actually
  // gets used instead of coincidentally landing on the same one repeatedly.
  let planetIndex = 0;
  const nextPlanetVariant = () => PLANET_TEXTURE_VARIANTS[planetIndex++ % PLANET_TEXTURE_VARIANTS.length];

  nodes.forEach((node, nodeIndex) => {
    const isProject = node.type === "project";
    const el = document.createElement(isProject ? "button" : "div");
    el.classList.add("node", `node--${node.type}`);
    if (isProject && focusedProjectId && node.id !== focusedProjectId) el.classList.add("is-dimmed");
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;
    el.dataset.nodeId = node.id;

    const dotDelay = `${nodeIndex * NODE_STAGGER_MS}ms`;
    const labelDelay = `${nodeIndex * NODE_STAGGER_MS + LABEL_EXTRA_MS}ms`;

    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
    } else {
      const project = projectById[node.id];
      if (node.tier === "idea") {
        el.classList.add("node--idea");
      } else {
        el.classList.add(CLUSTER_COLOR_CLASS[project.cluster]);
      }
      el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(node.id === state.activeProjectId));
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><span class="node-label" style="transition-delay: ${labelDelay}">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(node.id));
    }

    layer.appendChild(el);
  });

  return layer;
}
```

- [ ] **Step 2: `node --check` the rewritten file**

Run: `node --check assets/js/scene.js`
Expected: no output (syntax OK).

- [ ] **Step 3: Update `style.css` — replace the flat `.edge--active` with 3 cluster variants**

In `assets/css/style.css`, find this block:

```css
.edge--idea {
  background: repeating-linear-gradient(90deg, rgba(138, 134, 168, .5) 0 6px, transparent 6px 11px);
}
.edge--active {
  background: var(--teal);
  box-shadow: 0 0 6px rgba(94, 234, 212, .6);
}
@media (prefers-reduced-motion: no-preference) {
  .edge--active {
    animation: edgePulse 2.4s ease-in-out infinite;
  }
}
```

Replace it with:

```css
.edge--idea {
  background: repeating-linear-gradient(90deg, rgba(138, 134, 168, .5) 0 6px, transparent 6px 11px);
}
.edge--cluster-agentic-ai {
  background: var(--amber);
  box-shadow: 0 0 6px rgba(251, 191, 36, .6);
}
.edge--cluster-cloud {
  background: var(--teal);
  box-shadow: 0 0 6px rgba(94, 234, 212, .6);
}
.edge--cluster-full-stack {
  background: var(--violet);
  box-shadow: 0 0 6px rgba(167, 139, 250, .6);
}
@media (prefers-reduced-motion: no-preference) {
  .edge--cluster-agentic-ai,
  .edge--cluster-cloud,
  .edge--cluster-full-stack {
    animation: edgePulse 2.4s ease-in-out infinite;
  }
}
```

- [ ] **Step 4: Add the orbit-ring layer styles**

In `assets/css/style.css`, find the `.graph-edges` block:

```css
.graph-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
```

Insert this new block immediately **before** it (so orbit rings are declared — and, since DOM insertion order in `scene.js` puts the `<svg class="graph-orbits">` before `.graph-edges`, painted — behind the edges):

```css
.graph-orbits {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.orbit-ring {
  fill: none;
  stroke-width: 1;
  stroke-dasharray: 4 5;
  opacity: .35;
}
.orbit-ring--agentic-ai { stroke: var(--amber); }
.orbit-ring--cloud { stroke: var(--teal); }
.orbit-ring--full-stack { stroke: var(--violet); }

.graph-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
```

- [ ] **Step 5: Wire the orbit ring into the existing reveal-transition rules**

In `assets/css/style.css`, find:

```css
@media (prefers-reduced-motion: no-preference) {
  .node--project,
  .edge {
    transition: opacity .5s ease;
  }
}
```

Replace with:

```css
@media (prefers-reduced-motion: no-preference) {
  .node--project,
  .edge,
  .orbit-ring {
    transition: opacity .5s ease;
  }
}
```

Then find (a few lines below, inside the next `@media (prefers-reduced-motion: no-preference)` block):

```css
  .scene:not(.is-revealed) .edge {
    opacity: 0;
  }
```

Replace with:

```css
  .scene:not(.is-revealed) .edge {
    opacity: 0;
  }
  .scene:not(.is-revealed) .orbit-ring {
    opacity: 0;
  }
```

- [ ] **Step 6: Run the automated regression suite**

Run: `npm test`
Expected: PASS — every test still green, including the new/updated ones from Tasks 1 and 2. This step doesn't test the new rendering code directly (no DOM tests exist for `scene.js`), it just confirms nothing else broke.

- [ ] **Step 7: Manually verify the rendering in a browser**

This repo has no headless-DOM test setup for `scene.js`; verification is manual, via a scratch-installed Playwright (per `CLAUDE.md` — never add Playwright to `package.json`).

Start the site locally:

```bash
python -m http.server 8000
```

In a separate scratch directory **outside the repo** (e.g. your working environment's temp/scratch folder — not tracked by git, not `npm install`ed inside `marco-os/`):

```bash
npm init -y
npm install playwright@latest
npx playwright install chromium
```

In that same scratch directory, create `verify-orbits.js`:

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  await page.goto('http://localhost:8000/?cachebust=' + Date.now(), { waitUntil: 'networkidle' });
  await page.keyboard.press('Enter'); // skip boot animation
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const rings = Array.from(document.querySelectorAll('.orbit-ring')).map((el) => ({
      class: el.getAttribute('class'),
      rx: el.getAttribute('rx'),
      ry: el.getAttribute('ry')
    }));
    const nodeColors = Array.from(document.querySelectorAll('.node--project')).map((el) => ({
      id: el.dataset.nodeId,
      classes: el.className
    }));
    const edgeKinds = Array.from(document.querySelectorAll('.edge')).map((el) => el.className);
    return { rings, nodeColors, edgeKinds };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'orbit-clusters.png', fullPage: false });
  await browser.close();
})();
```

Run it:

```bash
node verify-orbits.js
```

Check the printed JSON and screenshot for:
- Exactly 3 `.orbit-ring` elements, with classes `orbit-ring--agentic-ai`, `orbit-ring--cloud`, `orbit-ring--full-stack`, and three distinct `rx` values (agentic-ai smallest, full-stack largest).
- Every `.node--project` element's class list includes exactly one of `node--color-amber`/`node--color-teal`/`node--color-violet` (or `node--idea` for `second-brain`), and it matches that project's cluster (sql-agent/ai-act-validation-toolkit/goz-finetune-vs-rag → amber; cloud-native-pipeline → teal; ai-analytics-portal/amalea → violet; second-brain → idea/grey).
- Edge class names include `edge--cluster-agentic-ai`, `edge--cluster-cloud`, `edge--cluster-full-stack`, and `edge--idea` (for second-brain) — no more `edge--active`.
- In the screenshot: three visibly different-sized dashed ellipses, planets sitting roughly on their ellipse (except `second-brain`, slightly outside its ring), colors matching across ring/planet/edge for the same cluster.

Stop the local server afterward (`Ctrl+C`, or if backgrounded, kill the process).

- [ ] **Step 8: Update the stale architecture description in `CLAUDE.md`**

`CLAUDE.md`'s Architecture section still describes the old data shape and layout algorithm. In `CLAUDE.md`, find:

```
- `data/projects.js` — project data (`id`, `title`, `summary`, `description`,
  `tags`, `demoUrl`, `repoUrl`, `status`, optional `coldStartNote`). No
  position field — layout is computed at runtime.
```

Replace with:

```
- `data/projects.js` — project data (`id`, `title`, `summary`, `description`,
  `tags`, `demoUrl`, `repoUrl`, `status`, `cluster`, optional
  `coldStartNote`). No position field — layout is computed at runtime.
```

Then find:

```
- `assets/js/graph-layout.js` — pure function computing node/edge coordinates
  (radial auto-layout, viewport-responsive radius). No tag/tech-stack nodes in
  the graph itself anymore — tech stack shows in the project window's
  collapsible list instead. Kept unit-tested and DOM-free.
```

Replace with:

```
- `assets/js/graph-layout.js` — pure function computing node/edge coordinates.
  Projects are grouped by `cluster` (`agentic-ai`/`cloud`/`full-stack`) onto
  their own concentric elliptical orbit around the center node, evenly
  spaced within each ring; `status: "planned"` projects sit further out on
  their own ring via `IDEA_ORBIT_MULTIPLIER`. Viewport-responsive radius.
  No tag/tech-stack nodes in the graph itself anymore — tech stack shows in
  the project window's collapsible list instead. Kept unit-tested and
  DOM-free.
```

- [ ] **Step 9: Commit**

```bash
git add assets/js/scene.js assets/css/style.css CLAUDE.md
git commit -m "$(cat <<'EOF'
feat: render cluster-colored planets, edges, and orbit rings

Node color is now a fixed cluster->color lookup instead of a
round-robin cycle. Edges pick up the same cluster color. New
buildOrbitLayer() draws a faint dashed ellipse per cluster behind the
edges/nodes so the grouping is legible without opening a project.
Also updates CLAUDE.md's Architecture section, which still described
the pre-cluster flat radial layout.
EOF
)"
```

---

## Post-plan check

After Task 3, do a final full-suite run to confirm the branch is in a clean, fully green state before requesting review/merge:

```bash
npm test
node --check assets/js/graph-layout.js
node --check assets/js/scene.js
git status --short
```

Expected: all tests pass, both syntax checks produce no output, and `git status --short` shows a clean working tree (everything committed across the 3 tasks above).
