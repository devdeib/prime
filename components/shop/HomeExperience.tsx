"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import HeroImageCarousel from "@/components/header/HeroImageCarousel";
import HomeShowroomsSection, {
  HomeProjectsSection,
} from "@/components/home/HomeShowroomsSection";
import {
  MOCK_HOME_CAROUSEL_SLIDES,
  type HomeCarouselSlide,
} from "@/data/mock/home-carousel";
import styles from "./furniture-catalog-experience.module.css";

type HeroCopy = {
  title_en?: string;
  title_ar?: string;
  subtitle_en?: string;
  subtitle_ar?: string;
};

function inferHeroMediaType(url: string): "image" | "video" {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) ? "video" : "image";
}

export default function HomeExperience() {
  const { t, i18n } = useTranslation("common");
  const { data: session } = useSession();
  const isAdmin = (session as { role?: string } | null)?.role === "admin";

  const [heroSlides, setHeroSlides] = useState<HomeCarouselSlide[]>(
    MOCK_HOME_CAROUSEL_SLIDES
  );
  const [heroCopy, setHeroCopy] = useState<HeroCopy>({});
  const [heroDraft, setHeroDraft] = useState<HeroCopy>({});
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);

  useEffect(() => {
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
      .catch(() => {});

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
  }, []);

  const marqueeItems = [
    t("catalog.marquee1"),
    t("catalog.marquee2"),
    t("catalog.marquee3"),
    t("catalog.marquee4"),
    t("catalog.marquee5"),
    t("catalog.marquee6"),
  ];

  const heroTitle =
    i18n.language === "ar"
      ? heroCopy.title_ar || t("catalog.heroTitle")
      : heroCopy.title_en || t("catalog.heroTitle");
  const heroSubtitle =
    i18n.language === "ar"
      ? heroCopy.subtitle_ar || t("catalog.heroSub")
      : heroCopy.subtitle_en || t("catalog.heroSub");

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

  const saveHeroCopy = useCallback(async () => {
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
  }, [heroDraft]);

  return (
    <div className={styles.root}>
      {/* Hero */}
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
                onClick={() => setHeroEditorOpen((v) => !v)}
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
                    onChange={(e) =>
                      setHeroDraft((c) => ({ ...c, title_en: e.target.value }))
                    }
                  />
                </label>
                <label className={styles.heroField}>
                  <span>{titleArLabel}</span>
                  <input
                    value={heroDraft.title_ar ?? ""}
                    onChange={(e) =>
                      setHeroDraft((c) => ({ ...c, title_ar: e.target.value }))
                    }
                  />
                </label>
                <label className={styles.heroField}>
                  <span>{subtitleEnLabel}</span>
                  <textarea
                    rows={3}
                    value={heroDraft.subtitle_en ?? ""}
                    onChange={(e) =>
                      setHeroDraft((c) => ({
                        ...c,
                        subtitle_en: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.heroField}>
                  <span>{subtitleArLabel}</span>
                  <textarea
                    rows={3}
                    value={heroDraft.subtitle_ar ?? ""}
                    onChange={(e) =>
                      setHeroDraft((c) => ({
                        ...c,
                        subtitle_ar: e.target.value,
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

      {/* Marquee */}
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

      {/* Showrooms + Projects sections */}
      <HomeShowroomsSection />
      <HomeProjectsSection />
    </div>
  );
}
