import { SITE } from "@consts";
import { getCollection } from "astro:content";

export async function GET() {
  const [blogPosts, projectPosts, notesPosts, snippetPosts] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
    getCollection("notes", ({ data }) => !data.draft),
    getCollection("snippets", ({ data }) => !data.draft),
  ]);

  const topBlog = blogPosts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 10)
    .map((post) => `- ${post.data.title}: ${SITE.URL}/blog/${post.id.replace(/\/index\.mdx?$/, "")}`);

  const topProjects = projectPosts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 8)
    .map((project) => `- ${project.data.title}: ${SITE.URL}/projects/${project.id}`);

  const lines = [
    `# ${SITE.TITLE} - LLM Index`,
    "",
    `Site: ${SITE.URL}`,
    `Description: ${SITE.DESCRIPTION}`,
    "Primary topics: SRE, platform engineering, systems, DevOps, productivity",
    "",
    "## Key URLs",
    `- Home: ${SITE.URL}/`,
    `- Blog: ${SITE.URL}/blog`,
    `- Projects: ${SITE.URL}/projects`,
    `- Notes: ${SITE.URL}/notes`,
    `- Snippets: ${SITE.URL}/snippets`,
    `- Tags: ${SITE.URL}/tags`,
    `- RSS: ${SITE.URL}/rss.xml`,
    `- Sitemap: ${SITE.URL}/sitemap.xml`,
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
    `- Notes: ${notesPosts.length}`,
    `- Snippets: ${snippetPosts.length}`,
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
