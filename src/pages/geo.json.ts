import { SITE } from "@consts";
import { getCollection } from "astro:content";

export async function GET() {
  const [blogPosts, projectPosts, notesPosts, snippetPosts] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
    getCollection("notes", ({ data }) => !data.draft),
    getCollection("snippets", ({ data }) => !data.draft),
  ]);

  const response = {
    site: {
      name: SITE.TITLE,
      url: SITE.URL,
      description: SITE.DESCRIPTION,
      author: SITE.AUTHOR,
      contact: SITE.EMAIL,
    },
    discoverability: {
      llms: `${SITE.URL}/llms.txt`,
      llmsExtended: `${SITE.URL}/llms-full.txt`,
      aiGuide: `${SITE.URL}/for-ai`,
      sitemap: `${SITE.URL}/sitemap.xml`,
      rss: `${SITE.URL}/rss.xml`,
    },
    entities: [
      {
        id: "person:barun-debnath",
        type: "Person",
        name: SITE.AUTHOR,
        roles: ["Founding Engineer", "SRE", "Platform Engineer"],
        profiles: [
          "https://x.com/barundebnath",
          "https://github.com/d-cryptic",
          "https://www.linkedin.com/in/barundebnath",
        ],
      },
    ],
    coverage: {
      blogPosts: blogPosts.length,
      projects: projectPosts.length,
      notes: notesPosts.length,
      snippets: snippetPosts.length,
      updatedAt: new Date().toISOString(),
    },
    topics: [
      "site reliability engineering",
      "platform engineering",
      "systems engineering",
      "devops",
      "observability",
      "productivity",
    ],
  };

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
