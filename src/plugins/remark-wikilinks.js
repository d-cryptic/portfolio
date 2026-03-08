import { visit } from "unist-util-visit";

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

const normalizeTarget = (rawTarget) => {
  const [target] = rawTarget.split("|");
  const normalized = (target ?? "").trim().replace(/\s+/g, "-").toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("notes/") || normalized.startsWith("snippets/")) {
    return `/${normalized}`;
  }
  return `/notes/${normalized}`;
};

const getLabel = (rawValue) => {
  const [target, alias] = rawValue.split("|");
  if (alias && alias.trim()) return alias.trim();
  return (target ?? "").trim();
};

export function remarkWikilinks() {
  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;

      const value = node.value;
      if (!value || !value.includes("[[")) return;

      const nextChildren = [];
      let cursor = 0;

      for (const match of value.matchAll(WIKI_LINK_RE)) {
        const raw = match[1];
        const matched = match[0];
        if (!raw || !matched) continue;

        const start = match.index ?? 0;
        if (start > cursor) {
          nextChildren.push({ type: "text", value: value.slice(cursor, start) });
        }

        const href = normalizeTarget(raw);
        const label = getLabel(raw);

        if (href && label) {
          nextChildren.push({
            type: "link",
            url: href,
            children: [{ type: "text", value: label }],
          });
        } else {
          nextChildren.push({ type: "text", value: matched });
        }

        cursor = start + matched.length;
      }

      if (cursor < value.length) {
        nextChildren.push({ type: "text", value: value.slice(cursor) });
      }

      if (nextChildren.length > 0) {
        parent.children.splice(index, 1, ...nextChildren);
      }
    });
  };
}
