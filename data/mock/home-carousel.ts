/** Mock hero slides — image-only carousel (same role as legacy banner API). */
export type HomeCarouselSlide = {
  id: number;
  imageUrl: string;
};

export const MOCK_HOME_CAROUSEL_SLIDES: HomeCarouselSlide[] = [
  {
    id: 1,
    imageUrl: "https://picsum.photos/seed/bakery-hero-1/1920/560",
  },
  {
    id: 2,
    imageUrl: "https://picsum.photos/seed/bakery-hero-2/1920/560",
  },
  {
    id: 3,
    imageUrl: "https://picsum.photos/seed/bakery-hero-3/1920/560",
  },
  {
    id: 4,
    imageUrl: "https://picsum.photos/seed/bakery-hero-4/1920/560",
  },
];
