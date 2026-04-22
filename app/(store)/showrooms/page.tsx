"use client";

import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import BaseContainer from "@/components/common/container/BaseContainer";
import styles from "./showrooms.module.css";

type ShowroomApi = {
  id: number;
  name: string;
  name_ar?: string | null;
  city?: string | null;
  city_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  sort_order: number;
};

export default function ShowroomsPage() {
  const { t, i18n } = useTranslation("common");
  const [items, setItems] = useState<ShowroomApi[]>([]);
  const [viewer, setViewer] = useState<{
    showroom: ShowroomApi;
    gallery: string[];
    activeIndex: number;
  } | null>(null);

  useEffect(() => {
    const c = new AbortController();
    fetch("/api/be/showrooms", { signal: c.signal })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) setItems(j.data);
      })
      .catch(() => setItems([]));
    return () => c.abort();
  }, []);

  const sorted = [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  );

  // Helper: Get gallery images from showroom
  function getGallery(showroom: ShowroomApi): string[] {
    if (showroom.images && showroom.images.length > 0 && showroom.images.filter(Boolean).length > 0) {
      return showroom.images.filter(Boolean);
    }
    if (showroom.image_url?.trim()) {
      return [showroom.image_url.trim()];
    }
    // fallback placeholder
    return [`https://picsum.photos/seed/showroom-${showroom.id}/960/640`];
  }

  return (
    <section className={styles.page}>
      <BaseContainer>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("showroomsPage.title")}</h1>
          <p className={styles.sub}>{t("showroomsPage.subtitle")}</p>
        </header>

        {sorted.length === 0 ? (
          <p className="text-center text-muted py-5">
            {t("showroomsPage.empty")}
          </p>
      ) : (
          <ul className={styles.list}>
            {sorted.map((showroom) => {
              const gallery = getGallery(showroom);
              return (
                <li
                  key={showroom.id}
                  className={styles.listItem}
                  tabIndex={0}
                  onClick={() => setViewer({ showroom, gallery, activeIndex: 0 })}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      setViewer({ showroom, gallery, activeIndex: 0 });
                    }
                  }}
                  aria-label={`${pickLocalized(i18n.language, showroom.name, showroom.name_ar)} (${pickLocalized(i18n.language, showroom.city, showroom.city_ar)})`}
                >
                  <span className={styles.listName}>
                    {pickLocalized(i18n.language, showroom.name, showroom.name_ar)}
                  </span>
                  <span className={styles.listCity}>
                    {pickLocalized(i18n.language, showroom.city, showroom.city_ar)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </BaseContainer>
      {viewer ? (
        <ShowroomViewer
          showroom={viewer.showroom}
          gallery={viewer.gallery}
          language={i18n.language}
          initialIndex={viewer.activeIndex}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </section>
  );
}

import Image from "next/image";

function ShowroomViewer({
  showroom,
  gallery,
  language,
  initialIndex,
  onClose,
}: {
  showroom: ShowroomApi;
  gallery: string[];
  language: string;
  initialIndex: number;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeImage =
    gallery[Math.min(activeIndex, gallery.length - 1)] ?? gallery[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1) % gallery.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gallery.length, onClose]);

  return (
    <div className={styles.viewerBackdrop} onClick={onClose} role="presentation">
      <div
        className={styles.viewerDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={pickLocalized(language, showroom.name, showroom.name_ar)}
      >
        <button
          type="button"
          className={styles.viewerClose}
          onClick={onClose}
          aria-label="Close gallery"
        >
          <FaXmark />
        </button>

        <div className={styles.viewerHeader}>
          <div>
            <p className={styles.viewerCity}>
              {pickLocalized(language, showroom.city, showroom.city_ar)}
            </p>
            <h2 className={styles.viewerTitle}>
              {pickLocalized(language, showroom.name, showroom.name_ar)}
            </h2>
          </div>
          <div className={styles.viewerMeta}>
            {showroom.address ? (
              <p className={styles.viewerAddress}>
                {pickLocalized(language, showroom.address, showroom.address_ar)}
              </p>
            ) : null}
            {showroom.description ? (
              <p className={styles.viewerDescription}>
                {pickLocalized(language, showroom.description, showroom.description_ar)}
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.viewerBody}>
          <div className={styles.viewerStage}>
            {gallery.length > 1 ? (
              <button
                type="button"
                className={`${styles.viewerNav} ${styles.viewerPrev}`}
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
                }
                aria-label="Previous image"
              >
                <FaChevronLeft />
              </button>
            ) : null}

            <div className={styles.viewerImageFrame}>
              <Image
                src={activeImage}
                alt={pickLocalized(language, showroom.name, showroom.name_ar)}
                fill
                sizes="90vw"
                className={styles.viewerImage}
                unoptimized={
                  activeImage.startsWith("/uploads/") || activeImage.startsWith("http")
                }
              />
            </div>

            {gallery.length > 1 ? (
              <button
                type="button"
                className={`${styles.viewerNav} ${styles.viewerNext}`}
                onClick={() => setActiveIndex((prev) => (prev + 1) % gallery.length)}
                aria-label="Next image"
              >
                <FaChevronRight />
              </button>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <aside className={styles.viewerRail}>
              <p className={styles.viewerRailLabel}>Gallery</p>
              <div className={styles.viewerThumbs}>
                {gallery.map((image, index) => (
                  <button
                    key={`${showroom.id}-viewer-${index}`}
                    type="button"
                    className={`${styles.viewerThumb} ${index === activeIndex ? styles.viewerThumbActive : ""}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="96px"
                      className={styles.viewerThumbImage}
                      unoptimized={image.startsWith("/uploads/") || image.startsWith("http")}
                    />
                  </button>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
