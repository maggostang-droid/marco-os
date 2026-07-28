import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject } from "./state.js";
import { escapeHtml } from "./html-utils.js";

export function initScene(container, projects) {
  render();
  subscribe(render);

  function render() {
    const viewportSize = Math.min(container.clientWidth, window.innerHeight);
    const { nodes, edges } = computeLayout(projects, state.activeProjectId, viewportSize);
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const previouslyFocusedId = document.activeElement?.dataset?.nodeId ?? null;

    container.innerHTML = "";
    container.appendChild(buildEdgeLayer(edges, nodesById));
    container.appendChild(buildNodeLayer(nodes, projects));

    if (previouslyFocusedId) {
      container.querySelector(`[data-node-id="${previouslyFocusedId}"]`)?.focus();
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

function buildNodeLayer(nodes, projects) {
  const layer = document.createElement("div");
  layer.className = "graph-nodes";
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  nodes.forEach((node) => {
    const isProject = node.type === "project";
    const el = document.createElement(isProject ? "button" : "div");
    el.classList.add("node", `node--${node.type}`);
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;
    el.dataset.nodeId = node.id;

    if (node.type === "center") {
      el.innerHTML = `<span class="node-dot"></span><h1 class="node-label">Marco Stang</h1>`;
    } else if (isProject) {
      const project = projectById[node.id];
      if (node.tier === "idea") el.classList.add("node--idea");
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
