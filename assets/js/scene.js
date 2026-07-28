import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject, zoomIn, zoomOut } from "./state.js";
import { escapeHtml } from "./html-utils.js";

const FOCUS_ZOOM_BONUS = 1.6;

export function initScene(container, projects) {
  const viewport = document.createElement("div");
  viewport.className = "graph-viewport";
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

  render();
  subscribe(render);

  function render() {
    const viewportSize = Math.min(container.clientWidth, window.innerHeight);
    const { nodes, edges } = computeLayout(projects, state.activeProjectId, viewportSize);
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const previouslyFocusedId = document.activeElement?.dataset?.nodeId ?? null;

    const effectiveZoom = state.zoomLevel * (state.activeProjectId ? FOCUS_ZOOM_BONUS : 1);
    viewport.style.transform = `scale(${effectiveZoom})`;

    viewport.innerHTML = "";
    viewport.appendChild(buildEdgeLayer(edges, nodesById));
    viewport.appendChild(buildNodeLayer(nodes, projects));

    if (previouslyFocusedId) {
      container.querySelector(`[data-node-id="${CSS.escape(previouslyFocusedId)}"]`)?.focus({ preventScroll: true });
    }
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

const PLANET_TEXTURE_VARIANTS = ["node--planet-shaded", "node--planet-ringed", "node--planet-blotchy"];

function buildNodeLayer(nodes, projects) {
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
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;
    el.dataset.nodeId = node.id;

    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
      el.innerHTML = `<span class="node-dot"></span><h1 class="node-label">Marco Stang</h1>`;
    } else if (isProject) {
      const project = projectById[node.id];
      if (node.tier === "idea") el.classList.add("node--idea");
      el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(node.id === state.activeProjectId));
      el.innerHTML = `<span class="node-dot"></span><span class="node-label">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(node.id));
    } else {
      el.innerHTML = `<span class="node-dot"></span><span class="node-label">${escapeHtml(node.label)}</span>`;
    }

    layer.appendChild(el);
  });

  return layer;
}
