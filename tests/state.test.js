import { test } from "node:test";
import assert from "node:assert/strict";
import { state, subscribe, completeBoot, focusProject, closeWindow, resetState } from "../assets/js/state.js";

test("completeBoot flips bootComplete to true", () => {
  resetState();
  completeBoot();
  assert.equal(state.bootComplete, true);
});

test("focusProject sets activeProjectId", () => {
  resetState();
  focusProject("sql-agent");
  assert.equal(state.activeProjectId, "sql-agent");
});

test("closeWindow clears activeProjectId", () => {
  resetState();
  focusProject("sql-agent");
  closeWindow();
  assert.equal(state.activeProjectId, null);
});

test("subscribers are notified on every state change", () => {
  resetState();
  let callCount = 0;
  subscribe(() => { callCount += 1; });
  focusProject("sql-agent");
  closeWindow();
  assert.equal(callCount, 2);
});

test("unsubscribe stops further notifications", () => {
  resetState();
  let callCount = 0;
  const unsubscribe = subscribe(() => { callCount += 1; });
  focusProject("sql-agent");
  unsubscribe();
  closeWindow();
  assert.equal(callCount, 1);
});
