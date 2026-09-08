import test from "node:test";
import assert from "node:assert/strict";
import { createSignalPoints, signalTarget, filterProjects } from "../js/signal-model.js";
import { PROJECTS } from "../js/portfolio-data.js";

test("the explorer retains 216 finite points across every mode and slider extreme", () => {
  const points = createSignalPoints(37);
  assert.equal(points.length, 216);
  for (const mode of ["scatter", "grid", "orbit"]) {
    for (const spread of [0, 45, 100]) {
      for (const point of points) {
        const target = signalTarget(point, mode, spread);
        assert.equal(target.length, 3);
        assert.ok(target.every(value => Number.isFinite(value) && Math.abs(value) < 1.6));
      }
    }
  }
});

test("reset changes the free pattern while preserving point identity and regular geometry", () => {
  const first = createSignalPoints(37);
  const repeated = createSignalPoints(37);
  const next = createSignalPoints(38);
  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first.map(p => p.scatter), next.map(p => p.scatter));
  assert.deepEqual(first.map(p => p.grid), next.map(p => p.grid));
  assert.equal(new Set(first.map(p => p.grid.join(","))).size, 216);
});

test("increasing spread expands the point cloud without producing invalid camera coordinates", () => {
  const points = createSignalPoints(5);
  for (const mode of ["scatter", "grid", "orbit"]) {
    const extent = spread => points.reduce((sum, point) => sum + Math.hypot(...signalTarget(point, mode, spread)), 0);
    assert.ok(extent(100) > extent(0));
  }
  assert.deepEqual(signalTarget(points[0], "grid", -100), signalTarget(points[0], "grid", 0));
  assert.deepEqual(signalTarget(points[0], "grid", 500), signalTarget(points[0], "grid", 100));
});

test("search handles Korean descriptions, English tags, case, and surrounding whitespace", () => {
  assert.deepEqual(filterProjects(PROJECTS, "all", "  tABULAr   csv  ").map(p => p.repo), ["tabular-lens"]);
  assert.deepEqual(filterProjects(PROJECTS, "all", "기념일").map(p => p.repo), ["AnniCal"]);
  assert.deepEqual(filterProjects(PROJECTS, "all", "privacy-first").map(p => p.repo), ["netflix-stats-viewer"]);
});

test("search and category apply together, including projects in multiple categories", () => {
  assert.equal(filterProjects(PROJECTS, "data", "tabular").length, 1);
  assert.equal(filterProjects(PROJECTS, "tool", "tabular").length, 1);
  assert.equal(filterProjects(PROJECTS, "data", "기념일").length, 0);
  assert.equal(filterProjects(PROJECTS, "tool", "기념일").length, 1);
});

test("empty and unmatched queries are safe and preserve the curated order", () => {
  const original = structuredClone(PROJECTS);
  assert.deepEqual(filterProjects(PROJECTS, "all", "  "), PROJECTS);
  assert.deepEqual(filterProjects(PROJECTS, "all", '<img src=x onerror="alert(1)">'), []);
  assert.deepEqual(PROJECTS, original);
});
