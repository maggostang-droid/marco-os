import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../assets/js/html-utils.js";

test("escapes &, <, >, and \" so they render as literal characters", () => {
  assert.equal(escapeHtml(`<b>Tom & "Jerry"</b>`), "&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;");
});

test("leaves plain text unchanged", () => {
  assert.equal(escapeHtml("sql-agent"), "sql-agent");
});
