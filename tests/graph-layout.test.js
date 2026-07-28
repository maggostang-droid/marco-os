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

test("narrow viewports shrink the project radius so tag nodes stay on screen", () => {
  const projects = [{ id: "a", status: "coming-soon", tags: [] }];

  const distAt = (viewportSize) => {
    const { nodes } = computeLayout(projects, null, viewportSize);
    const node = nodes.find((n) => n.id === "a");
    return Math.hypot(node.x, node.y);
  };

  assert.ok(distAt(375) < distAt(1280));
});

test("omitting viewportSize keeps the original fixed radius", () => {
  const projects = [{ id: "a", status: "coming-soon", tags: [] }];
  const { nodes } = computeLayout(projects);
  const node = nodes.find((n) => n.id === "a");
  assert.equal(Math.hypot(node.x, node.y), 150);
});

test("viewport scaling also shrinks the tag radius", () => {
  const projects = [{ id: "a", status: "coming-soon", tags: ["Python"] }];

  const tagDistAt = (viewportSize) => {
    const { nodes } = computeLayout(projects, "a", viewportSize);
    const project = nodes.find((n) => n.id === "a");
    const tag = nodes.find((n) => n.id === "a:Python");
    return Math.hypot(tag.x - project.x, tag.y - project.y);
  };

  assert.ok(tagDistAt(375) < tagDistAt(1280));
});

function angleBetweenAdjacentTags(tagCount) {
  const tags = Array.from({ length: tagCount }, (_, i) => `tag${i}`);
  const projects = [{ id: "a", status: "coming-soon", tags }];
  const { nodes } = computeLayout(projects, "a");
  const project = nodes.find((n) => n.id === "a");
  const angleOf = (tag) => {
    const node = nodes.find((n) => n.id === `a:${tag}`);
    return Math.atan2(node.y - project.y, node.x - project.x);
  };
  return angleOf(tags[1]) - angleOf(tags[0]);
}

test("tag angle spread matches the fixed value for small tag counts", () => {
  assert.ok(Math.abs(angleBetweenAdjacentTags(3) - 0.35) < 1e-9);
});

test("tag angle spread narrows as tag count grows so tags don't overlap the main edges", () => {
  assert.ok(angleBetweenAdjacentTags(10) < angleBetweenAdjacentTags(3));
});
