import test from "node:test";
import assert from "node:assert/strict";
import { FACE_CONSTELLATION, computeFacePlacement } from "../assets/js/face-constellation.js";

const { aspect, stars, edges } = FACE_CONSTELLATION;

test("face data: plausible star cloud in normalized coordinates", () => {
  assert.ok(stars.length >= 100, `expected a dense face, got ${stars.length} stars`);
  for (const [x, y, r] of stars) {
    assert.ok(x >= 0 && x <= 1, `x out of range: ${x}`);
    assert.ok(y >= 0 && y <= 1, `y out of range: ${y}`);
    assert.ok(r >= 0 && r <= 1, `size weight out of range: ${r}`);
  }
  // aspect: ein Gesicht ist höher als breit, aber kein Strich
  assert.ok(aspect > 0.5 && aspect < 1, `implausible aspect: ${aspect}`);
});

test("face data: edges reference existing stars, no self/duplicate edges", () => {
  assert.ok(edges.length >= stars.length * 0.7, "suspiciously few edges");
  const seen = new Set();
  for (const [a, b] of edges) {
    assert.ok(Number.isInteger(a) && Number.isInteger(b));
    assert.ok(a >= 0 && a < stars.length && b >= 0 && b < stars.length, `edge out of range: ${a},${b}`);
    assert.notEqual(a, b, "self edge");
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    assert.ok(!seen.has(key), `duplicate edge ${key}`);
    seen.add(key);
  }
});

test("face data: every star is part of the drawing (degree >= 1)", () => {
  const degree = new Array(stars.length).fill(0);
  for (const [a, b] of edges) {
    degree[a] += 1;
    degree[b] += 1;
  }
  const isolated = degree.filter((d) => d === 0).length;
  assert.equal(isolated, 0, `${isolated} isolated stars (background sky leaked in)`);
});

test("placement: null on scenes too small for a free top-right spot", () => {
  assert.equal(computeFacePlacement(720, 800), null, "narrow scene");
  assert.equal(computeFacePlacement(1280, 400), null, "flat scene");
  assert.equal(computeFacePlacement(0, 0), null);
  assert.equal(computeFacePlacement(undefined, undefined), null);
});

test("placement: face sits fully inside the scene, right-aligned, above the planet band", () => {
  for (const [w, h] of [[1600, 820], [1280, 720], [1024, 688], [2560, 1200]]) {
    const p = computeFacePlacement(w, h);
    assert.ok(p, `expected placement for ${w}x${h}`);
    assert.ok(p.x >= 0 && p.y >= 0, "inside top-left bounds");
    assert.ok(p.x + p.width <= w, "inside right bound");
    // Unterkante bleibt über dem Band des rechten full-stack-Planeten (0.5h)
    assert.ok(p.y + p.height <= h * 0.47, `bottom ${p.y + p.height} reaches into planet band for ${w}x${h}`);
    // rechts-orientiert: Gesicht beginnt in der rechten Szenenhälfte
    assert.ok(p.x > w * 0.55, `face drifted left: x=${p.x} at ${w}x${h}`);
    // Seitenverhältnis bleibt das des extrahierten Gesichts
    assert.ok(Math.abs(p.width / p.height - aspect) < 0.001);
  }
});
