import { existsSync } from "node:fs";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const rootDir = process.cwd();
const blogDir = join(rootDir, "src/content/blog");
const outputDir = join(rootDir, "public/images/blog-thumbnails");
const markdownImagePattern = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const centeredMarkdownImagePattern =
  /<center>\s*!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*<\/center>/i;
const palette = [
  {
    accent: "#00a884",
    glow: "rgba(0, 168, 132, 0.18)",
    soft: "rgba(0, 168, 132, 0.08)",
  },
  {
    accent: "#7c5cff",
    glow: "rgba(124, 92, 255, 0.18)",
    soft: "rgba(124, 92, 255, 0.08)",
  },
  {
    accent: "#c66f00",
    glow: "rgba(198, 111, 0, 0.18)",
    soft: "rgba(198, 111, 0, 0.08)",
  },
  {
    accent: "#2f7dd1",
    glow: "rgba(47, 125, 209, 0.18)",
    soft: "rgba(47, 125, 209, 0.08)",
  },
];

const splitFrontmatter = (content) => {
  if (!content.startsWith("---")) {
    return { frontmatter: "", body: content };
  }

  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: "", body: content };
  }

  return {
    frontmatter: content.slice(3, end),
    body: content.slice(end + 4),
  };
};

const hasMarkdownImage = (body) =>
  centeredMarkdownImagePattern.test(body) || markdownImagePattern.test(body);

const stripQuotes = (value) => value.trim().replace(/^["']|["']$/g, "");

const parseScalar = (frontmatter, key) => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1] ? stripQuotes(match[1]) : undefined;
};

const parseTags = (frontmatter) => {
  const inlineMatch = frontmatter.match(/^tags:\s*\[(.*)]\s*$/m);
  if (inlineMatch?.[1]) {
    return inlineMatch[1].split(",").map(stripQuotes).filter(Boolean);
  }

  const blockMatch = frontmatter.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (!blockMatch?.[1]) {
    return [];
  }

  return blockMatch[1]
    .split("\n")
    .map((line) => line.match(/^\s+-\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(stripQuotes);
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));

const getPalette = (slug) => {
  const score = [...slug].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[score % palette.length];
};

const collectPostsNeedingThumbnails = async () => {
  const entries = await readdir(blogDir, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const slug = entry.name;
    const filePath = join(blogDir, slug, "index.mdx");

    if (!existsSync(filePath)) {
      continue;
    }

    const content = await readFile(filePath, "utf8");
    const { frontmatter, body } = splitFrontmatter(content);

    if (/^\s*draft:\s*true\s*$/m.test(frontmatter) || hasMarkdownImage(body)) {
      continue;
    }

    posts.push({
      slug,
      title: parseScalar(frontmatter, "title") ?? slug,
      description: parseScalar(frontmatter, "description") ?? "",
      date: parseScalar(frontmatter, "date") ?? "",
      tags: parseTags(frontmatter),
    });
  }

  return posts;
};

const renderPoster = (post) => {
  const colors = getPalette(post.slug);
  const tags = post.tags.slice(0, 4);
  const fallbackTag = post.tags[0] ?? "systems";
  const dateLabel = post.date ? formatDate(post.date) : "Field note";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f7efe5;
        color: #171411;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }

      .poster {
        position: relative;
        width: 1200px;
        height: 675px;
        overflow: hidden;
        padding: 56px;
        background:
          linear-gradient(90deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px) 0 0 / 48px 48px,
          linear-gradient(0deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px) 0 0 / 48px 48px,
          radial-gradient(circle at 78% 18%, ${colors.glow}, transparent 34%),
          radial-gradient(circle at 14% 88%, ${colors.soft}, transparent 30%),
          #f7efe5;
      }

      .poster::before {
        position: absolute;
        inset: 24px;
        content: "";
        border: 2px solid #171411;
        box-shadow: 10px 10px 0 ${colors.accent};
      }

      .chrome {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #171411;
        padding-bottom: 18px;
        font-size: 24px;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .status {
        color: ${colors.accent};
        font-weight: 800;
      }

      h1 {
        position: relative;
        z-index: 1;
        max-width: 910px;
        margin: 54px 0 0;
        font-size: 66px;
        line-height: 1.02;
        letter-spacing: 0;
        text-wrap: balance;
      }

      .description {
        position: relative;
        z-index: 1;
        max-width: 750px;
        margin: 28px 0 0;
        color: rgba(23, 20, 17, 0.72);
        font-size: 25px;
        line-height: 1.45;
      }

      .tags {
        position: absolute;
        bottom: 58px;
        left: 56px;
        z-index: 1;
        display: flex;
        max-width: 700px;
        flex-wrap: wrap;
        gap: 12px;
      }

      .tag {
        border: 1px solid rgba(23, 20, 17, 0.32);
        border-radius: 999px;
        background: rgba(247, 239, 229, 0.82);
        padding: 8px 14px;
        font-size: 22px;
      }

      .node {
        position: absolute;
        right: 86px;
        top: 166px;
        z-index: 1;
        display: grid;
        width: 192px;
        height: 192px;
        place-items: center;
        border: 2px solid #171411;
        background: ${colors.accent};
        color: #f7efe5;
        font-size: 74px;
        font-weight: 900;
        text-transform: uppercase;
        box-shadow: 8px 8px 0 #171411;
      }

      .sigil {
        position: absolute;
        right: 86px;
        bottom: 82px;
        z-index: 1;
        border: 2px solid #171411;
        background: rgba(247, 239, 229, 0.9);
        color: ${colors.accent};
        padding: 14px 18px;
        font-size: 46px;
        font-weight: 900;
        line-height: 1;
        box-shadow: 6px 6px 0 ${colors.accent};
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <div class="chrome">
        <span>Blog Field Note</span>
        <span class="status">${escapeHtml(dateLabel)}</span>
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="description">${escapeHtml(post.description)}</p>
      <div class="node">${escapeHtml(fallbackTag.slice(0, 2))}</div>
      <div class="sigil">&gt;_</div>
      <div class="tags">
        ${tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}
      </div>
    </main>
  </body>
</html>`;
};

const main = async () => {
  const posts = await collectPostsNeedingThumbnails();

  if (posts.length === 0) {
    console.log("All published blog posts already have source images.");
    return;
  }

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 675 },
    deviceScaleFactor: 1,
  });

  try {
    for (const post of posts) {
      await page.setContent(renderPoster(post), {
        waitUntil: "load",
      });
      await page.screenshot({
        path: join(outputDir, `${post.slug}.png`),
        fullPage: false,
      });
      console.log(`Generated thumbnail for ${post.slug}`);
    }
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
