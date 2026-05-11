import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
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

// https://astro.build/config
export default defineConfig({
  site: "https://barundebnath.com",
  trailingSlash: "never",
  image: {
    domains: ["assets.barundebnath.com"],
  },
  integrations: [
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
