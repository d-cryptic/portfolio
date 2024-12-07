import { axisLeft } from "d3"
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.MobileOnly(
      Component.RecentNotes({
        showTags: false,
        limit: 5,
        title: "Recent writing",
      }),
    ),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/d-cryptic",
      Twitter: "https://twitter.com/heydensetsu",
      Linkedin: "https://linkedin.com/in/barundebnath",
      Email: "mailto:barundebnath91@gmail.com",
    },
    shortcuts: {
      Blogs: "/Blogs",
      Notes: "/Notes",
      Projects: "/Projects",
      Tags: "/tags",
      Shelf: "/Shelf",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    // Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
    Component.DesktopOnly(
      Component.RecentNotes({
        showTags: false,
        limit: 3,
        title: "Recent writing",
      }),
    ),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    // Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
