/** Mock hero slides — image-only carousel (same role as legacy banner API). */
export type HomeCarouselSlide = {
  id: number;
  imageUrl: string;
  mediaType?: "image" | "video";
};

export const MOCK_HOME_CAROUSEL_SLIDES: HomeCarouselSlide[] = [];
