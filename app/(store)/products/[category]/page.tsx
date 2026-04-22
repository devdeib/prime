import FurnitureCatalogExperience from "@/components/shop/FurnitureCatalogExperience";
import { loadStore } from "@/lib/mock-backend-store";

export function generateStaticParams() {
  const store = loadStore();
  const categories = store.categories.map((category) => ({
    category: category.alias,
  }));

  return [{ category: "all-items" }, ...categories];
}

export default async function CategoryProductsPage(
  props: PageProps<"/products/[category]">
) {
  const { category } = await props.params;
  const slug = typeof category === "string" ? category : "all-items";

  return (
    <FurnitureCatalogExperience
      routeCategorySlug={slug}
      syncRouteOnCategoryChange
    />
  );
}
