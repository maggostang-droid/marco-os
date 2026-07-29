import { test } from "node:test";
import assert from "node:assert/strict";
import { projects } from "../data/projects.js";

test("projects is a non-empty array", () => {
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length > 0);
});

test("every project has the required fields", () => {
  const requiredFields = [
    "id", "title", "summary", "description", "tags", "demoUrl", "repoUrl", "status", "cluster"
  ];
  for (const project of projects) {
    for (const field of requiredFields) {
      assert.ok(field in project, `${project.id ?? "<unknown>"} is missing "${field}"`);
    }
    assert.ok(Array.isArray(project.tags), `${project.id} tags must be an array`);
  }
});

test("every project id is unique", () => {
  const ids = projects.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("demoUrl and repoUrl are either a string or null", () => {
  for (const project of projects) {
    for (const field of ["demoUrl", "repoUrl"]) {
      const value = project[field];
      assert.ok(
        value === null || typeof value === "string",
        `${project.id}.${field} must be string or null, got ${typeof value}`
      );
    }
  }
});

test("status is a non-empty string", () => {
  for (const project of projects) {
    assert.equal(typeof project.status, "string", `${project.id}.status must be a string`);
    assert.ok(project.status.length > 0, `${project.id}.status must not be empty`);
  }
});

test("every project has a valid cluster", () => {
  const validClusters = ["agentic-ai", "cloud", "full-stack"];
  for (const project of projects) {
    assert.ok(
      validClusters.includes(project.cluster),
      `${project.id}.cluster must be one of ${validClusters.join(", ")}, got ${project.cluster}`
    );
  }
});
