import { SITE } from "@consts";

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

export const personJsonLd = (): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.AUTHOR,
    url: SITE.URL,
    email: SITE.EMAIL,
    sameAs: [
      "https://x.com/barundebnath",
      "https://github.com/d-cryptic",
      "https://www.linkedin.com/in/barundebnath",
      "https://medium.barundebnath.com",
    ],
    jobTitle: "Founding Engineer, SRE / Platform Engineer",
  };
};

export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>): JsonLd => {
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
