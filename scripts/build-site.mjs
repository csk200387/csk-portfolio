// Optional Sites bundle. The source remains a build-free GitHub Pages site.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const originIndex = process.argv.indexOf("--origin");
const origin = originIndex === -1 ? "https://csk200387.github.io/csk-portfolio" : process.argv[originIndex + 1];
if (!origin || !/^https:\/\//.test(origin)) throw new Error("Provide a trusted HTTPS origin.");
const baseURL = new URL(origin);
if (baseURL.username || baseURL.password || baseURL.search || baseURL.hash) throw new Error("Invalid origin.");
const files = ["index.html", "css/styles.css", "js/main.js", "js/ascii-art.js", "js/content.js", "js/signal-model.js", "content/about.md", "content/projects.md", "content/stack.md", "public/og.png"];
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".png": "image/png", ".md": "text/plain; charset=utf-8" };
const assets = [];
for (const file of files) {
  let data = await readFile(path.join(root, file));
  if (file === "index.html") {
    data = Buffer.from(data.toString().replaceAll("https://csk200387.github.io/csk-portfolio/public/og.png", `${origin.replace(/\/$/, "")}/public/og.png`));
  }
  const binary = file.endsWith(".png");
  assets.push([`/${file}`, { type: types[path.extname(file)], data: data.toString(binary ? "base64" : "utf8"), binary, size: data.length }]);
}
const worker = `// Generated from the allowlisted portfolio assets; no runtime dependencies.
const assets = new Map(${JSON.stringify(assets)});
export default {
  fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    const pathname = new URL(request.url).pathname;
    const asset = assets.get(pathname === "/" ? "/index.html" : pathname);
    if (!asset) return new Response("Not found", { status: 404 });
    const headers = { "Content-Type": asset.type, "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff", "Content-Length": String(asset.size) };
    const body = request.method === "HEAD" ? null : asset.binary ? Uint8Array.from(atob(asset.data), char => char.charCodeAt(0)) : asset.data;
    return new Response(body, { headers });
  }
};
`;
await mkdir(path.join(root, "dist/server"), { recursive: true });
await writeFile(path.join(root, "dist/server/index.js"), worker);
console.log(`Built ${assets.length} portfolio assets for Sites (${Buffer.byteLength(worker)} bytes).`);
