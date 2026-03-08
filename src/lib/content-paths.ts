export const cleanContentId = (id: string): string =>
  id.replace(/\/index(?:\.mdx?)?$/i, "").replace(/\.mdx?$/i, "");

export const toContentPath = (collection: string, id: string): string =>
  `/${collection}/${cleanContentId(id)}`;

export const toContentNodeId = (collection: string, id: string): string =>
  `${collection}/${cleanContentId(id)}`;
