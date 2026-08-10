"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function generateStaticParams() {
  return [];
}

export default function ProductDetailPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
