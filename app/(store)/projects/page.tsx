"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import { projectDetailPath, getProjectGallery, projectImageNeedsUnoptimized, type Project } from "@/lib/projects";
import BaseContainer from "@/components/common/container/BaseContainer";
import styles from "./projects.module.css";

function ProjectsContent() {
  const { t, i18n } = useTranslation("common");
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const c = new AbortController();
    fetch("/api/be/projects", { signal: c.signal })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j)) {
          setItems(j);
        }
      })
      .catch(() => setItems([]));
    return () => c.abort();
  }, []);

  // Derive categories dynamically from project data
  const categories = ["All", ...Array.from(
    new Set(items.map((p) => p.project_type ?? "Residential").filter(Boolean))
  ).sort()];

  // Respect URL param once categories are loaded
  useEffect(() => {
    if (typeParam && categories.includes(typeParam)) {
      setFilter(typeParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam, items]);

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const filtered = filter === "All" ? sorted : sorted.filter((p) => (p.project_type ?? "Residential") === filter);

  return (
    <section className={styles.page}>
      <BaseContainer>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("projectsPage.title")}</h1>
          <p className={styles.sub}>{t("projectsPage.subtitle")}</p>
        </header>

        {categories.length > 1 && (
          <nav className={styles.filterNav} aria-label="Filter projects by type">
            {categories.map((type, index) => (
              <span key={type} className={styles.filterGroup}>
                {index > 0 ? <span className={styles.filterSep} aria-hidden /> : null}
                <button
                  type="button"
                  className={`${styles.filterTab} ${filter === type ? styles.filterTabActive : ""}`}
                  onClick={() => setFilter(type)}
                  aria-current={filter === type ? "true" : undefined}
                >
                  {type}
                </button>
              </span>
            ))}
          </nav>
        )}

        {filtered.length === 0 ? (
          <p className="text-center text-muted py-5">{t("projectsPage.empty")}</p>
        ) : (
          <div className={styles.shawaGrid}>
            {filtered.map((project) => {
              const name = pickLocalized(i18n.language, project.name, project.name_ar);
              const city = pickLocalized(i18n.language, project.city, project.city_ar);
              const gallery = getProjectGallery(project);
              const heroImage = gallery[0];

              return (
                <Link
                  key={project.id}
                  href={projectDetailPath(project.id)}
                  className={styles.shawaCard}
                  aria-label={name}
                >
                  <div className={styles.shawaImageWrap}>
                    <Image
                      src={heroImage}
                      alt={name}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                      className={styles.shawaImage}
                      unoptimized={projectImageNeedsUnoptimized(heroImage)}
                    />
                    <div className={styles.shawaOverlay} aria-hidden />
                    <div className={styles.shawaCaption}>
                      <h2 className={styles.shawaName}>{name}</h2>
                      {city ? <p className={styles.shawaCity}>{city}</p> : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </BaseContainer>
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsContent />
    </Suspense>
  );
}
