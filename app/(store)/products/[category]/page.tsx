import FurnitureCatalogExperience from "@/components/shop/FurnitureCatalogExperience";

export function generateStaticParams() {
  return [{ category: "all-items" }];
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
