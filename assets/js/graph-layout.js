const BASE_RADIUS = 150;
const RADIUS_STEP_PER_EXTRA_PROJECT = 20;
const IDEA_RADIUS_MULTIPLIER = 1.35;
const REFERENCE_VIEWPORT = 1280;
const MIN_VIEWPORT_SCALE = 0.5;

function viewportScale(viewportSize) {
  if (!viewportSize) return 1;
  return Math.min(1, Math.max(MIN_VIEWPORT_SCALE, viewportSize / REFERENCE_VIEWPORT));
}

export function computeLayout(projects, viewportSize = null) {
  const nodes = [{ id: "center", type: "center", x: 0, y: 0 }];
  const edges = [];

  const scale = viewportScale(viewportSize);
  const count = projects.length;
  const baseRadius = (BASE_RADIUS + Math.max(0, count - 3) * RADIUS_STEP_PER_EXTRA_PROJECT) * scale;

  projects.forEach((project, index) => {
    const angle = (2 * Math.PI * index) / Math.max(count, 1);
    const tier = project.status === "planned" ? "idea" : "active";
    const radius = tier === "idea" ? baseRadius * IDEA_RADIUS_MULTIPLIER : baseRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({ id: project.id, type: "project", tier, x, y });
    edges.push({ from: "center", to: project.id, kind: tier });
  });

  return { nodes, edges };
}
