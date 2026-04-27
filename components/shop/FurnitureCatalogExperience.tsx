"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HeroImageCarousel from "@/components/header/HeroImageCarousel";
import {
  MOCK_HOME_CAROUSEL_SLIDES,
  type HomeCarouselSlide,
} from "@/data/mock/home-carousel";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./furniture-catalog-experience.module.css";

type Category = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

type Product = {
  id: number;
  name: string;
  name_ar?: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  descriptions?: string;
  descriptions_ar?: string | null;
  quantity?: number;
  weight?: number;
  sku?: string;
  storage_files?: Array<{
    id: number;
    type: string;
    image_url?: string;
    public_id?: string;
  }>;
};

export type FurnitureCatalogExperienceProps = {
  /**
   * Segment from `/products/[category]` — keeps the category bar in sync with the URL.
   * Omit on the home page.
   */
  routeCategorySlug?: string;
  /** When true, changing the category updates `router.push(/products/...)` */
  syncRouteOnCategoryChange?: boolean;
  /**
   * Hero image-only carousel at the top (legacy home behaviour).
   * Defaults to true only on the home shop view (no `routeCategorySlug`).
   */
  showTopImageCarousel?: boolean;
  /** Server-provided hero slides to avoid client-side fallback flash on first paint. */
  initialHeroSlides?: HomeCarouselSlide[];
};

const HOME_FEATURED_ALIAS = "featured";

function productImageUrl(product: Product) {
  if (
    product.storage_files &&
    product.storage_files[0] &&
    product.storage_files[0].image_url
  ) {
    return product.storage_files[0].image_url;
  }
  if (product.image_url) {
    return product.image_url;
  }
  return `https://picsum.photos/seed/product-${product.id}/800/1000`;
}

export default function FurnitureCatalogExperience({
  routeCategorySlug,
  syncRouteOnCategoryChange = false,
  showTopImageCarousel,
  initialHeroSlides,
}: FurnitureCatalogExperienceProps = {}) {
  const { t, i18n } = useTranslation("common");
  const topCarousel = showTopImageCarousel ?? routeCategorySlug === undefined;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [activeCategoryAlias, setActiveCategoryAlias] = useState<string | null>(
    routeCategorySlug ?? (topCarousel ? HOME_FEATURED_ALIAS : null)
  );
  const [selected, setSelected] = useState<Product | null>(null);
  const [heroSlides, setHeroSlides] =
    useState<HomeCarouselSlide[]>(
      initialHeroSlides?.length ? initialHeroSlides : MOCK_HOME_CAROUSEL_SLIDES
    );

  useEffect(() => {
    if (!topCarousel) return;
    const c = new AbortController();
    fetch("/api/be/hero-slides", { signal: c.signal })
      .then((r) => r.json())
      .then((j) => {
        const rows = j as Array<{ id: number; image_url: string }>;
        if (!Array.isArray(rows) || rows.length === 0) return;
        setHeroSlides(
          rows.map((h) => ({ id: h.id, imageUrl: h.image_url }))
        );
      })
      .catch(() => {
        /* keep mock */
      });
    return () => c.abort();
  }, [topCarousel]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/be/categories", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {
        setCategories([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setActiveCategoryAlias(routeCategorySlug ?? (topCarousel ? HOME_FEATURED_ALIAS : null));
  }, [routeCategorySlug, topCarousel]);

  useEffect(() => {
    const controller = new AbortController();
    let url = "/api/be/products";
    if (activeCategoryAlias && activeCategoryAlias !== "all-items") {
      url += `?category=${encodeURIComponent(activeCategoryAlias)}`;
    }
    setLoadingProducts(true);
    setProductsError(null);
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
      })
      .catch(() => {
        setProductsError("");
        setProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
    return () => controller.abort();
  }, [activeCategoryAlias]);

  const selectCategory = useCallback(
    (alias: string | null) => {
      setActiveCategoryAlias(alias);
      if (syncRouteOnCategoryChange) {
        const segment = alias ?? "all-items";
        router.push(`/products/${segment}`);
      }
    },
    [router, syncRouteOnCategoryChange]
  );

  const closePanel = useCallback(() => setSelected(null), []);

  const featuredCategory = categories.find(
    (category) => category.alias === HOME_FEATURED_ALIAS
  );
  const homeSectionTitle =
    i18n.language === "ar" ? "منتجاتنا المختارة" : "Our Featured Products";
  const homeSectionSubcopy =
    i18n.language === "ar"
      ? "قمنا باختيار القطع التي تعبّر بأفضل صورة عن لغتنا التصميمية. كل قطعة تمثل انسجامًا راقيًا بين الشكل والخامة والحرفية."
      : "We've curated the pieces that best express our design language. Each one is a refined harmony of form, material, and craftsmanship.";

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, closePanel]);

  const marqueeItems = [
    t("catalog.marquee1"),
    t("catalog.marquee2"),
    t("catalog.marquee3"),
    t("catalog.marquee4"),
    t("catalog.marquee5"),
    t("catalog.marquee6"),
  ];

  const priceFmt = useCallback(
    (n: number) =>
      new Intl.NumberFormat(i18n.language === "ar" ? "ar" : "en", {
        maximumFractionDigits: 0,
      }).format(n),
    [i18n.language]
  );

  return (
    <div className={styles.root}>
      {topCarousel ? (
        <div className={styles.heroStage}>
          <HeroImageCarousel slides={heroSlides} />
          <header className={styles.heroOverlay}>
            {/* <p className={styles.heroEyebrow}>{t("catalog.heroEyebrow")}</p> */}
            <h1 className={styles.heroTitle}>{t("catalog.heroTitle")}</h1>
            <p className={styles.heroSub}>{t("catalog.heroSub")}</p>
          </header>
        </div>
      ) : null}
      {!topCarousel ? (
        <header className={styles.hero}>
          {/* <p className={styles.heroEyebrow}>{t("catalog.heroEyebrow")}</p> */}
          <h1 className={styles.heroTitle}>{t("catalog.heroTitle")}</h1>
          <p className={styles.heroSub}>{t("catalog.heroSub")}</p>
        </header>
      ) : null}

      <div className={styles.marqueeWrap} aria-hidden>
        <div className={styles.marqueeTrack}>
          {[...marqueeItems, ...marqueeItems].map((label, i) => (
            <span
              key={`${label}-${i}`}
              className={
                i % 3 === 0
                  ? `${styles.marqueeItem} ${styles.marqueeItemAccent}`
                  : styles.marqueeItem
              }
            >
              {label}
              <span className={styles.marqueeItem}> · </span>
            </span>
          ))}
        </div>
      </div>

      {!topCarousel ? (
        <nav className={styles.categoryBar} aria-label="Product categories">
          <div className={styles.categoryScroll}>
            <button
              type="button"
              className={`${styles.categoryBtn} ${
                !activeCategoryAlias ? styles.categoryBtnActive : ""
              }`}
              onClick={() => selectCategory(null)}
            >
              {t("catalog.all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.categoryBtn} ${
                  activeCategoryAlias === cat.alias
                    ? styles.categoryBtnActive
                    : ""
                }`}
                onClick={() => selectCategory(cat.alias)}
              >
                {pickLocalized(i18n.language, cat.name, cat.name_ar)}
              </button>
            ))}
          </div>
        </nav>
      ) : (
        <section className={styles.featuredIntro}>
          <p className={styles.featuredEyebrow}>
            {featuredCategory
              ? pickLocalized(
                  i18n.language,
                  featuredCategory.name,
                  featuredCategory.name_ar
                )
              : HOME_FEATURED_ALIAS}
          </p>
          <h2 className={styles.featuredTitle}>{homeSectionTitle}</h2>
          <p className={styles.featuredSubcopy}>{homeSectionSubcopy}</p>
        </section>
      )}

      <section className={styles.gridSection} aria-live="polite">
        {loadingProducts ? (
          <p className={styles.infoState}>Loading products...</p>
        ) : null}
        {productsError ? <p className={styles.infoState}>{productsError}</p> : null}
        <div className={styles.grid} key={activeCategoryAlias ?? "all"}>
          {products.map((product, index) => {
            const displayName = pickLocalized(
              i18n.language,
              product.name,
              product.name_ar
            );
            return (
            <button
              key={product.id}
              type="button"
              className={styles.card}
              onClick={() => setSelected(product)}
              style={{
                animationDelay: `${Math.min(index, 12) * 0.055}s`,
              }}
            >
              <div className={styles.cardImageWrap}>
                <Image
                  className={styles.cardImage}
                  src={productImageUrl(product)}
                  alt={displayName}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className={styles.cardOverlay} aria-hidden />
              </div>
              <div className={styles.cardBody}>
                <h2
                  className={`${styles.cardName} ${
                    i18n.language === "ar" ? styles.cardNameArabic : ""
                  }`}
                >
                  {displayName}
                </h2>
                {/* <p className={styles.cardPrice}>
                  ৳ {priceFmt(product.price)}
                </p> */}
              </div>
            </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label={t("catalog.close")}
            onClick={closePanel}
          />
          <div
            className={`${styles.panel} ${styles.panelWide}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
          >
            <div className={styles.panelImageCol}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closePanel}
                aria-label={t("catalog.closeBtn")}
              >
                ×
              </button>
              <Image
                className={styles.panelImage}
                src={productImageUrl(selected)}
                alt={pickLocalized(
                  i18n.language,
                  selected.name,
                  selected.name_ar
                )}
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
                priority
              />
            </div>
            <div className={styles.panelContent}>
              <p className={styles.panelEyebrow}>{t("catalog.detailEyebrow")}</p>
              <h2 id="product-detail-title" className={styles.panelTitle}>
                {pickLocalized(
                  i18n.language,
                  selected.name,
                  selected.name_ar
                )}
              </h2>
              {/* <p className={styles.panelPrice}>
                ৳ {priceFmt(selected.price)}
              </p> */}
              <p className={styles.panelDesc}>
                {pickLocalized(
                  i18n.language,
                  selected.descriptions,
                  selected.descriptions_ar
                ) || t("catalog.noDescription")}
              </p>
              <div className={styles.specs}>
                {/* {selected.sku && (
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>{t("catalog.sku")}</span>
                    <span>{selected.sku}</span>
                  </div>
                )} */}
                {/* {typeof selected.quantity === "number" && (
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>
                      {t("catalog.quantity")}
                    </span>
                    <span>{selected.quantity}</span>
                  </div>
                )} */}
                {/* {typeof selected.weight === "number" && (
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>
                      {t("catalog.weight")}
                    </span>
                    <span>
                      {selected.weight}{" "}
                      {i18n.language === "ar" ? "كجم" : "kg"}
                    </span>
                  </div>
                )} */}
              </div>
              <div className={styles.cta}>
                {/* <button type="button" className={styles.ctaBtn}>
                  Add to cart
                </button>
                <p className={styles.ctaHint}>
                  Mock checkout — wire to your cart when ready.
                </p> */}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
