import { SITE } from "@consts";
import { getCollection } from "astro:content";

const renderSection = (
  label: string,
  entries: Array<{ title: string; description: string; date: Date; url: string; tags: string[] }>,
) => {
  const sorted = entries.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  const body = sorted.map(
    (entry) =>
      `- title: ${entry.title}\n  url: ${entry.url}\n  date: ${entry.date.toISOString()}\n  tags: ${
        entry.tags.length > 0 ? entry.tags.join(", ") : "none"
      }\n  description: ${entry.description}`,
  );

  return [`## ${label}`, ...body, ""];
};

export async function GET() {
  const [blogPosts, projects, notes, snippets] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
    getCollection("notes", ({ data }) => !data.draft),
    getCollection("snippets", ({ data }) => !data.draft),
  ]);

  const lines = [
    `# ${SITE.TITLE} - Extended LLM Content Index`,
    "",
    `source: ${SITE.URL}`,
    "format: markdown-like plain text",
    "",
    ...renderSection(
      "Blog Posts",
      blogPosts.map((post) => ({
        title: post.data.title,
        description: post.data.description,
        date: post.data.date,
        url: `${SITE.URL}/blog/${post.id.replace(/\/index\.mdx?$/, "")}`,
        tags: post.data.tags || [],
      })),
    ),
    ...renderSection(
      "Projects",
      projects.map((project) => ({
        title: project.data.title,
        description: project.data.description,
        date: project.data.date,
        url: `${SITE.URL}/projects/${project.id}`,
        tags: project.data.tags || [],
      })),
    ),
    ...renderSection(
      "Notes",
      notes.map((note) => ({
        title: note.data.title,
        description: note.data.description,
        date: note.data.date,
        url: `${SITE.URL}/notes/${note.id}`,
        tags: note.data.tags || [],
      })),
    ),
    ...renderSection(
      "Snippets",
      snippets.map((snippet) => ({
        title: snippet.data.title,
        description: snippet.data.description,
        date: snippet.data.date,
        url: `${SITE.URL}/snippets/${snippet.id}`,
        tags: snippet.data.tags || [],
      })),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

