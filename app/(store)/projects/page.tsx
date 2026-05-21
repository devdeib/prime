"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import {
  normalizeProjectType,
  projectTypeLabel,
  type ProjectType,
} from "@/lib/project-type";
import BaseContainer from "@/components/common/container/BaseContainer";
import ProjectFilterTabs from "@/components/projects/ProjectFilterTabs";
import ProjectPortfolioCard from "@/components/projects/ProjectPortfolioCard";
import styles from "./projects.module.css";

type ProjectApi = {
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
  project_type?: string | null;
};

const PROJECT_PLACEHOLDER = "/images/La dolce casa.svg";

export default function ProjectsPage() {
  const { t, i18n } = useTranslation("common");
  const [items, setItems] = useState<ProjectApi[]>([]);
  const [activeType, setActiveType] = useState<ProjectType>("residential");
  const [viewer, setViewer] = useState<{
    project: ProjectApi;
    gallery: string[];
    activeIndex: number;
  } | null>(null);

  useEffect(() => {
    const c = new AbortController();
    fetch("/api/be/projects", { signal: c.signal })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j)) setItems(j);
      })
      .catch(() => setItems([]));
    return () => c.abort();
  }, []);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [items]
  );

  const filtered = useMemo(
    () =>
      sorted.filter(
        (project) => normalizeProjectType(project.project_type) === activeType
      ),
    [sorted, activeType]
  );

  function getGallery(project: ProjectApi): string[] {
    if (
      project.images &&
      project.images.length > 0 &&
      project.images.filter(Boolean).length > 0
    ) {
      return project.images.filter(Boolean);
    }
    if (project.image_url?.trim()) {
      return [project.image_url.trim()];
    }
    return [PROJECT_PLACEHOLDER];
  }

  const residentialLabel =
    t("projectsPage.residential") === "projectsPage.residential"
      ? "Residential"
      : t("projectsPage.residential");
  const commercialLabel =
    t("projectsPage.commercial") === "projectsPage.commercial"
      ? "Commercial"
      : t("projectsPage.commercial");

  return (
    <section className={styles.page}>
      <BaseContainer>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("projectsPage.title")}</h1>
          <p className={styles.sub}>{t("projectsPage.subtitle")}</p>
        </header>

        <ProjectFilterTabs
          active={activeType}
          onChange={setActiveType}
          residentialLabel={residentialLabel}
          commercialLabel={commercialLabel}
        />

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {t("projectsPage.empty")}
          </p>
        ) : (
          <ul className={styles.grid} key={activeType}>
            {filtered.map((project, index) => (
              <li key={project.id} className={styles.gridItem}>
                <ProjectPortfolioCard
                  project={project}
                  language={i18n.language}
                  placeholder={PROJECT_PLACEHOLDER}
                  animationDelay={`${Math.min(index, 12) * 0.06}s`}
                  onActivate={() =>
                    setViewer({ project, gallery: getGallery(project), activeIndex: 0 })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </BaseContainer>
      {viewer ? (
        <ProjectViewer
          project={viewer.project}
          gallery={viewer.gallery}
          language={i18n.language}
          initialIndex={viewer.activeIndex}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </section>
  );
}

function ProjectViewer({
  project,
  gallery,
  language,
  initialIndex,
  onClose,
}: {
  project: ProjectApi;
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
        aria-label={pickLocalized(language, project.name, project.name_ar)}
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
              {pickLocalized(language, project.city, project.city_ar)}
            </p>
            <h2 className={styles.viewerTitle}>
              {pickLocalized(language, project.name, project.name_ar)}
            </h2>
            <p className={styles.viewerType}>
              {projectTypeLabel(normalizeProjectType(project.project_type), language)}
            </p>
          </div>
          <div className={styles.viewerMeta}>
            {project.address ? (
              <p className={styles.viewerAddress}>
                {pickLocalized(language, project.address, project.address_ar)}
              </p>
            ) : null}
            {project.description ? (
              <p className={styles.viewerDescription}>
                {pickLocalized(language, project.description, project.description_ar)}
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
                alt={pickLocalized(language, project.name, project.name_ar)}
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
                    key={`${project.id}-viewer-${index}`}
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
