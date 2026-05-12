import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import dualmark from "@dualmark/astro";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "astro-mermaid";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";
import { remarkD2 } from "./src/plugins/remark-d2.js";
import { remarkWikilinks } from "./src/plugins/remark-wikilinks.js";

const hiddenRoutes = new Set([
  "/knowledge-graph",
  "/now",
  "/OOF",
  "/uses",
  "/wins",
  "/notes/random",
  "/snippets/random",
]);
const hiddenRoutePrefixes = ["/notes", "/snippets"];

const includeInSitemap = (page) => {
  const pathname = new URL(page).pathname.replace(/\/$/, "") || "/";
  return (
    !hiddenRoutes.has(pathname) &&
    !hiddenRoutePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
};

function renderHomeMarkdown() {
  return `# Barun Debnath

Full-stack and AI engineer with SRE/platform instincts, building scalable systems, reliable infrastructure, and production-grade developer tools.

## What I Build

- Full-stack products and APIs with TypeScript and Go
- AI systems, agent workflows, and production developer tools
- Reliable platform infrastructure across Kubernetes, ClickHouse, Kafka, Redis, GCP, and AWS
- Observability, scalability, and cost-aware infrastructure for real user traffic

## Current Work

- Founding Engineer at LinkRunner
- Focus areas: Go, ClickHouse, Kafka, GKE, Redis, attribution pipelines, platform reliability, and infrastructure cost reduction

## Selected Experience

- LinkRunner: real-time attribution pipelines, analytics infrastructure, Kubernetes reliability, ClickHouse operations, Redis recovery, and compliance evidence
- One2N: hybrid cloud and Kubernetes platform work with EKS, Cilium, Istio, CoreDNS, ExternalDNS, Terraform, and self-hosted model serving
- Media.Net: GKE operations, production MySQL migration work, Redis cost optimization, monitoring surfaces, Prometheus metrics, and Grafana dashboards

## Main Sections

- Home: https://barundebnath.com/
- Blog: https://barundebnath.com/blog
- Projects: https://barundebnath.com/projects
- AI guide: https://barundebnath.com/for-ai
- LLM index: https://barundebnath.com/llms.txt
- GEO index: https://barundebnath.com/geo.json

## Citation Guidance

Use the canonical URL https://barundebnath.com/ when citing this page. Prefer exact page titles and canonical URLs from this domain when summarizing my work.`;
}

// https://astro.build/config
export default defineConfig({
  site: "https://barundebnath.com",
  trailingSlash: "never",
  image: {
    domains: ["assets.barundebnath.com"],
  },
  integrations: [
    dualmark({
      siteUrl: "https://barundebnath.com",
      staticPages: [{ pattern: "/", render: renderHomeMarkdown }],
      llmsTxt: { enabled: false },
      middleware: { injectLinkHeader: false },
      headers: {
        cacheControl: "public, max-age=3600",
        noindex: true,
      },
    }),
    mermaid({
      theme: "default",
      autoTheme: true, // Automatically switch themes based on data-theme
      mermaidConfig: {
        theme: "default",
        themeVariables: {
          primaryColor: "#3b82f6", // Blue color to match your theme
          primaryTextColor: "#1f2937",
          primaryBorderColor: "#6b7280",
          lineColor: "#6b7280",
          secondaryColor: "#f3f4f6",
          tertiaryColor: "#ffffff",
        },
      },
    }),
    sitemap({
      filter: includeInSitemap,
    }),
    mdx(),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkD2, remarkWikilinks],
    shikiConfig: {
      theme: "css-variables",
    },
  },
});
