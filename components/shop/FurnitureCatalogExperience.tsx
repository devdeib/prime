"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import HeroImageCarousel from "@/components/header/HeroImageCarousel";
import HomeShowroomsSection, {
  HomeProjectsSection,
} from "@/components/home/HomeShowroomsSection";
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
  thumbnail_url?: string | null;
  video_url?: string | null;
  descriptions?: string;
  descriptions_ar?: string | null;
  quantity?: number;
  weight?: number;
  sku?: string;
  external_url?: string | null;
  dimensions?: string | null;
  storage_files?: Array<{
    id: number;
    type: string;
    image_url?: string;
    public_id?: string;
  }>;
};

type HeroCopy = {
  title_en?: string;
  title_ar?: string;
  subtitle_en?: string;
  subtitle_ar?: string;
};

export type FurnitureCatalogExperienceProps = {
  routeCategorySlug?: string;
  syncRouteOnCategoryChange?: boolean;
  showTopImageCarousel?: boolean;
  initialHeroSlides?: HomeCarouselSlide[];
};

const ALL_ITEMS_ALIAS = "all-items";

function inferHeroMediaType(url: string): "image" | "video" {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) ? "video" : "image";
}

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
  return "/images/La dolce casa.svg";
}

// Card-only: prefer thumbnail_url for a tighter, faster-loading grid image
function productCardImageUrl(product: Product) {
  if (product.thumbnail_url) return product.thumbnail_url;
  return productImageUrl(product);
}

function isVideoUrl(url: string | null | undefined) {
  return Boolean(url && /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url));
}

export default function FurnitureCatalogExperience({
  routeCategorySlug,
  syncRouteOnCategoryChange = false,
  showTopImageCarousel,
  initialHeroSlides,
}: FurnitureCatalogExperienceProps = {}) {
  const { t, i18n } = useTranslation("common");
  const { data: session } = useSession();
  const router = useRouter();
  const topCarousel = showTopImageCarousel ?? routeCategorySlug === undefined;
  const isAdmin = (session as { role?: string } | null)?.role === "admin";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const FEATURED_ALIAS = "featured-products";
  const [activeCategoryAlias, setActiveCategoryAlias] = useState<string>(
    topCarousel ? FEATURED_ALIAS : (routeCategorySlug ?? ALL_ITEMS_ALIAS)
  );

  // Once categories load on homepage, find the actual featured category alias
  useEffect(() => {
    if (!topCarousel || categories.length === 0) return;
    const featured = categories.find(
      (c) =>
        c.alias === "featured-products" ||
        c.name.toLowerCase().includes("featured")
    );
    if (featured) {
      setActiveCategoryAlias(featured.alias);
    } else {
      // No featured category found — show all products
      setActiveCategoryAlias(ALL_ITEMS_ALIAS);
    }
  }, [categories, topCarousel]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [heroSlides, setHeroSlides] = useState<HomeCarouselSlide[]>(
    initialHeroSlides?.length ? initialHeroSlides : MOCK_HOME_CAROUSEL_SLIDES
  );
  const [heroCopy, setHeroCopy] = useState<HeroCopy>({});
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [heroDraft, setHeroDraft] = useState<HeroCopy>({});
  const [heroSaving, setHeroSaving] = useState(false);
  const featuredRailRef = useRef<HTMLDivElement>(null);
  const categoryBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topCarousel) return;
    const controller = new AbortController();

    fetch("/api/be/hero-slides", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        const rows = json as Array<{ id: number; image_url: string }>;
        if (!Array.isArray(rows) || rows.length === 0) return;
        setHeroSlides(
          rows.map((row) => ({
            id: row.id,
            imageUrl: row.image_url,
            mediaType: inferHeroMediaType(row.image_url),
          }))
        );
      })
      .catch(() => {
        /* keep current slides */
      });

    fetch("/api/be/home-hero", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        setHeroCopy(json ?? {});
        setHeroDraft(json ?? {});
      })
      .catch(() => {
        setHeroCopy({});
        setHeroDraft({});
      });

    return () => controller.abort();
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
    if (topCarousel) return; // homepage alias is managed by the categories effect above
    setActiveCategoryAlias(routeCategorySlug ?? ALL_ITEMS_ALIAS);
  }, [routeCategorySlug, topCarousel]);

  useEffect(() => {
    const controller = new AbortController();
    let url = "/api/be/products";

    if (activeCategoryAlias !== ALL_ITEMS_ALIAS) {
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const selectCategory = useCallback(
    (alias: string) => {
      setActiveCategoryAlias(alias);
      if (syncRouteOnCategoryChange) {
        router.push(`/products/${alias}`);
      }
    },
    [router, syncRouteOnCategoryChange]
  );

  const displayProducts = useMemo(
    () => (topCarousel ? products : products),
    [products, topCarousel]
  );

  const marqueeItems = [
    t("catalog.marquee1"),
    t("catalog.marquee2"),
    t("catalog.marquee3"),
    t("catalog.marquee4"),
    t("catalog.marquee5"),
    t("catalog.marquee6"),
  ];

  const homeSectionTitle =
    i18n.language === "ar" ? "منتجاتنا المختارة" : "Featured Products";
  const homeSectionSubcopy =
    i18n.language === "ar"
      ? "مجموعة مختارة بعناية تعكس روح لا دولتشي كازا وتمنح الواجهة حضورًا أخف وأكثر دقة."
      : "A tighter selection of standout pieces, curated to bring a more refined rhythm to the home page.";
  const editHeroLabel =
    t("catalog.editHero") === "catalog.editHero"
      ? "Edit Hero Text"
      : t("catalog.editHero");
  const closeEditorLabel =
    t("catalog.closeEditor") === "catalog.closeEditor"
      ? "Close Editor"
      : t("catalog.closeEditor");
  const titleEnLabel =
    t("catalog.titleEn") === "catalog.titleEn"
      ? "Title (English)"
      : t("catalog.titleEn");
  const titleArLabel =
    t("catalog.titleAr") === "catalog.titleAr"
      ? "Title (Arabic)"
      : t("catalog.titleAr");
  const subtitleEnLabel =
    t("catalog.subtitleEn") === "catalog.subtitleEn"
      ? "Subtitle (English)"
      : t("catalog.subtitleEn");
  const subtitleArLabel =
    t("catalog.subtitleAr") === "catalog.subtitleAr"
      ? "Subtitle (Arabic)"
      : t("catalog.subtitleAr");

  const heroTitle =
    i18n.language === "ar"
      ? heroCopy.title_ar || t("catalog.heroTitle")
      : heroCopy.title_en || t("catalog.heroTitle");
  const heroSubtitle =
    i18n.language === "ar"
      ? heroCopy.subtitle_ar || t("catalog.heroSub")
      : heroCopy.subtitle_en || t("catalog.heroSub");

  const closePanel = useCallback(() => setSelected(null), []);

  const saveHeroCopy = async () => {
    setHeroSaving(true);
    try {
      const res = await fetch("/api/be/home-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroDraft),
      });
      if (!res.ok) return;
      const next = (await res.json()) as HeroCopy;
      setHeroCopy(next);
      setHeroDraft(next);
      setHeroEditorOpen(false);
    } finally {
      setHeroSaving(false);
    }
  };

  /** Navigate to the full product detail page. */
  const onProductActivate = (product: Product) => {
    const categorySlug = product.category || activeCategoryAlias || "all-items";
    router.push(`/products/${categorySlug}/${product.id}`);
  };

  const scrollCategoryBar = (dir: -1 | 1) => {
    const bar = categoryBarRef.current;
    if (!bar) return;
    bar.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const scrollFeatured = (direction: -1 | 1) => {    const rail = featuredRailRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 320),
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.root}>
      {topCarousel ? (
        <div className={styles.heroStage}>
          <HeroImageCarousel slides={heroSlides} />
          <header className={styles.heroOverlay}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>{heroTitle}</h1>
              <p className={styles.heroSub}>{heroSubtitle}</p>
            </div>

            {isAdmin ? (
              <div className={styles.heroAdminBar}>
                <button
                  type="button"
                  className={styles.heroAdminBtn}
                  onClick={() => setHeroEditorOpen((value) => !value)}
                >
                  {heroEditorOpen ? closeEditorLabel : editHeroLabel}
                </button>
              </div>
            ) : null}
          </header>

          {isAdmin && heroEditorOpen ? (
            <div className={styles.heroEditor}>
              <div className={styles.heroEditorCard}>
                <h2 className={styles.heroEditorTitle}>{editHeroLabel}</h2>
                <div className={styles.heroEditorGrid}>
                  <label className={styles.heroField}>
                    <span>{titleEnLabel}</span>
                    <input
                      value={heroDraft.title_en ?? ""}
                      onChange={(event) =>
                        setHeroDraft((current) => ({
                          ...current,
                          title_en: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.heroField}>
                    <span>{titleArLabel}</span>
                    <input
                      value={heroDraft.title_ar ?? ""}
                      onChange={(event) =>
                        setHeroDraft((current) => ({
                          ...current,
                          title_ar: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.heroField}>
                    <span>{subtitleEnLabel}</span>
                    <textarea
                      rows={3}
                      value={heroDraft.subtitle_en ?? ""}
                      onChange={(event) =>
                        setHeroDraft((current) => ({
                          ...current,
                          subtitle_en: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.heroField}>
                    <span>{subtitleArLabel}</span>
                    <textarea
                      rows={3}
                      value={heroDraft.subtitle_ar ?? ""}
                      onChange={(event) =>
                        setHeroDraft((current) => ({
                          ...current,
                          subtitle_ar: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className={styles.heroEditorActions}>
                  <button
                    type="button"
                    className={styles.heroEditorGhost}
                    onClick={() => {
                      setHeroDraft(heroCopy);
                      setHeroEditorOpen(false);
                    }}
                  >
                    {t("dashboard.cancel")}
                  </button>
                  <button
                    type="button"
                    className={styles.heroEditorPrimary}
                    onClick={() => void saveHeroCopy()}
                    disabled={heroSaving}
                  >
                    {heroSaving ? t("dashboard.saving") : t("dashboard.save")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroSub}>{heroSubtitle}</p>
        </header>
      )}

      <div className={styles.marqueeWrap} aria-hidden>
        <div className={styles.marqueeTrack}>
          {[...marqueeItems, ...marqueeItems].map((label, index) => (
            <span
              key={`${label}-${index}`}
              className={
                index % 3 === 0
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
          <button
            type="button"
            className={styles.categoryArrow}
            aria-label="Scroll categories left"
            onClick={() => scrollCategoryBar(-1)}
          />
          <div className={styles.categoryScroll} ref={categoryBarRef}>
            <button
              type="button"
              className={`${styles.categoryBtn} ${
                activeCategoryAlias === ALL_ITEMS_ALIAS
                  ? styles.categoryBtnActive
                  : ""
              }`}
              onClick={() => selectCategory(ALL_ITEMS_ALIAS)}
            >
              {t("catalog.all")}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.categoryBtn} ${
                  activeCategoryAlias === category.alias
                    ? styles.categoryBtnActive
                    : ""
                }`}
                onClick={() => selectCategory(category.alias)}
              >
                {pickLocalized(i18n.language, category.name, category.name_ar)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.categoryArrow} ${styles.categoryArrowRight}`}
            aria-label="Scroll categories right"
            onClick={() => scrollCategoryBar(1)}
          />
        </nav>
      ) : (
        <section className={styles.featuredIntro}>
          <h2 className={styles.featuredTitle}>{homeSectionTitle}</h2>
          <p className={styles.featuredSubcopy}>{homeSectionSubcopy}</p>
        </section>
      )}

      <section className={styles.gridSection} aria-live="polite">
        {loadingProducts ? (
          <p className={styles.infoState}>Loading products...</p>
        ) : null}
        {productsError ? <p className={styles.infoState}>{productsError}</p> : null}

        <div className={topCarousel ? styles.sliderShell : undefined}>
          {topCarousel ? (
            <>
              <button
                type="button"
                className={`${styles.sliderArrow} ${styles.sliderArrowPrev}`}
                aria-label="Previous featured products"
                onClick={() => scrollFeatured(-1)}
              />
              <button
                type="button"
                className={`${styles.sliderArrow} ${styles.sliderArrowNext}`}
                aria-label="Next featured products"
                onClick={() => scrollFeatured(1)}
              />
            </>
          ) : null}
          <div
            ref={topCarousel ? featuredRailRef : undefined}
            className={`${styles.grid} ${
              topCarousel ? `${styles.gridCompact} ${styles.featuredRail}` : ""
            }`}
            key={activeCategoryAlias}
          >
          {displayProducts.map((product, index) => {
            const displayName = pickLocalized(
              i18n.language,
              product.name,
              product.name_ar
            );

            const content = (
              <>
                <div className={styles.cardImageWrap}>
                  {isVideoUrl(product.video_url) ? (
                    <video
                      className={styles.cardVideo}
                      src={product.video_url ?? undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(event) => void event.currentTarget.play()}
                      onMouseLeave={(event) => event.currentTarget.pause()}
                    />
                  ) : (
                    <Image
                      className={styles.cardImage}
                      src={productCardImageUrl(product)}
                      alt={displayName}
                      fill
                      sizes="(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 24vw"
                    />
                  )}
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
                </div>
              </>
            );

            return (
              <button
                key={product.id}
                type="button"
                className={`${styles.card} ${
                  topCarousel ? styles.cardCompact : ""
                }`}
                onClick={() => onProductActivate(product)}
                style={{
                  animationDelay: `${Math.min(index, 12) * 0.055}s`,
                }}
              >
                {content}
              </button>
            );
          })}
          </div>
        </div>
      </section>

      {topCarousel ? (
        <>
          <HomeShowroomsSection />
          <HomeProjectsSection />
        </>
      ) : null}

      {selected ? (
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
              {isVideoUrl(selected.video_url) ? (
                <video
                  className={styles.panelVideo}
                  src={selected.video_url ?? undefined}
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <Image
                  className={styles.panelImage}
                  src={productImageUrl(selected)}
                  alt={pickLocalized(i18n.language, selected.name, selected.name_ar)}
                  fill
                  sizes="(max-width: 900px) 100vw, 55vw"
                  priority
                />
              )}
            </div>
            <div className={styles.panelContent}>
              <div className={styles.panelContentScroll}>
                <p className={styles.panelEyebrow}>{t("catalog.detailEyebrow")}</p>
                <h2 id="product-detail-title" className={styles.panelTitle}>
                  {pickLocalized(i18n.language, selected.name, selected.name_ar)}
                </h2>
                {selected.category ? (
                  <p className={styles.panelCategory}>{selected.category}</p>
                ) : null}
                <p className={styles.panelDesc}>
                  {pickLocalized(
                    i18n.language,
                    selected.descriptions,
                    selected.descriptions_ar
                  ) || t("catalog.noDescription")}
                </p>
              </div>
              <div className={styles.panelActions}>
                <a
                  href={`https://wa.me/966538020460?text=${encodeURIComponent(
                    `Hi, I'm interested in: ${pickLocalized(i18n.language, selected.name, selected.name_ar)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.panelBtnWhatsapp}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {i18n.language === "ar" ? "اطلب عبر واتساب" : "Order via WhatsApp"}
                </a>
                {selected.external_url ? (
                  <a
                    href={selected.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.panelBtnShop}
                  >
                    {i18n.language === "ar" ? "عرض في المتجر الإلكتروني" : "View in our online shop"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
