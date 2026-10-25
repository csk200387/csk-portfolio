import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseProjects, parseStack, renderMarkdown } from "../js/content.js";

const read = name => readFile(new URL(`../content/${name}`, import.meta.url), "utf8");

test("content/projects.md: every entry is complete, linkable, and unique", async () => {
  const projects = parseProjects(await read("projects.md"));
  assert.ok(projects.length > 0, "no '## Name' entries with repo + tagline");
  for (const p of projects) {
    assert.ok(p.name && p.description, `${p.repo}: needs a name and a description paragraph`);
    assert.match(p.github, /^https:\/\//);
    assert.ok(p.live === null || /^https?:\/\//.test(p.live), `${p.repo}: live must be an http(s) URL`);
  }
  assert.equal(new Set(projects.map(p => p.repo)).size, projects.length, "repo names must be unique");
});

test("content/stack.md and about.md render", async () => {
  const stack = parseStack(await read("stack.md"));
  assert.ok(stack.length > 0 && stack.every(g => g.group && g.items.length));
  assert.match(renderMarkdown(await read("about.md")), /<h2># about<\/h2>/);
});

test("projects: incomplete entries are skipped, unsafe links dropped, github derived from repo", () => {
  const [project, ...rest] = parseProjects("# x\n## A\n- repo: a\n- tagline: t\n- type: Data, tool\n- live: javascript:alert(1)\n\nline one\nline two\n## B\n- tagline: no repo");
  assert.equal(rest.length, 0);
  assert.deepEqual(project.type, ["data", "tool"]);
  assert.equal(project.live, null);
  assert.equal(project.github, "https://github.com/csk200387/a");
  assert.equal(project.description, "line one line two");
});

test("markdown is escaped and only http(s) links render", () => {
  const html = renderMarkdown('# t\n\n<img src=x onerror=alert(1)> **b** [ok](https://a.b) [bad](javascript:x)\n\n- **k** v\n<!-- hidden -->');
  assert.ok(!html.includes("<img") && !html.includes("hidden"));
  assert.match(html, /<strong>b<\/strong>/);
  assert.match(html, /<a href="https:\/\/a\.b" target="_blank" rel="noreferrer">ok<\/a>/);
  assert.ok(!html.includes('href="javascript'));
  assert.match(html, /<ul><li><strong>k<\/strong> v<\/li><\/ul>/);
});
