import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resume } from "../data/resume.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("resume has the required top-level fields", () => {
  const requiredFields = ["name", "headline", "intro", "currentStations", "skills", "extendedHistory", "pdfUrl"];
  for (const field of requiredFields) {
    assert.ok(field in resume, `resume is missing "${field}"`);
  }
});

test("currentStations is a non-empty array of well-formed stations", () => {
  assert.ok(Array.isArray(resume.currentStations));
  assert.ok(resume.currentStations.length > 0);
  for (const station of resume.currentStations) {
    assert.equal(typeof station.role, "string");
    assert.equal(typeof station.org, "string");
    assert.equal(typeof station.period, "string");
    assert.ok(Array.isArray(station.bullets) && station.bullets.length > 0);
  }
});

test("skills is a non-empty array of strings", () => {
  assert.ok(Array.isArray(resume.skills));
  assert.ok(resume.skills.length > 0);
  for (const skill of resume.skills) assert.equal(typeof skill, "string");
});

test("extendedHistory is a non-empty array of strings", () => {
  assert.ok(Array.isArray(resume.extendedHistory));
  assert.ok(resume.extendedHistory.length > 0);
  for (const line of resume.extendedHistory) assert.equal(typeof line, "string");
});

test("pdfUrl is a relative path ending in .pdf", () => {
  assert.equal(typeof resume.pdfUrl, "string");
  assert.ok(resume.pdfUrl.endsWith(".pdf"));
  assert.ok(!resume.pdfUrl.startsWith("/"), "pdfUrl should be relative so it works under any base path");
});

test("pdfUrl points to a file that actually exists on disk", () => {
  const resolvedPath = path.join(repoRoot, resume.pdfUrl);
  assert.ok(existsSync(resolvedPath), `resume.pdfUrl "${resume.pdfUrl}" does not exist at ${resolvedPath}`);
});

test("no rendered field contains a raw phone number or email address", () => {
  const haystack = JSON.stringify(resume);
  assert.ok(!/@/.test(haystack), "resume data must not contain an email address");
  assert.ok(!/0176|t-online/.test(haystack), "resume data must not contain the phone number or personal email domain");
});
