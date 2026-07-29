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
