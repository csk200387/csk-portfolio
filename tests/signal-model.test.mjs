import test from "node:test";
import assert from "node:assert/strict";
import { filterProjects } from "../js/signal-model.js";
import { PROJECTS } from "../js/portfolio-data.js";

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
