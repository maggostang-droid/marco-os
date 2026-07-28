import { test } from "node:test";
import assert from "node:assert/strict";
import { nextFocusTarget } from "../assets/js/focus-target.js";

test("opening a project fresh moves focus into the window", () => {
  assert.equal(nextFocusTarget(null, "a", false), "open-window");
});

test("switching between projects moves focus into the window", () => {
  assert.equal(nextFocusTarget("a", "b", false), "open-window");
});

test("re-rendering the same project while focus was inside the window keeps it there", () => {
  assert.equal(nextFocusTarget("a", "a", true), "open-window");
});

test("closing while focus was inside the window returns focus to that project's graph node", () => {
  assert.equal(nextFocusTarget("a", null, true), "graph-node:a");
});

test("closing without focus in the window leaves focus unchanged", () => {
  assert.equal(nextFocusTarget("a", null, false), "unchanged");
});

test("an unrelated re-render of the same project without focus in the window does not steal focus", () => {
  assert.equal(nextFocusTarget("a", "a", false), "unchanged");
});
