import ProductDetailPage from "@/components/shop/ProductDetailPage";

export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ category: string; id: string }>;
};

export default async function ProductDetailRoute(props: Props) {
  const { category, id } = await props.params;
  return <ProductDetailPage categorySlug={category} productId={Number(id)} />;
}
