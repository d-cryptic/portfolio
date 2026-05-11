import { RESUME_URL, SITE, SOCIALS } from "@consts";

type JsonLd = Record<string, unknown>;

export const toAbsoluteUrl = (pathOrUrl: string): string => {
  return new URL(pathOrUrl, SITE.URL).toString();
};

export const websiteJsonLd = (): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.TITLE,
    url: SITE.URL,
    description: SITE.DESCRIPTION,
    publisher: {
      "@type": "Person",
      name: SITE.AUTHOR,
      url: SITE.URL,
    },
    inLanguage: "en",
  };
};

const sameAs = SOCIALS.map((social) => social.HREF).filter(
  (href) => href !== SITE.URL,
);
const knowsAbout = [
  "Full-stack engineering",
  "AI engineering",
  "Site reliability engineering",
  "Platform engineering",
  "Distributed systems",
  "Kubernetes",
  "ClickHouse",
  "Kafka",
  "Observability",
  "Cloud infrastructure",
  "Cost optimization",
];

export const personJsonLd = (): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.AUTHOR,
    url: SITE.URL,
    email: SITE.EMAIL,
    image: toAbsoluteUrl("https://assets.barundebnath.com/about-me%20(1).png"),
    sameAs,
    jobTitle: "Founding Engineer, Full-stack / AI / Platform Engineer",
    knowsAbout,
    hasOccupation: {
      "@type": "Occupation",
      name: "Software Engineer",
      occupationLocation: {
        "@type": "City",
        name: "Bangalore, India",
      },
      skills: knowsAbout.join(", "),
    },
    subjectOf: [
      {
        "@type": "CreativeWork",
        name: `${SITE.AUTHOR} Resume`,
        url: RESUME_URL,
      },
    ],
  };
};

export const profilePageJsonLd = (): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: SITE.AUTHOR,
    url: SITE.URL,
    description: SITE.DESCRIPTION,
    mainEntity: personJsonLd(),
    inLanguage: "en",
  };
};

export const itemListJsonLd = (
  name: string,
  items: Array<{ name: string; url: string; description?: string }>,
): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
      description: item.description,
    })),
  };
};

export const breadcrumbJsonLd = (
  items: Array<{ name: string; path: string }>,
): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
};
