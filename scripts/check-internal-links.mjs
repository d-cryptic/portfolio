import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content");
const collections = ["notes", "snippets"];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return walk(fullPath);
    return fullPath;
  });

const files = collections
  .map((collection) => path.join(contentRoot, collection))
  .filter((collectionPath) => {
    try {
      return statSync(collectionPath).isDirectory();
    } catch {
      return false;
    }
  })
  .flatMap((collectionPath) => walk(collectionPath))
  .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

const existingRoutes = new Set(
  files.map((file) => {
    const relative = path.relative(contentRoot, file).replace(/\\/g, "/");
    return `/${relative.replace(/\/index(?:\.mdx?)?$/i, "").replace(/\.mdx?$/i, "")}`;
  }),
);

const wikiRegex = /\[\[([^\]]+)\]\]/g;
const markdownRegex = /\[[^\]]+\]\((\/[^)\s]+)\)/g;

const issues = [];

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const relativeFile = path.relative(root, file).replace(/\\/g, "/");

  for (const match of raw.matchAll(markdownRegex)) {
    const href = match[1]?.split("#")[0];
    if (!href) continue;
    if (!href.startsWith("/notes/") && !href.startsWith("/snippets/")) continue;

    if (!existingRoutes.has(href)) {
      issues.push(`${relativeFile}: broken markdown link ${href}`);
    }
  }

  for (const match of raw.matchAll(wikiRegex)) {
    const rawLink = match[1];
    if (!rawLink) continue;

    const [target] = rawLink.split("|");
    const normalized = (target ?? "").trim().split("#")[0].replace(/\s+/g, "-").toLowerCase();
    if (!normalized) continue;

    const possibleTargets = [
      `/notes/${normalized}`,
      `/snippets/${normalized}`,
      `/${normalized}`,
    ];

    const valid = possibleTargets.some((candidate) => existingRoutes.has(candidate));
    if (!valid) {
      issues.push(`${relativeFile}: broken wikilink [[${rawLink}]]`);
    }
  }
}

if (issues.length > 0) {
  console.error("Internal link check failed:\n");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log(`Internal link check passed for ${files.length} content files.`);
