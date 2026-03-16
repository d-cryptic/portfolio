export const shouldShowDraftsInDev = (): boolean => {
  if (!import.meta.env.DEV) return false;
  return import.meta.env.PUBLIC_SHOW_DRAFTS_IN_DEV !== "false";
};

export const shouldIncludeDraftContent = (draft?: boolean): boolean =>
  shouldShowDraftsInDev() || !draft;

const SYNTHETIC_TAGS = new Set(["dummy", "testing"]);

export const shouldShowSyntheticInDev = (): boolean => {
  if (!import.meta.env.DEV) return false;
  return import.meta.env.PUBLIC_SHOW_SYNTHETIC_IN_DEV !== "false";
};

const isSyntheticContent = (tags?: string[]): boolean =>
  (tags ?? []).some((tag) => SYNTHETIC_TAGS.has(tag.toLowerCase()));

export const shouldIncludeKnowledgeContent = ({
  draft,
  tags,
}: {
  draft?: boolean;
  tags?: string[];
}): boolean => shouldIncludeDraftContent(draft) && (shouldShowSyntheticInDev() || !isSyntheticContent(tags));
