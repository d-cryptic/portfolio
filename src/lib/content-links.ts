import type { CollectionEntry } from "astro:content";
import { toContentNodeId, toContentPath } from "@lib/content-paths";

type ContentKind = "notes" | "snippets";

type ContentEntry = CollectionEntry<"notes"> | CollectionEntry<"snippets">;

export type ContentLinkNode = {
  id: string;
  collection: ContentKind;
  title: string;
  description: string;
  date: Date;
  tags: string[];
  href: string;
};

export type ContentLinkEdge = {
  from: string;
  to: string;
};

const INTERNAL_LINK_RE = /\[[^\]]+\]\((\/[^)\s]+)\)/g;
const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

const stripAnchor = (value: string): string => {
  const [path] = value.split("#");
  return path ?? value;
};

const stripAlias = (value: string): string => {
  const [path] = value.split("|");
  return path?.trim() ?? value.trim();
};

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, "");

const normalizeComparable = (value: string): string =>
  trimSlashes(value)
    .replace(/\.mdx?$/i, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

const toHref = (entry: ContentEntry): string => toContentPath(entry.collection, entry.id);

export const toNode = (entry: ContentEntry): ContentLinkNode => ({
  id: toContentNodeId(entry.collection, entry.id),
  collection: entry.collection,
  title: entry.data.title,
  description: entry.data.description,
  date: entry.data.date,
  tags: entry.data.tags ?? [],
  href: toHref(entry),
});

const indexByExactPath = (nodes: ContentLinkNode[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const node of nodes) {
    map.set(normalizeComparable(node.id), node.id);
    map.set(normalizeComparable(node.href), node.id);
    map.set(normalizeComparable(node.title), node.id);
  }
  return map;
};

const indexByBasename = (nodes: ContentLinkNode[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const node of nodes) {
    const basename = node.id.split("/").at(-1);
    if (!basename) continue;
    const key = normalizeComparable(basename);
    if (!map.has(key)) {
      map.set(key, node.id);
    }
  }
  return map;
};

export const extractRawLinks = (body: string): string[] => {
  const results: string[] = [];

  for (const match of body.matchAll(INTERNAL_LINK_RE)) {
    const raw = match[1];
    if (!raw) continue;
    results.push(stripAnchor(raw));
  }

  for (const match of body.matchAll(WIKI_LINK_RE)) {
    const raw = match[1];
    if (!raw) continue;
    const target = stripAnchor(stripAlias(raw));
    if (!target) continue;
    if (target.startsWith("http://") || target.startsWith("https://")) continue;
    results.push(target);
  }

  return results;
};

export const resolveInternalLinks = (
  source: ContentEntry,
  rawLinks: string[],
  nodes: ContentLinkNode[],
): string[] => {
  const exactIndex = indexByExactPath(nodes);
  const basenameIndex = indexByBasename(nodes);
  const sourceId = toContentNodeId(source.collection, source.id);

  const resolved = rawLinks
    .map((rawLink) => {
      const normalized = normalizeComparable(rawLink);
      if (!normalized) return null;

      if (exactIndex.has(normalized)) {
        return exactIndex.get(normalized) ?? null;
      }

      const withPrefix = `${source.collection}/${normalized}`;
      if (exactIndex.has(withPrefix)) {
        return exactIndex.get(withPrefix) ?? null;
      }

      if (basenameIndex.has(normalized)) {
        return basenameIndex.get(normalized) ?? null;
      }

      return null;
    })
    .filter((targetId): targetId is string => Boolean(targetId) && targetId !== sourceId);

  return [...new Set(resolved)];
};

export const buildLinkGraph = (entries: ContentEntry[]): { nodes: ContentLinkNode[]; edges: ContentLinkEdge[] } => {
  const nodes = entries.map(toNode);

  const edges = entries.flatMap((entry) => {
    const rawLinks = extractRawLinks(entry.body ?? "");
    const targets = resolveInternalLinks(entry, rawLinks, nodes);
    return targets.map((target) => ({ from: toContentNodeId(entry.collection, entry.id), to: target }));
  });

  return {
    nodes,
    edges,
  };
};

export const buildBacklinks = (
  nodeId: string,
  nodes: ContentLinkNode[],
  edges: ContentLinkEdge[],
): ContentLinkNode[] => {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const backlinkIds = edges.filter((edge) => edge.to === nodeId).map((edge) => edge.from);
  const uniqueBacklinks = [...new Set(backlinkIds)];
  return uniqueBacklinks
    .map((id) => nodeMap.get(id))
    .filter((node): node is ContentLinkNode => Boolean(node));
};

export const findOrphans = (
  nodes: ContentLinkNode[],
  edges: ContentLinkEdge[],
  collection: ContentKind,
): ContentLinkNode[] => {
  const targetIds = new Set(edges.map((edge) => edge.to));
  return nodes.filter((node) => node.collection === collection && !targetIds.has(node.id));
};

export const getRelatedByTags = (
  current: ContentLinkNode,
  nodes: ContentLinkNode[],
  limit = 5,
): ContentLinkNode[] => {
  const currentTagSet = new Set(current.tags.map((tag) => tag.toLowerCase()));

  return nodes
    .filter((node) => node.id !== current.id)
    .map((node) => {
      const overlap = node.tags.filter((tag) => currentTagSet.has(tag.toLowerCase())).length;
      return { node, overlap };
    })
    .filter((item) => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.node.date.valueOf() - a.node.date.valueOf())
    .slice(0, limit)
    .map((item) => item.node);
};
