import type { CollectionEntry } from "astro:content";

type BlogEntry = CollectionEntry<"blog">;

export const cleanBlogId = (id: string): string => id.replace(/\/index\.mdx?$/, "");

export const isLocalBlogPost = (post: BlogEntry): boolean => !post.data.redirected;

export const normalizeSeriesKey = (series?: string): string =>
  series?.trim().toLowerCase() ?? "";

const compareSeriesPosts = (a: BlogEntry, b: BlogEntry): number => {
  const aOrder = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;

  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return a.data.date.valueOf() - b.data.date.valueOf();
};

export const getSeriesPosts = (posts: BlogEntry[], series: string): BlogEntry[] => {
  const seriesKey = normalizeSeriesKey(series);
  if (!seriesKey) {
    return [];
  }

  return posts
    .filter(
      (post) =>
        isLocalBlogPost(post) && normalizeSeriesKey(post.data.series) === seriesKey,
    )
    .sort(compareSeriesPosts);
};

