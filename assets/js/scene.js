import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject, closeWindow, zoomIn, zoomOut } from "./state.js";
import { escapeHtml } from "./html-utils.js";

const FOCUS_ZOOM_BONUS = 2.6;

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
    const { nodes, edges } = computeLayout(projects, viewportSize);
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
}

const EDGE_RUNNER_STAGGER_S = 0.7;

function buildEdgeLayer(edges, nodesById, focusedProjectId) {
  const layer = document.createElement("div");
  layer.className = "graph-edges";

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

    // Staggered negative delay so runners on different edges don't all
    // travel in lockstep.
    const runner = document.createElement("div");
    runner.className = "edge-runner";
    runner.style.animationDelay = `-${(index * EDGE_RUNNER_STAGGER_S).toFixed(1)}s`;
    line.appendChild(runner);

    layer.appendChild(line);
  });

  return layer;
}

const PLANET_TEXTURE_VARIANTS = ["node--planet-shaded", "node--planet-ringed", "node--planet-blotchy"];

function buildNodeLayer(nodes, projects, focusedProjectId) {
  const layer = document.createElement("div");
  layer.className = "graph-nodes";
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  // Cycle through the texture variants in render order (not a content hash)
  // so with only 3 variants and few planet nodes, every variant actually
  // gets used instead of coincidentally landing on the same one repeatedly.
  let planetIndex = 0;
  const nextPlanetVariant = () => PLANET_TEXTURE_VARIANTS[planetIndex++ % PLANET_TEXTURE_VARIANTS.length];

  nodes.forEach((node) => {
    const isProject = node.type === "project";
    const el = document.createElement(isProject ? "button" : "div");
    el.classList.add("node", `node--${node.type}`);
    if (isProject && focusedProjectId && node.id !== focusedProjectId) el.classList.add("is-dimmed");
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;
    el.dataset.nodeId = node.id;

    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
      el.innerHTML = `<span class="node-dot"></span><h1 class="node-label">Marco Stang</h1>`;
    } else {
      const project = projectById[node.id];
      if (node.tier === "idea") el.classList.add("node--idea");
      el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(node.id === state.activeProjectId));
      el.innerHTML = `<span class="node-dot"></span><span class="node-label">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(node.id));
    }

    layer.appendChild(el);
  });

  return layer;
}
