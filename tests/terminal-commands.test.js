import { test } from "node:test";
import assert from "node:assert/strict";
import { executeCommand, completeInput } from "../assets/js/terminal-commands.js";
import { formatRelativeDe } from "../assets/js/github-activity.js";
import { TOUR_STEPS } from "../assets/js/tour.js";
import { projects } from "../data/projects.js";
import { resume } from "../data/resume.js";

const ctx = { projects, resume };

test("empty input returns no lines and no action", () => {
  const { lines, action } = executeCommand("   ", ctx);
  assert.equal(lines.length, 0);
  assert.equal(action, undefined);
});

test("help lists every documented command", () => {
  const { lines } = executeCommand("help", ctx);
  const text = lines.map((l) => l.text).join("\n");
  for (const cmd of ["ls", "open", "demo", "repo", "cat", "tour", "clear", "exit"]) {
    assert.ok(text.includes(cmd), `help must mention "${cmd}"`);
  }
});

test("ls lists every project id", () => {
  const { lines } = executeCommand("ls", ctx);
  const text = lines.map((l) => l.text).join("\n");
  for (const project of projects) {
    assert.ok(text.includes(project.id), `ls must list "${project.id}"`);
  }
});

test("open with a valid id returns an open action", () => {
  const { action } = executeCommand("open sql-agent", ctx);
  assert.deepEqual(action, { type: "open", id: "sql-agent" });
});

test("open lebenslauf opens the resume window", () => {
  assert.equal(executeCommand("open lebenslauf", ctx).action.type, "open-resume");
});

test("open with an unknown id errors without an action", () => {
  const { lines, action } = executeCommand("open kaffeemaschine", ctx);
  assert.equal(action, undefined);
  assert.ok(lines.some((l) => l.kind === "error"));
});

test("demo returns open-url only for projects with a live demoUrl", () => {
  const live = projects.find((p) => p.demoUrl);
  const dead = projects.find((p) => !p.demoUrl);
  assert.equal(executeCommand(`demo ${live.id}`, ctx).action.url, live.demoUrl);
  assert.equal(executeCommand(`demo ${dead.id}`, ctx).action, undefined);
});

test("demo action carries an analytics track name", () => {
  const live = projects.find((p) => p.demoUrl);
  assert.equal(executeCommand(`demo ${live.id}`, ctx).action.track, `demo-${live.id}`);
});

test("cat lebenslauf.txt prints name and headline", () => {
  const text = executeCommand("cat lebenslauf.txt", ctx).lines.map((l) => l.text).join("\n");
  assert.ok(text.includes(resume.name));
  assert.ok(text.includes(resume.headline));
});

test("unknown commands answer with an error line and help hint", () => {
  const { lines } = executeCommand("frobnicate", ctx);
  assert.ok(lines.some((l) => l.kind === "error"));
  assert.ok(lines.some((l) => l.text.includes("help")));
});

test("clear and exit map to their actions", () => {
  assert.equal(executeCommand("clear", ctx).action.type, "clear");
  assert.equal(executeCommand("exit", ctx).action.type, "exit");
});

test("tab completion completes a unique command prefix", () => {
  const { replaceWith } = completeInput("he", ctx);
  assert.equal(replaceWith, "help ");
});

test("tab completion completes project ids after open/demo/repo", () => {
  const { replaceWith } = completeInput("open sql", ctx);
  assert.equal(replaceWith, "open sql-agent");
});

test("tab completion lists multiple matches without replacing", () => {
  const { matches, replaceWith } = completeInput("open ai-a", ctx);
  assert.ok(matches.length >= 2, `expected >=2 matches, got ${matches}`);
  assert.equal(replaceWith, null);
});

test("formatRelativeDe covers today/yesterday/days/months", () => {
  const now = new Date("2026-07-30T12:00:00Z");
  const iso = (daysAgo) => new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();
  assert.equal(formatRelativeDe(iso(0), now), "heute");
  assert.equal(formatRelativeDe(iso(1), now), "gestern");
  assert.equal(formatRelativeDe(iso(12), now), "vor 12 Tagen");
  assert.equal(formatRelativeDe(iso(90), now), "vor 3 Monaten");
  assert.equal(formatRelativeDe("kein-datum", now), null);
});

test("every non-final tour step targets an existing project", () => {
  const ids = new Set(projects.map((p) => p.id));
  for (const step of TOUR_STEPS.slice(0, -1)) {
    assert.ok(ids.has(step.id), `tour step "${step.id}" must exist in data/projects.js`);
  }
  assert.equal(TOUR_STEPS.at(-1).last, true);
});
