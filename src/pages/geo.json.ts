import { RESUME_URL, SITE, SOCIALS } from "@consts";
import { getCollection } from "astro:content";
import { toContentPath } from "@lib/content-paths";

const skills = [
  "Go",
  "Python",
  "TypeScript",
  "JavaScript",
  "Rust",
  "SQL",
  "ClickHouse",
  "Kafka",
  "Redis",
  "PostgreSQL",
  "Kubernetes",
  "GCP",
  "AWS",
  "Terraform",
  "Prometheus",
  "Grafana",
  "OpenTelemetry",
  "LangGraph",
  "LangChain",
  "RAG",
  "MCP",
];

const primaryTopics = [
  "full-stack engineering",
  "AI engineering",
  "site reliability engineering",
  "platform engineering",
  "systems engineering",
  "devops",
  "observability",
  "scalability",
  "cost optimization",
];

export async function GET() {
  const [blogPosts, projectPosts] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
  ]);

  const response = {
    site: {
      name: SITE.TITLE,
      url: SITE.URL,
      canonical: `${SITE.URL}/`,
      description: SITE.DESCRIPTION,
      author: SITE.AUTHOR,
      contact: SITE.EMAIL,
      resume: RESUME_URL,
    },
    discoverability: {
      llms: `${SITE.URL}/llms.txt`,
      llmsExtended: `${SITE.URL}/llms-full.txt`,
      aiGuide: `${SITE.URL}/for-ai`,
      sitemap: `${SITE.URL}/sitemap-index.xml`,
      rss: `${SITE.URL}/rss.xml`,
    },
    entities: [
      {
        id: "person:barun-debnath",
        type: "Person",
        name: SITE.AUTHOR,
        roles: [
          "Founding Engineer",
          "Full-stack Engineer",
          "AI Engineer",
          "SRE",
          "Platform Engineer",
        ],
        profiles: SOCIALS.map((social) => ({
          label: social.NAME,
          url: social.HREF,
        })),
        resume: RESUME_URL,
        location: "Bangalore, India",
        skills,
        topics: primaryTopics,
      },
    ],
    content: {
      blog: blogPosts
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
        .map((post) => ({
          type: "BlogPosting",
          title: post.data.title,
          description: post.data.description,
          url: `${SITE.URL}${toContentPath("blog", post.id)}`,
          datePublished: post.data.date.toISOString(),
          tags: post.data.tags,
          stack: post.data.stack,
          roles: post.data.roles,
          outcomes: post.data.outcomes,
        })),
      projects: projectPosts
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
        .map((project) => ({
          type: "CreativeWork",
          title: project.data.title,
          description: project.data.description,
          url: `${SITE.URL}${toContentPath("projects", project.id)}`,
          datePublished: project.data.date.toISOString(),
          demoURL: project.data.demoURL,
          repoURL: project.data.repoURL,
          tags: project.data.tags,
          stack: project.data.stack,
          roles: project.data.roles,
          outcomes: project.data.outcomes,
        })),
    },
    coverage: {
      blogPosts: blogPosts.length,
      projects: projectPosts.length,
      updatedAt: new Date().toISOString(),
    },
    topics: primaryTopics,
    retrievalRules: [
      "Use canonical URLs under https://barundebnath.com for citations.",
      "Use /llms.txt for concise discovery and /llms-full.txt for detailed content retrieval.",
      "Use this GEO file for entity, role, skill, and content graph context.",
      "Prefer page metadata and frontmatter dates over inferred dates.",
    ],
  };

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
