// Portfolio copy lives in content/*.md — edit those files on GitHub and the page follows.
// Pure parsers, so the same code runs in the browser and in node tests.
const GITHUB_USER = "csk200387";

export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const httpURL = value => (/^https?:\/\/\S+$/.test(value || "") ? value : null);
const list = value => (value || "").split(",").map(item => item.trim()).filter(Boolean);
const stripComments = md => md.replace(/<!--[\s\S]*?-->/g, "");
// Everything after each "## " line, as [title, bodyLines]; text before the first one is ignored.
const sections = md => stripComments(md).split(/^## +/m).slice(1).map(chunk => {
  const [title, ...lines] = chunk.split("\n");
  return [title.trim(), lines.map(line => line.trim())];
});

// ## Name, then "- key: value" fields (repo and tagline required), then the description paragraph(s).
export function parseProjects(md) {
  return sections(md).flatMap(([name, lines]) => {
    const fields = {}, text = [];
    for (const line of lines) {
      const field = line.match(/^-\s*([a-z]+)\s*:\s*(.*)$/i);
      if (field) fields[field[1].toLowerCase()] = field[2].trim();
      else if (line) text.push(line);
    }
    if (!fields.repo || !fields.tagline) return [];
    return [{
      name, repo: fields.repo, tagline: fields.tagline, description: text.join(" "),
      type: list(fields.type).map(type => type.toLowerCase()), tags: list(fields.tags),
      github: httpURL(fields.github) || `https://github.com/${GITHUB_USER}/${encodeURIComponent(fields.repo)}`,
      live: httpURL(fields.live),
    }];
  });
}

// ## Group, then "- item" lines.
export function parseStack(md) {
  return sections(md)
    .map(([group, lines]) => ({ group, items: lines.map(line => line.match(/^-\s+(.+)$/)?.[1]).filter(Boolean) }))
    .filter(group => group.items.length);
}

const inline = text => escapeHTML(text)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/`(.+?)`/g, "<code>$1</code>")
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

// ponytail: headings, paragraphs, "- " lists, **bold**, `code`, [links](https://…) — swap in a real parser if about.md needs more
export function renderMarkdown(md) {
  const html = [];
  let paragraph = [], items = [];
  const flush = () => {
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    if (items.length) html.push(`<ul>${items.map(item => `<li>${inline(item)}</li>`).join("")}</ul>`);
    paragraph = []; items = [];
  };
  for (const line of stripComments(md).split("\n").map(line => line.trim())) {
    const heading = line.match(/^(#{1,6})\s/), item = line.match(/^[-*]\s+(.*)$/);
    // Headings keep their "#" marks — the block reads like `cat about.md`.
    if (heading) { flush(); const tag = heading[1].length === 1 ? "h2" : "h3"; html.push(`<${tag}>${inline(line)}</${tag}>`); }
    else if (item) { if (paragraph.length) flush(); items.push(item[1]); }
    else if (line) { if (items.length) flush(); paragraph.push(line); }
    else flush();
  }
  flush();
  return html.join("\n");
}
