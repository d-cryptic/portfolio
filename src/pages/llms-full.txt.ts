import { RESUME_URL, SITE } from "@consts";
import { getCollection } from "astro:content";
import { toContentPath } from "@lib/content-paths";

const renderSection = (
  label: string,
  entries: Array<{
    title: string;
    description: string;
    date: Date;
    url: string;
    tags: string[];
    stack: string[];
    roles: string[];
    outcomes: string[];
  }>,
) => {
  const sorted = entries.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  const body = sorted.map(
    (entry) =>
      `- title: ${entry.title}\n  url: ${entry.url}\n  date: ${entry.date.toISOString()}\n  tags: ${
        entry.tags.length > 0 ? entry.tags.join(", ") : "none"
      }\n  stack: ${
        entry.stack.length > 0 ? entry.stack.join(", ") : "none"
      }\n  roles: ${
        entry.roles.length > 0 ? entry.roles.join(", ") : "none"
      }\n  outcomes: ${
        entry.outcomes.length > 0 ? entry.outcomes.join(", ") : "none"
      }\n  description: ${entry.description}`,
  );

  return [`## ${label}`, ...body, ""];
};

export async function GET() {
  const [blogPosts, projects] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
  ]);

  const lines = [
    `# ${SITE.TITLE} - Extended LLM Content Index`,
    "",
    `source: ${SITE.URL}`,
    "format: markdown-like plain text",
    `resume: ${RESUME_URL}`,
    `ai-guide: ${SITE.URL}/for-ai`,
    `geo-index: ${SITE.URL}/geo.json`,
    "",
    "## Entity Summary",
    `name: ${SITE.AUTHOR}`,
    "roles: Founding Engineer, Full-stack Engineer, AI Engineer, SRE, Platform Engineer",
    "focus: product engineering, AI workflows, scalable data systems, observability, infrastructure reliability",
    "canonical: https://barundebnath.com/",
    "",
    ...renderSection(
      "Blog Posts",
      blogPosts.map((post) => ({
        title: post.data.title,
        description: post.data.description,
        date: post.data.date,
        url: `${SITE.URL}${toContentPath("blog", post.id)}`,
        tags: post.data.tags || [],
        stack: post.data.stack || [],
        roles: post.data.roles || [],
        outcomes: post.data.outcomes || [],
      })),
    ),
    ...renderSection(
      "Projects",
      projects.map((project) => ({
        title: project.data.title,
        description: project.data.description,
        date: project.data.date,
        url: `${SITE.URL}${toContentPath("projects", project.id)}`,
        tags: project.data.tags || [],
        stack: project.data.stack || [],
        roles: project.data.roles || [],
        outcomes: project.data.outcomes || [],
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
