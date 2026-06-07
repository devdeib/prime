"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./product-detail-page.module.css";

type Product = {
  id: number;
  name: string;
  name_ar?: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  video_url?: string | null;
  descriptions?: string;
  descriptions_ar?: string | null;
  external_url?: string | null;
  dimensions?: string | null;
  storage_files?: Array<{
    id: number;
    type: string;
    image_url?: string;
    public_id?: string;
  }>;
};

type Category = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

function productImageUrl(product: Product): string {
  if (
    product.storage_files &&
    product.storage_files[0] &&
    product.storage_files[0].image_url
  ) {
    return product.storage_files[0].image_url;
  }
  if (product.image_url) return product.image_url;
  return "/images/La dolce casa.svg";
}

function getAllImages(product: Product): string[] {
  const imgs: string[] = [];
  if (product.storage_files) {
    for (const sf of product.storage_files) {
      if (sf.image_url) imgs.push(sf.image_url);
    }
  }
  if (imgs.length === 0 && product.image_url) imgs.push(product.image_url);
  if (imgs.length === 0) imgs.push("/images/La dolce casa.svg");
  return imgs;
}

type Props = {
  categorySlug: string;
  productId: number;
};

export default function ProductDetailPage({ categorySlug, productId }: Props) {
  const { i18n } = useTranslation("common");
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Big image slider
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Top category rail
  const railRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/be/products`, { credentials: "include" }),
        fetch(`/api/be/categories`, { credentials: "include" }),
      ]);
      const allProducts: Product[] = await prodRes.json();
      const allCategories: Category[] = await catRes.json();

      setCategories(allCategories);

      const found = allProducts.find((p) => p.id === productId) ?? null;
      setProduct(found);

      if (found) {
        const sameCategory = allProducts.filter(
          (p) => p.category === found.category && p.id !== found.id
        );
        setCategoryProducts(
          allProducts.filter((p) => p.category === found.category)
        );
        setRelatedProducts(sameCategory.slice(0, 4));
      }
    } catch {
      setError("Failed to load product.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-slide the big image slider
  const images = product ? getAllImages(product) : [];

  useEffect(() => {
    if (images.length <= 1) return;
    sliderIntervalRef.current = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => {
      if (sliderIntervalRef.current) clearInterval(sliderIntervalRef.current);
    };
  }, [images.length]);

  const gotoSlide = (idx: number) => {
    setSliderIndex(idx);
    if (sliderIntervalRef.current) clearInterval(sliderIntervalRef.current);
    sliderIntervalRef.current = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % images.length);
    }, 4000);
  };

  const scrollRail = (dir: "left" | "right") => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.errorWrap}>
        <p>{error ?? "Product not found."}</p>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Go back
        </button>
      </div>
    );
  }

  const productName = pickLocalized(i18n.language, product.name, product.name_ar);
  const productDesc = pickLocalized(
    i18n.language,
    product.descriptions,
    product.descriptions_ar
  );
  const whatsappMsg = `Hi, I'm interested in: ${productName}`;
  const whatsappUrl = `https://wa.me/966538020460?text=${encodeURIComponent(whatsappMsg)}`;

  // Find the category display name
  const categoryObj = categories.find((c) => c.alias === product.category);
  const categoryName = categoryObj
    ? pickLocalized(i18n.language, categoryObj.name, categoryObj.name_ar)
    : product.category;

  return (
    <div className={styles.root}>
      {/* ── TOP: Category products rail ── */}
      <section className={styles.railSection}>
        <button
          className={`${styles.railArrow} ${styles.railArrowLeft}`}
          onClick={() => scrollRail("left")}
          aria-label="Scroll left"
        >
          ‹
        </button>
        <div className={styles.rail} ref={railRef}>
          {categoryProducts.map((p) => {
            const isActive = p.id === product.id;
            return (
              <Link
                key={p.id}
                href={`/products/${categorySlug}/${p.id}`}
                className={`${styles.railItem} ${isActive ? styles.railItemActive : ""}`}
              >
                {pickLocalized(i18n.language, p.name, p.name_ar)}
              </Link>
            );
          })}
        </div>
        <button
          className={`${styles.railArrow} ${styles.railArrowRight}`}
          onClick={() => scrollRail("right")}
          aria-label="Scroll right"
        >
          ›
        </button>
      </section>

      {/* ── MAIN: image left / details right ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroImage}>
          <Image
            src={productImageUrl(product)}
            alt={productName}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            priority
            className={styles.heroImg}
          />
        </div>

        <div className={styles.heroDetails}>
          <p className={styles.eyebrow}>{categoryName}</p>
          <h1 className={styles.productName}>{productName}</h1>

          {product.dimensions ? (
            <div className={styles.dimensionsRow}>
              <span className={styles.dimensionsLabel}>
                {i18n.language === "ar" ? "الأبعاد" : "DIMENSIONS"}
              </span>
              <span className={styles.dimensionsValue}>{product.dimensions}</span>
            </div>
          ) : null}

          {productDesc ? (
            <p className={styles.description}>{productDesc}</p>
          ) : null}

          <div className={styles.actions}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnWhatsapp}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {i18n.language === "ar" ? "اطلب عبر واتساب" : "Order via WhatsApp"}
            </a>

            {product.external_url ? (
              <a
                href={product.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnShop}
              >
                {i18n.language === "ar"
                  ? "عرض في المتجر الإلكتروني"
                  : "View in our online shop"}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── BIG IMAGE SLIDER ── */}
      {images.length > 0 ? (
        <section className={styles.sliderSection}>
          <div className={styles.sliderTrack}>
            {images.map((src, idx) => (
              <div
                key={idx}
                className={`${styles.slide} ${idx === sliderIndex ? styles.slideActive : ""}`}
                aria-hidden={idx !== sliderIndex}
              >
                <Image
                  src={src}
                  alt={`${productName} — view ${idx + 1}`}
                  fill
                  sizes="100vw"
                  className={styles.slideImg}
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>

          {images.length > 1 ? (
            <>
              <button
                className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`}
                onClick={() => gotoSlide((sliderIndex - 1 + images.length) % images.length)}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                className={`${styles.sliderArrow} ${styles.sliderArrowRight}`}
                onClick={() => gotoSlide((sliderIndex + 1) % images.length)}
                aria-label="Next image"
              >
                ›
              </button>
              <div className={styles.dots}>
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={`${styles.dot} ${idx === sliderIndex ? styles.dotActive : ""}`}
                    onClick={() => gotoSlide(idx)}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts.length > 0 ? (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>
            {i18n.language === "ar" ? "منتجات ذات صلة" : "RELATED PRODUCTS"}
          </h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${categorySlug}/${p.id}`}
                className={styles.relatedCard}
              >
                <div className={styles.relatedImageWrap}>
                  <Image
                    src={productImageUrl(p)}
                    alt={pickLocalized(i18n.language, p.name, p.name_ar) ?? ""}
                    fill
                    sizes="(max-width: 600px) 50vw, 25vw"
                    className={styles.relatedImg}
                  />
                </div>
                <div className={styles.relatedInfo}>
                  <p className={styles.relatedName}>
                    {pickLocalized(i18n.language, p.name, p.name_ar)}
                  </p>
                  <p className={styles.relatedCat}>{categoryName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
