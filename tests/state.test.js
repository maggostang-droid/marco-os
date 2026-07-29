import { test } from "node:test";
import assert from "node:assert/strict";
import { state, subscribe, completeBoot, focusProject, closeWindow, resetState, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID, RESUME_ID, resolveFocusedNodeId } from "../assets/js/state.js";

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

test("zoomIn increases zoomLevel by 0.1", () => {
  resetState();
  zoomIn();
  assert.equal(state.zoomLevel, 1.1);
});

test("zoomOut decreases zoomLevel by 0.1", () => {
  resetState();
  zoomOut();
  assert.equal(state.zoomLevel, 0.9);
});

test("zoomIn clamps at the maximum zoom level", () => {
  resetState();
  for (let i = 0; i < 20; i += 1) zoomIn();
  assert.equal(state.zoomLevel, 1.8);
});

test("zoomOut clamps at the minimum zoom level", () => {
  resetState();
  for (let i = 0; i < 20; i += 1) zoomOut();
  assert.equal(state.zoomLevel, 0.6);
});

test("resetState resets zoomLevel back to 1", () => {
  resetState();
  zoomIn();
  resetState();
  assert.equal(state.zoomLevel, 1);
});

test("zoomIn notifies subscribers", () => {
  resetState();
  let callCount = 0;
  subscribe(() => { callCount += 1; });
  zoomIn();
  assert.equal(callCount, 1);
});

test("zoomIn at the maximum zoom level does not notify subscribers", () => {
  resetState();
  for (let i = 0; i < 20; i += 1) zoomIn();
  let callCount = 0;
  subscribe(() => { callCount += 1; });
  zoomIn();
  assert.equal(callCount, 0);
});

test("zoomOut at the minimum zoom level does not notify subscribers", () => {
  resetState();
  for (let i = 0; i < 20; i += 1) zoomOut();
  let callCount = 0;
  subscribe(() => { callCount += 1; });
  zoomOut();
  assert.equal(callCount, 0);
});

test("SECOND_BRAIN_CHAT_ID is a stable, non-empty identifier", () => {
  assert.equal(SECOND_BRAIN_CHAT_ID, "__second-brain-chat__");
});

test("focusProject accepts the second-brain sentinel id like any other id", () => {
  resetState();
  focusProject(SECOND_BRAIN_CHAT_ID);
  assert.equal(state.activeProjectId, SECOND_BRAIN_CHAT_ID);
});

test("RESUME_ID is a stable, non-empty identifier distinct from SECOND_BRAIN_CHAT_ID", () => {
  assert.equal(RESUME_ID, "__resume__");
  assert.notEqual(RESUME_ID, SECOND_BRAIN_CHAT_ID);
});

test("focusProject accepts the resume sentinel id like any other id", () => {
  resetState();
  focusProject(RESUME_ID);
  assert.equal(state.activeProjectId, RESUME_ID);
});

test("resolveFocusedNodeId maps RESUME_ID to the center node", () => {
  assert.equal(resolveFocusedNodeId(RESUME_ID), "center");
});

test("resolveFocusedNodeId maps SECOND_BRAIN_CHAT_ID to the second-brain moon node", () => {
  assert.equal(resolveFocusedNodeId(SECOND_BRAIN_CHAT_ID), "second-brain");
});

test("resolveFocusedNodeId passes through a real project id unchanged", () => {
  assert.equal(resolveFocusedNodeId("sql-agent"), "sql-agent");
});

test("resolveFocusedNodeId returns null for a null/empty input", () => {
  assert.equal(resolveFocusedNodeId(null), null);
  assert.equal(resolveFocusedNodeId(""), null);
});
