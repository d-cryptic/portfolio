import type { CollectionEntry } from "astro:content";
type ContentCollection = "blog" | "projects" | "notes" | "snippets";

type FilterableData = {
  title: string;
  description: string;
  date: Date;
  draft?: boolean;
  tags?: string[];
  stack?: string[];
  roles?: string[];
  outcomes?: string[];
};

type FilterableEntry = {
  id: string;
  slug: string;
  collection: ContentCollection;
  data: FilterableData;
};

export type ExplorerItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  contentType: string;
  date: Date;
  stack: string[];
  roles: string[];
  outcomes: string[];
};

type BuildExplorerInput = {
  blog: CollectionEntry<"blog">[];
  projects: CollectionEntry<"projects">[];
  notes: CollectionEntry<"notes">[];
  snippets: CollectionEntry<"snippets">[];
  pages?: Array<
    Omit<ExplorerItem, "stack" | "roles" | "outcomes"> &
      Partial<Pick<ExplorerItem, "stack" | "roles" | "outcomes">>
  >;
};

const LABEL_OVERRIDES: Record<string, string> = {
  seo: "SEO",
  sre: "SRE",
  devops: "DevOps",
};

const toLabel = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (LABEL_OVERRIDES[normalized]) {
    return LABEL_OVERRIDES[normalized];
  }

  return value
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const normalizeValues = (values: string[]): string[] =>
  [...new Set(values.map((value) => toLabel(value)).filter(Boolean))];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const outcomeTagMap: Record<string, string[]> = {
  performance: ["performance", "optimization", "scalability", "load-testing"],
  seo: ["seo", "search", "metadata"],
  infra: ["infra", "infrastructure", "devops", "platform", "sre", "servers", "nats", "docker", "kubernetes"],
  data: ["data", "analytics", "database", "sql", "clickhouse"],
};

const roleTagMap: Record<string, string[]> = {
  sre: ["sre", "reliability", "incident", "ops"],
  "Platform Engineer": ["platform", "devops", "infrastructure", "kubernetes", "docker"],
  "Software Engineer": ["python", "c++", "git", "oss"],
  "Systems Engineer": ["linux", "systems", "architecture", "servers", "messaging"],
};

const stackTagMap: Record<string, string[]> = {
  Linux: ["linux"],
  Git: ["git"],
  Python: ["python"],
  "C++": ["c++"],
  Neovim: ["neovim", "lua"],
  NATS: ["nats", "messaging"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes"],
  Architecture: ["architecture"],
  DevOps: ["devops"],
};

const inferFromTags = (
  tags: string[],
  mapping: Record<string, string[]>,
): string[] => {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const result: string[] = [];

  for (const [label, matches] of Object.entries(mapping)) {
    if (matches.some((match) => lowerTags.includes(match.toLowerCase()))) {
      result.push(label);
    }
  }

  return result;
};

const getEntryUrl = (entry: FilterableEntry): string => {
  const cleanId =
    entry.collection === "blog" ? entry.id.replace(/\/index\.mdx?$/, "") : entry.id;
  return `/${entry.collection}/${cleanId}`;
};

const getCollectionLabel = (collection: ContentCollection): string => {
  const map: Record<ContentCollection, string> = {
    blog: "Blog",
    projects: "Projects",
    notes: "Notes",
    snippets: "Snippets",
  };
  return map[collection];
};

const mapEntryToExplorerItem = (entry: FilterableEntry): ExplorerItem => {
  const tags = entry.data.tags || [];

  const stack = normalizeValues([
    ...(entry.data.stack || []),
    ...inferFromTags(tags, stackTagMap),
  ]);

  const roles = normalizeValues([
    ...(entry.data.roles || []),
    ...inferFromTags(tags, roleTagMap),
  ]);

  const outcomes = normalizeValues([
    ...(entry.data.outcomes || []),
    ...inferFromTags(tags, outcomeTagMap),
  ]);

  return {
    id: `${entry.collection}:${entry.id}`,
    title: entry.data.title,
    description: entry.data.description,
    href: getEntryUrl(entry),
    contentType: getCollectionLabel(entry.collection),
    date: entry.data.date,
    stack,
    roles,
    outcomes,
  };
};

export const buildExplorerItems = (input: BuildExplorerInput): ExplorerItem[] => {
  const contentItems = [
    ...input.blog.map(mapEntryToExplorerItem),
    ...input.projects.map(mapEntryToExplorerItem),
    ...input.notes.map(mapEntryToExplorerItem),
    ...input.snippets.map(mapEntryToExplorerItem),
  ];

  const staticPages = (input.pages || []).map((page) => ({
    ...page,
    id: page.id || `page:${slugify(page.title)}`,
    contentType: page.contentType || "Pages",
    stack: normalizeValues(page.stack || []),
    roles: normalizeValues(page.roles || []),
    outcomes: normalizeValues(page.outcomes || []),
  }));

  return [...contentItems, ...staticPages].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
};
