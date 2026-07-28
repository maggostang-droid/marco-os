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
