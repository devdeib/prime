"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import HeroImageCarousel from "@/components/header/HeroImageCarousel";
import HomeShowroomsSection from "@/components/home/HomeShowroomsSection";
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
  external_url?: string | null;
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
  return `https://picsum.photos/seed/product-${product.id}/800/1000`;
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
  const [activeCategoryAlias, setActiveCategoryAlias] = useState<string>(
    routeCategorySlug ?? ALL_ITEMS_ALIAS
  );
  const [selected, setSelected] = useState<Product | null>(null);
  const [heroSlides, setHeroSlides] = useState<HomeCarouselSlide[]>(
    initialHeroSlides?.length ? initialHeroSlides : MOCK_HOME_CAROUSEL_SLIDES
  );
  const [heroCopy, setHeroCopy] = useState<HeroCopy>({});
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [heroDraft, setHeroDraft] = useState<HeroCopy>({});
  const [heroSaving, setHeroSaving] = useState(false);

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
    setActiveCategoryAlias(routeCategorySlug ?? ALL_ITEMS_ALIAS);
  }, [routeCategorySlug]);

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
    () => (topCarousel ? products.slice(0, 8) : products),
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

  const onProductActivate = (product: Product) => {
    if (product.external_url) {
      window.location.href = product.external_url;
      return;
    }
    setSelected(product);
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
          <div className={styles.categoryScroll}>
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

        <div
          className={`${styles.grid} ${topCarousel ? styles.gridCompact : ""}`}
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
                </div>
              </>
            );

            if (product.external_url) {
              return (
                <a
                  key={product.id}
                  href={product.external_url}
                  className={`${styles.card} ${
                    topCarousel ? styles.cardCompact : ""
                  }`}
                  style={{
                    animationDelay: `${Math.min(index, 12) * 0.055}s`,
                  }}
                >
                  {content}
                </a>
              );
            }

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
      </section>

      {topCarousel ? <HomeShowroomsSection /> : null}

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
              <Image
                className={styles.panelImage}
                src={productImageUrl(selected)}
                alt={pickLocalized(i18n.language, selected.name, selected.name_ar)}
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
                priority
              />
            </div>
            <div className={styles.panelContent}>
              <p className={styles.panelEyebrow}>{t("catalog.detailEyebrow")}</p>
              <h2 id="product-detail-title" className={styles.panelTitle}>
                {pickLocalized(i18n.language, selected.name, selected.name_ar)}
              </h2>
              <p className={styles.panelDesc}>
                {pickLocalized(
                  i18n.language,
                  selected.descriptions,
                  selected.descriptions_ar
                ) || t("catalog.noDescription")}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
