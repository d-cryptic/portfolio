import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "🕹 Barun Debnath",
    pageTitleSuffix: " Welcome to my site!",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "google",
      tagId: "G-Y2PDE1XSGV",
    },
    locale: "en-US",
    baseUrl: "barundebnath.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    generateSocialImages: true,
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Recursive",
        body: "Recursive",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          // using green instead of gray
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#074D3B",
          secondary: "#0E9B77",
          tertiary: "#0A674F",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#24283b",
          lightgray: "#414868",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#bb9af7",
          tertiary: "#7aa2f7",
          highlight: "#8f9fa926",
          textHighlight: "#26283b",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "catppuccin-macchiato",
          dark: "catppuccin-macchiato",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({
        markdownLinkResolution: "shortest",
        openLinksInNewTab: true,
        lazyLoad: true,
      }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
