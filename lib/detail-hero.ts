/** Full-bleed hero detail pages (projects, showrooms, etc.) */
export function isCollectionDetailHeroPath(pathname: string | null): boolean {
  return pathname != null && /^\/(projects|showrooms)\/\d+$/.test(pathname);
}
