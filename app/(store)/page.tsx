import FurnitureCatalogExperience from "@/components/shop/FurnitureCatalogExperience";
import { loadStore } from "@/lib/mock-backend-store";

export default function HomePage() {
  const store = loadStore();
  const initialHeroSlides = store.heroSlides
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((slide) => ({
      id: slide.id,
      imageUrl: slide.image_url,
    }));

  return <FurnitureCatalogExperience initialHeroSlides={initialHeroSlides} />;
}
