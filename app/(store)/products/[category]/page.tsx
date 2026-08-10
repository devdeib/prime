import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ category: "all-items" }];
}

export default function CategoryProductsPage() {
  redirect("/");
}
