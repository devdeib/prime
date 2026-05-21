import FurnitureCatalogExperience from "@/components/shop/FurnitureCatalogExperience";

export function generateStaticParams() {
  return [{ category: "all-items" }];
}

type Props = {
  params: Promise<{ category: string }>;
};

export default async function CategoryProductsPage(props: Props) {
  const { category } = await props.params;
  const slug = typeof category === "string" ? category : "all-items";

  return (
    <FurnitureCatalogExperience
      routeCategorySlug={slug}
      syncRouteOnCategoryChange
    />
  );
}
