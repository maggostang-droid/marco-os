import { computeLayout } from "./graph-layout.js";
import { subscribe, state, focusProject, closeWindow, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID, RESUME_ID, resolveFocusedNodeId } from "./state.js";
import { escapeHtml } from "./html-utils.js";

// Exportiert, weil starfield.js denselben effektiven Zoom für die
// gegenläufige Tiefen-Kompensation der Sternschichten braucht.
export const FOCUS_ZOOM_BONUS = 2.6;

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
    if (state.activeProjectId && !event.target.closest(".node--project, .node--center")) {
      closeWindow();
    }
  });

  let lastContentKey = null;

  render();
  subscribe(render);

  function render() {
    const viewportSize = Math.min(container.clientWidth, window.innerHeight);
    // width/height zusätzlich zu viewportSize: computeLayout passt damit den
    // äußersten Ring in die Breite ein und dreht auf Portrait-Viewports die
    // Ellipsen hochkant (siehe fitParams in graph-layout.js) — vorher liefen
    // Planeten + Labels auf Smartphones seitlich aus dem Bild.
    const { nodes, edges, rings } = computeLayout(projects, viewportSize, {
      width: container.clientWidth,
      height: container.clientHeight
    });
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const focusedProjectId = state.activeProjectId;
    // RESUME_ID and SECOND_BRAIN_CHAT_ID are UI sentinels, not real
    // graph-layout.js node ids — résumé "lives" at the center node, chat
    // "lives" at the second-brain moon node. Resolve to the real node id
    // before using it for zoom-centering or dimming, so e.g. opening the
    // chat (now reached via the moon, not the center) zooms in on and
    // un-dims the moon, not the center.
    const focusedNodeId = resolveFocusedNodeId(focusedProjectId);

    // Zoom-Bonus nur, wenn der Fokus auf einen echten Graph-Knoten zeigt —
    // das Terminal (TERMINAL_ID -> resolveFocusedNodeId null) öffnet sonst
    // mit einem ziellosen 2.6x-Zoom auf die Mitte.
    const focusedNode = focusedNodeId ? nodesById[focusedNodeId] : null;
    const effectiveZoom = state.zoomLevel * (focusedNode ? FOCUS_ZOOM_BONUS : 1);
    const translateX = focusedNode ? -focusedNode.x * effectiveZoom : 0;
    const translateY = focusedNode ? -focusedNode.y * effectiveZoom : 0;
    viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${effectiveZoom})`;

    // Edge/node geometry depends only on the project list, the focused
    // project, and viewport size — not on zoomLevel, which the transform
    // above already applies to the whole layer. Rebuilding on every zoom
    // tick (mouse wheel fires many notifies) restarted the edge-runner
    // CSS animations from scratch every time, making them visibly stutter.
    if (state.bootComplete) container.classList.add("is-revealed");

    const contentKey = `${focusedProjectId ?? ""}:${viewportSize}:${container.clientWidth}x${container.clientHeight}`;
    if (contentKey === lastContentKey) return;
    lastContentKey = contentKey;

    const previouslyFocusedId = document.activeElement?.dataset?.nodeId ?? null;

    // Center node leads its own reveal batch, then one batch per cluster
    // ring actually present (see buildNodeLayer) — not one batch per
    // project, so same-cluster planets fade in together.
    const nodeBatchCount = 1 + rings.length;

    const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

    content.innerHTML = "";
    content.appendChild(buildOrbitLayer(rings, nodeBatchCount, focusedNodeId));
    content.appendChild(buildEdgeLayer(edges, nodesById, focusedNodeId, nodeBatchCount, projectById));
    content.appendChild(buildNodeLayer(nodes, projects, focusedNodeId));

    if (previouslyFocusedId) {
      container.querySelector(`[data-node-id="${CSS.escape(previouslyFocusedId)}"]`)?.focus({ preventScroll: true });
    }
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";

// Shared by buildOrbitLayer and buildEdgeLayer: both need to know when the
// "lines" reveal phase starts (rings + edges fade in together, once every
// planet has actually finished fading in — start delay + fade duration, not
// just stagger order). Factored out so the two copies of this formula can't
// drift apart from each other in a future edit.
//
// nodeBatchCount, not project count: planets reveal in per-cluster batches
// (see buildNodeLayer), so the last batch's index is nodeBatchCount - 1, not
// the number of projects.
function edgePhaseStart(nodeBatchCount) {
  const nodePhaseEndMs = (nodeBatchCount - 1) * NODE_STAGGER_MS + NODE_FADE_MS;
  return nodePhaseEndMs + PHASE_GAP_MS;
}

// Faint dashed ellipse per skill cluster, drawn behind edges/nodes so the
// cluster grouping is legible at a glance. cx/cy as percentages center each
// ellipse on the container regardless of its pixel size — the same origin
// edges/nodes already position themselves around via `left: 50%; top: 50%`.
function buildOrbitLayer(rings, nodeBatchCount, focusedNodeId) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "graph-orbits");

  const edgePhaseStartMs = edgePhaseStart(nodeBatchCount);

  rings.forEach((ring) => {
    const ellipse = document.createElementNS(SVG_NS, "ellipse");
    ellipse.setAttribute("cx", "50%");
    ellipse.setAttribute("cy", "50%");
    ellipse.setAttribute("rx", String(ring.rx));
    ellipse.setAttribute("ry", String(ring.ry));
    ellipse.setAttribute("class", `orbit-ring orbit-ring--${ring.cluster}`);
    // Rings aren't tied to any one project, so there's no "is this the
    // focused project's ring" distinction to make — when any project is
    // focused, dim all of them together so they recede like the rest of the
    // unfocused scene instead of staying at full opacity through the ~2.6x
    // focus zoom.
    if (focusedNodeId) ellipse.classList.add("is-dimmed");
    ellipse.style.transitionDelay = `${edgePhaseStartMs}ms`;
    svg.appendChild(ellipse);
  });

  return svg;
}

function buildEdgeLayer(edges, nodesById, focusedNodeId, nodeBatchCount, projectById) {
  const layer = document.createElement("div");
  layer.className = "graph-edges";

  // Phase boundaries computed from actual finish times (start delay + fade
  // duration), not just stagger order — so e.g. the edge phase only starts
  // once the *last* planet batch has actually finished fading in, not
  // merely once it started.
  //
  // Reveal batches: edges arrive grouped by cluster (computeLayout iterates
  // CLUSTER_ORDER, same as nodes), so — like buildNodeLayer's planets — every
  // edge into the same cluster fades in together as one batch instead of
  // staggering in individually. One batch per cluster ring, so the batch
  // count matches nodeBatchCount minus the leading center-node batch.
  const edgeBatchCount = Math.max(nodeBatchCount - 1, 0);
  const edgePhaseStartMs = edgePhaseStart(nodeBatchCount);
  const edgePhaseEndMs = edgePhaseStartMs + Math.max(edgeBatchCount - 1, 0) * EDGE_STAGGER_MS + EDGE_FADE_MS;
  const runnerPhaseStartMs = edgePhaseEndMs + PHASE_GAP_MS;

  // Moon edges (kind "moon") reveal with the center's own batch-0 nodes,
  // not with the cluster planets — edgePhaseStart(1) reuses the same "start
  // delay + fade duration" formula as the cluster edges above, but for a
  // single node batch, so the moon's connector appears right after Marco
  // and the moon itself finish fading in, well before any cluster planet.
  const moonEdgePhaseStartMs = edgePhaseStart(1);

  // Only the very first build (before boot has completed) needs the long
  // phased delay — it's timed against .is-revealed being added at boot
  // completion (see the CSS rule this pairs with). Later rebuilds (e.g.
  // after focusing a project) happen once .is-revealed is already present,
  // so the animation would apply immediately regardless of delay; keep
  // runners starting right away for those, matching pre-existing behavior.
  const isInitialReveal = !state.bootComplete;

  let batchIndex = -1;
  let lastCluster = null;

  edges.forEach((edge, index) => {
    const from = nodesById[edge.from];
    const to = nodesById[edge.to];
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const isMoonEdge = edge.kind === "moon";

    // Batch by the destination project's actual cluster, not edge.kind —
    // "idea"-tier edges don't carry cluster info in their kind, but their
    // target project still belongs to a real cluster ring (see graph-layout.js),
    // so they must batch with their cluster's other edges, matching how
    // buildNodeLayer batches planets by project.cluster regardless of tier.
    // Moon edges skip this entirely — they never advance batchIndex/lastCluster,
    // so they don't shift the cluster batching of the edges that follow them.
    if (!isMoonEdge) {
      const cluster = projectById[edge.to]?.cluster ?? null;
      if (cluster !== lastCluster) {
        batchIndex += 1;
        lastCluster = cluster;
      }
    }

    const line = document.createElement("div");
    line.className = `edge edge--${edge.kind}`;
    if (focusedNodeId && edge.to !== focusedNodeId) line.classList.add("is-dimmed");
    line.style.width = `${length}px`;
    line.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${angle}deg)`;
    line.style.transitionDelay = isMoonEdge
      ? `${moonEdgePhaseStartMs}ms`
      : `${edgePhaseStartMs + batchIndex * EDGE_STAGGER_MS}ms`;

    // Positive delay so the runner sits invisible (its 0% keyframe is
    // opacity: 0) until after the whole edge-reveal phase has settled,
    // then starts flowing — the fourth and final reveal phase. Still
    // staggered per-edge so runners don't all launch in perfect lockstep.
    // Moon edges skip the runner light entirely — a short, static connector
    // to Marco doesn't need a flowing "data" animation like the cluster edges.
    if (!isMoonEdge) {
      const runner = document.createElement("div");
      runner.className = "edge-runner";
      const runnerDelayMs = isInitialReveal ? runnerPhaseStartMs + index * RUNNER_STAGGER_MS : 0;
      runner.style.animationDelay = `${runnerDelayMs}ms`;
      line.appendChild(runner);
    }

    layer.appendChild(line);
  });

  return layer;
}

// Fixed cluster -> color mapping (not round-robin) so color reinforces which
// orbit a planet belongs to instead of being purely decorative.
const CLUSTER_COLOR_CLASS = {
  "agentic-ai": "node--color-amber",
  cloud: "node--color-teal",
  "full-stack": "node--color-violet"
};

function buildNodeLayer(nodes, projects, focusedNodeId) {
  const layer = document.createElement("div");
  layer.className = "graph-nodes";
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  // Reveal batches: the center node leads (batch 0), then every planet in
  // the same cluster fades in together as one batch, instead of each planet
  // staggering in individually. Nodes already arrive grouped by cluster
  // (computeLayout iterates CLUSTER_ORDER), so a new batch starts exactly
  // when the cluster changes. Moons (tier "moon") belong to Marco, not a
  // cluster — they always reveal in batch 0 alongside the center node
  // itself, and never advance batchIndex/lastCluster, so they don't disturb
  // the cluster batching of the planets that follow them in `nodes`.
  let batchIndex = 0;
  let lastCluster = null;

  nodes.forEach((node, nodeIndex) => {
    const isProject = node.type === "project";
    const isCenter = node.type === "center";
    const isMoon = isProject && node.tier === "moon";
    const el = document.createElement(isProject || isCenter ? "button" : "div");
    el.classList.add("node", `node--${node.type}`);
    // Alle Kanten laufen radial zum Zentrum. Bei Knoten OBERHALB des
    // Zentrums (y < 0) zeigt "unterhalb des Planeten" — wo das Label
    // standardmäßig sitzt — genau Richtung Zentrum, also mitten auf die
    // eigene Verbindungslinie. Das Label wandert dort auf die zentrums-
    // abgewandte Seite (über den Planeten), wo nie eine eigene Kante liegt.
    if (isProject && node.y < 0) el.classList.add("node--label-up");
    if (isProject && focusedNodeId && node.id !== focusedNodeId) el.classList.add("is-dimmed");
    el.style.transform = `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))`;
    el.dataset.nodeId = node.id;

    const project = isProject ? projectById[node.id] : null;
    if (isProject && !isMoon && project.cluster !== lastCluster) {
      batchIndex += 1;
      lastCluster = project.cluster;
    }

    const effectiveBatch = isMoon ? 0 : batchIndex;
    const dotDelay = `${effectiveBatch * NODE_STAGGER_MS}ms`;
    const labelDelay = `${effectiveBatch * NODE_STAGGER_MS + LABEL_EXTRA_MS}ms`;
    // Lebendiges System (siehe Spec 2026-07-30-wow-features): Schwebe- und
    // Rotations-Parameter pro Node deterministisch aus dem Render-Index
    // (kein Math.random — Rebuilds, z.B. beim Fokussieren, würden sonst
    // jedes Mal andere Werte würfeln und die Animationen sichtbar springen
    // lassen). Negative Delays desynchronisieren die Phasen.
    const driftVars =
      `--float-dur: ${(4.8 + (nodeIndex % 5) * 0.7).toFixed(1)}s;` +
      ` --float-delay: ${(-((nodeIndex * 1.7) % 6)).toFixed(1)}s;` +
      ` --spin-dur: ${42 + ((nodeIndex * 11) % 42)}s`;

    if (node.type === "center") {
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(state.activeProjectId === RESUME_ID));
      el.setAttribute("aria-label", "Marco Stang — Lebenslauf öffnen");
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}; ${driftVars}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
      el.addEventListener("click", () => focusProject(RESUME_ID));
    } else {
      if (node.tier === "moon") {
        // Moons get their own neutral look, not a cluster color or one of
        // the planet-texture variants (those are sized/shaded for full
        // planets and don't scale down cleanly to moon size).
        el.classList.add("node--moon");
      } else if (node.tier === "idea") {
        el.classList.add("node--idea");
      } else {
        el.classList.add(CLUSTER_COLOR_CLASS[project.cluster]);
      }
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
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}; ${driftVars}"></span><span class="node-label" style="transition-delay: ${labelDelay}">${escapeHtml(project.title)}</span>`;
      el.addEventListener("click", () => focusProject(clickTargetId));
    }

    layer.appendChild(el);
  });

  return layer;
}
