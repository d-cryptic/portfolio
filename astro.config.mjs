import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "astro-mermaid";
import { remarkD2 } from "./src/plugins/remark-d2.js";

// https://astro.build/config
export default defineConfig({
  site: "https://barundebnath.com",
  trailingSlash: "never",
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
      xslURL: "/sitemap.xml",
    }),
    mdx(),
    pagefind(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkD2],
    shikiConfig: {
      theme: "css-variables",
    },
  },
});
