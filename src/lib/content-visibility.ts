export const shouldShowDraftsInDev = (): boolean =>
  import.meta.env.DEV && import.meta.env.PUBLIC_SHOW_DRAFTS_IN_DEV === "true";

export const shouldIncludeDraftContent = (draft?: boolean): boolean =>
  shouldShowDraftsInDev() || !draft;

