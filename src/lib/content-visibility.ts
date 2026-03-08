export const shouldShowDraftsInDev = (): boolean => {
  if (!import.meta.env.DEV) return false;
  return import.meta.env.PUBLIC_SHOW_DRAFTS_IN_DEV !== "false";
};

export const shouldIncludeDraftContent = (draft?: boolean): boolean =>
  shouldShowDraftsInDev() || !draft;
