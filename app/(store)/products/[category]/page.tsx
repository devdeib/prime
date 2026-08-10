"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function generateStaticParams() {
  return [{ category: "all-items" }];
}

export default function CategoryProductsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
