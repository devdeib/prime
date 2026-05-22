export type Showroom = {
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
};

export const SHOWROOM_PLACEHOLDER = "/images/La dolce casa.svg";

export function getShowroomGallery(
  showroom: Pick<Showroom, "images" | "image_url">
): string[] {
  if (showroom.images && showroom.images.length > 0) {
    const filtered = showroom.images.filter(Boolean);
    if (filtered.length > 0) return filtered;
  }
  if (showroom.image_url?.trim()) {
    return [showroom.image_url.trim()];
  }
  return [SHOWROOM_PLACEHOLDER];
}

export function showroomDetailPath(id: number): string {
  return `/showrooms/${id}`;
}
