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
  // agentic-ai's rx multiplier is 0.95 (of BASE_RADIUS 170) and its angle
  // offset is 45°, so a single project does NOT land on the ellipse's major
  // axis — recompute the expected point from the same constants instead of
  // hardcoding a plain distance, since x and y both depend on rx and ry here.
  const rx = 170 * 0.95;
  const ry = rx * 0.62;
  const angle = (45 * Math.PI) / 180;
  assert.ok(Math.abs(node.x - Math.cos(angle) * rx) < 1e-9);
  assert.ok(Math.abs(node.y - Math.sin(angle) * ry) < 1e-9);
});
