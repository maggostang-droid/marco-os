const BASE_RADIUS = 170;
const RADIUS_STEP_PER_EXTRA_PROJECT = 20;
const REFERENCE_VIEWPORT = 1280;
const MIN_VIEWPORT_SCALE = 0.58;

// Skill clusters, each its own concentric elliptical orbit around the
// center node. Order determines both which ring sits innermost (first =
// smallest) and the reveal stagger order in scene.js.
const CLUSTER_ORDER = ["agentic-ai", "cloud", "full-stack"];

// rx multiplier per cluster (applied to the shared baseRadius). agentic-ai
// is the largest/most active cluster in the current portfolio, so it sits
// closest to the center; full-stack sits furthest out. Gaps between tiers
// are kept wide (not just proportionally different) so that even at the
// smallest supported viewport scale, one ring's node/label footprint
// doesn't reach into the next ring's territory.
const CLUSTER_RX_MULTIPLIER = {
  "agentic-ai": 0.95,
  cloud: 1.45,
  "full-stack": 2
};

// ry = rx * ELLIPSE_ASPECT — flattens each ring into an ellipse (wider than
// tall) instead of a circle, matching the wide viewport. Kept relatively
// tall (vs. the old 0.55) so the innermost ring still has enough vertical
// clearance around the center node's own dot+label footprint once the
// whole scene is scaled down on narrow viewports.
const ELLIPSE_ASPECT = 0.62;

// Per-ring rotation so no cluster places a node on the vertical axis
// (90deg/270deg, straight above/below the center node, where it would
// collide with the center's own label) and so the clusters' members don't
// all line up on the same radial spokes as each other. agentic-ai has 4
// members spaced 90deg apart, so 45deg puts all of them on diagonals;
// full-stack has 2 members 180deg apart, so 0deg keeps both fully
// horizontal; cloud's single member is offset well clear of both.
const CLUSTER_ANGLE_OFFSET_DEG = {
  "agentic-ai": 45,
  cloud: 200,
  "full-stack": 0
};

// Applied on top of a project's own cluster ring for status: "planned"
// projects, so they sit visibly further out than their cluster siblings —
// "not built yet" stays legible even though they're still grouped by skill.
const IDEA_ORBIT_MULTIPLIER = 1.2;

// A project with orbitsCenter: true belongs to Marco himself, not a skill
// cluster (currently just second-brain/Ask-Marco Assistant) — it skips the
// cluster-ring system entirely and instead sits on its own small, fixed
// orbit right next to the center node, like a moon. MOON_RADIUS is
// deliberately far inside even the innermost cluster ring (agentic-ai sits
// at ~0.95 * BASE_RADIUS) so it reads as "orbiting Marco", not "a tight
// cluster ring" — but still large enough to clear the center node's own
// 52px dot + glow and its "Marco Stang" label underneath (a smaller radius
// visually collided the moon and its label into Marco's own sphere). A true
// circle (no ELLIPSE_ASPECT flattening) since, unlike the wide cluster
// rings, a single small moon orbit doesn't need to match the viewport's
// aspect ratio.
const MOON_RADIUS = 140;
// -15deg (mostly rightward, barely up) sits clear of agentic-ai's own three
// member angles (45/165/285deg, each ~60deg+ away), so the moon and its
// label don't crowd whichever agentic-ai planet happens to render nearby.
const MOON_ANGLE_OFFSET_DEG = -15;

function viewportScale(viewportSize) {
  if (!viewportSize) return 1;
  return Math.min(1, Math.max(MIN_VIEWPORT_SCALE, viewportSize / REFERENCE_VIEWPORT));
}

export function computeLayout(projects, viewportSize = null) {
  const nodes = [{ id: "center", type: "center", x: 0, y: 0 }];
  const edges = [];
  const rings = [];

  const scale = viewportScale(viewportSize);

  const moonProjects = projects.filter((project) => project.orbitsCenter);
  const ringProjects = projects.filter((project) => !project.orbitsCenter);

  // Moons orbit Marco directly on their own small radius, evenly spaced if
  // there's ever more than one — entirely separate from the cluster-ring
  // system below, so they never join a ring or a cluster-colored edge.
  const moonRadius = MOON_RADIUS * scale;
  const moonAngleOffset = (MOON_ANGLE_OFFSET_DEG * Math.PI) / 180;
  moonProjects.forEach((project, index) => {
    const angle = (2 * Math.PI * index) / moonProjects.length + moonAngleOffset;
    const x = Math.cos(angle) * moonRadius;
    const y = Math.sin(angle) * moonRadius;

    nodes.push({ id: project.id, type: "project", tier: "moon", x, y });
    edges.push({ from: "center", to: project.id, kind: "moon" });
  });

  const count = ringProjects.length;
  const baseRadius = (BASE_RADIUS + Math.max(0, count - 3) * RADIUS_STEP_PER_EXTRA_PROJECT) * scale;

  const projectsByCluster = new Map();
  for (const project of ringProjects) {
    if (!CLUSTER_ORDER.includes(project.cluster)) {
      console.warn(
        `computeLayout: project "${project.id}" has unrecognized cluster "${project.cluster}" — it will not be rendered as a node.`
      );
    }
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
