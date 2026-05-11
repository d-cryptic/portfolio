import { existsSync } from "node:fs";
import { join } from "node:path";
import { cleanBlogId } from "@lib/blog-series";

const markdownImagePattern = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const centeredMarkdownImagePattern =
  /<center>\s*!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*<\/center>/i;

export const getFirstMarkdownImage = (body?: string): string | undefined => {
  if (!body) {
    return undefined;
  }

  const centeredMatch = body.match(centeredMarkdownImagePattern);
  if (centeredMatch?.[1]) {
    return centeredMatch[1];
  }

  return body.match(markdownImagePattern)?.[1];
};

export const getGeneratedBlogThumbnail = (
  postId: string,
): string | undefined => {
  const thumbnailPath = `/images/blog-thumbnails/${cleanBlogId(postId)}.png`;
  const absolutePath = join(process.cwd(), "public", thumbnailPath);

  return existsSync(absolutePath) ? thumbnailPath : undefined;
};

export const getBlogThumbnail = (
  postId: string,
  body?: string,
): string | undefined =>
  getFirstMarkdownImage(body) ?? getGeneratedBlogThumbnail(postId);
