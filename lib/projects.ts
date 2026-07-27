export type Project = {
  id: number;
  name: string;
  name_ar?: string | null;
  city?: string | null;
  city_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  sort_order: number;
  project_type?: "Residential" | "Commercial" | null;
};

export const PROJECT_PLACEHOLDER = "/images/prime-logo.svg";

export function getProjectGallery(project: Pick<Project, "images" | "image_url">): string[] {
  if (project.images && project.images.length > 0) {
    const filtered = project.images.filter(Boolean);
    if (filtered.length > 0) return filtered;
  }
  if (project.image_url?.trim()) {
    return [project.image_url.trim()];
  }
  return [PROJECT_PLACEHOLDER];
}

export function projectImageNeedsUnoptimized(src: string): boolean {
  return src.startsWith("/uploads/") || src.startsWith("http");
}

export function projectDetailPath(id: number): string {
  return `/projects/${id}`;
}

export { isCollectionDetailHeroPath as isProjectHeroPath } from "./detail-hero";
