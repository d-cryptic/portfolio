import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "Barun Debnath",
  DESCRIPTION: "Astro Micro is an accessible and lightweight blog.",
  EMAIL: "barundebnath91@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 6,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Astro Micro is an accessible theme for Astro.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects with links to repositories and live demos.",
};

export const SOCIALS: Socials = [
  { NAME: "X (formerly Twitter)", HREF: "https://twitter.com/heydensetsu" },
  { NAME: "GitHub", HREF: "https://github.com/d-cryptic" },
  { NAME: "LinkedIn", HREF: "https://www.linkedin.com/in/barundebnath" },
  { NAME: "Website", HREF: "https://barundebnath.com" },
];
