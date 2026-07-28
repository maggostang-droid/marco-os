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
    { id: "a", status: "coming-soon", tags: [] },
    { id: "b", status: "planned", tags: [] }
  ];
  const { nodes, edges } = computeLayout(projects);
  assert.equal(nodes.length, 3);
  assert.equal(edges.length, 2);
  assert.ok(nodes.some((n) => n.id === "a"));
  assert.ok(nodes.some((n) => n.id === "b"));
});

test("planned projects sit further from the center than active ones", () => {
  const projects = [
    { id: "active", status: "coming-soon", tags: [] },
    { id: "idea", status: "planned", tags: [] }
  ];
  const { nodes } = computeLayout(projects);
  const dist = (id) => {
    const node = nodes.find((n) => n.id === id);
    return Math.hypot(node.x, node.y);
  };
  assert.ok(dist("idea") > dist("active"));
});

test("renders tag nodes only for the focused project", () => {
  const projects = [
    { id: "a", status: "coming-soon", tags: ["Python", "SQL"] },
    { id: "b", status: "planned", tags: ["React"] }
  ];
  const { nodes } = computeLayout(projects, "a");
  assert.ok(nodes.some((n) => n.id === "a:Python"));
  assert.ok(nodes.some((n) => n.id === "a:SQL"));
  assert.ok(!nodes.some((n) => n.id === "b:React"));
});

test("base radius grows once there are more than three projects", () => {
  const makeProjects = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: `p${i}`, status: "coming-soon", tags: [] }));

  const distOfFirst = (count) => {
    const { nodes } = computeLayout(makeProjects(count));
    const node = nodes.find((n) => n.id === "p0");
    return Math.hypot(node.x, node.y);
  };

  assert.ok(distOfFirst(5) > distOfFirst(3));
});
