import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resume } from "../data/resume.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("resume has the required top-level fields", () => {
  const requiredFields = ["name", "headline", "intro", "currentStations", "skills", "extendedHistory", "pdfUrl", "email", "linkedinUrl"];
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

test("email is a well-formed mailto-able address; no raw phone number is present", () => {
  assert.equal(typeof resume.email, "string");
  assert.ok(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email), "resume.email must look like a valid email address");
  const haystack = JSON.stringify(resume);
  assert.ok(!/0176/.test(haystack), "resume data must not contain the phone number");
});

test("linkedinUrl points at a linkedin.com profile", () => {
  assert.equal(typeof resume.linkedinUrl, "string");
  assert.ok(/^https:\/\/(www\.)?linkedin\.com\//.test(resume.linkedinUrl), "resume.linkedinUrl must be a linkedin.com URL");
});
