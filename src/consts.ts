import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "Barun Debnath",
  DESCRIPTION:
    "SRE by day, manga enthusiast by night. Exploring systems, technology, and life with a beginner's mindset (Shoshin).",
  EMAIL: "barundebnath91@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 6,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Barun Debnath | SRE & Systems Explorer",
  DESCRIPTION:
    "🚀 Exploring the world of SRE, Systems, and Platform Engineering, one incident at a time. When not debugging, you'll find me with mangas, coffee, and that perfect setup quest.",
};

export const BLOG: Metadata = {
  TITLE: "Systems & Beyond | Shoshin",
  DESCRIPTION:
    "Exploring systems, technology, and life with a beginner's mindset. From SRE adventures to manga musings, coffee experiments to setup tweaks.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects & Experiments",
  DESCRIPTION:
    "A collection of my adventures in code, infrastructure, and everything in between. From production systems to personal experiments.",
};

export const SOCIALS: Socials = [
  { NAME: "X (formerly Twitter)", HREF: "https://twitter.com/heydensetsu" },
  { NAME: "GitHub", HREF: "https://github.com/d-cryptic" },
  { NAME: "LinkedIn", HREF: "https://www.linkedin.com/in/barundebnath" },
  { NAME: "Website", HREF: "https://barundebnath.com" },
];
