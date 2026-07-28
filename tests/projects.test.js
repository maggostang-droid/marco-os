import { test } from "node:test";
import assert from "node:assert/strict";
import { projects } from "../data/projects.js";

test("projects is a non-empty array", () => {
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length > 0);
});

test("every project has the required fields", () => {
  const requiredFields = [
    "id", "title", "summary", "description", "tags", "demoUrl", "repoUrl", "status"
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
