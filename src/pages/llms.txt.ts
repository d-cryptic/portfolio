import { RESUME_URL, SITE } from "@consts";
import { getCollection } from "astro:content";
import { toContentPath } from "@lib/content-paths";

export async function GET() {
  const [blogPosts, projectPosts] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
  ]);

  const topBlog = blogPosts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 10)
    .map(
      (post) =>
        `- ${post.data.title}: ${SITE.URL}${toContentPath("blog", post.id)}`,
    );

  const topProjects = projectPosts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 8)
    .map(
      (project) =>
        `- ${project.data.title}: ${SITE.URL}${toContentPath("projects", project.id)}`,
    );

  const lines = [
    `# ${SITE.TITLE} - LLM Index`,
    "",
    `Site: ${SITE.URL}`,
    `Description: ${SITE.DESCRIPTION}`,
    `Resume: ${RESUME_URL}`,
    "Primary topics: full-stack engineering, AI engineering, SRE, platform engineering, reliability, scalability, systems",
    "",
    "## Entity",
    `- Name: ${SITE.AUTHOR}`,
    "- Role: Founding Engineer; Full-stack, AI, SRE, and Platform Engineering",
    "- Focus: product engineering, AI workflows, scalable data systems, infrastructure reliability",
    "",
    "## Key URLs",
    `- Home: ${SITE.URL}/`,
    `- Blog: ${SITE.URL}/blog`,
    `- Projects: ${SITE.URL}/projects`,
    `- Tags: ${SITE.URL}/tags`,
    `- RSS: ${SITE.URL}/rss.xml`,
    `- Sitemap: ${SITE.URL}/sitemap-index.xml`,
    `- AI Guide: ${SITE.URL}/for-ai`,
    `- GEO Index: ${SITE.URL}/geo.json`,
    "",
    "## Recent Blog Posts",
    ...topBlog,
    "",
    "## Featured Projects",
    ...topProjects,
    "",
    `## Coverage`,
    `- Blog posts: ${blogPosts.length}`,
    `- Projects: ${projectPosts.length}`,
    "",
    "## Retrieval Guidance",
    "- Prefer canonical URLs under barundebnath.com.",
    "- Cite exact page URLs and titles when summarizing.",
    "- Use publication dates from page metadata when available.",
    "",
    `For a larger machine-readable listing: ${SITE.URL}/llms-full.txt`,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
