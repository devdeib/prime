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

type FilterType = "All" | "Residential" | "Commercial";

function ProjectsContent() {
  const { t, i18n } = useTranslation("common");
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as FilterType | null;
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState<FilterType>(
    typeParam && ["Residential", "Commercial"].includes(typeParam) ? typeParam : "All"
  );

  useEffect(() => {
    const c = new AbortController();
    fetch("/api/be/projects", { signal: c.signal })
      .then((r) => r.json())
      .then((j) => { if (Array.isArray(j)) setItems(j); })
      .catch(() => setItems([]));
    return () => c.abort();
  }, []);

  const validType =
    typeParam && ["Residential", "Commercial"].includes(typeParam)
      ? (typeParam as FilterType)
      : null;
  const activeFilter = validType ?? filter;

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const filtered = activeFilter === "All" ? sorted : sorted.filter((p) => (p.project_type ?? "Residential") === activeFilter);

  const filterLabel = (type: FilterType) => {
    if (type === "All") return i18n.language === "ar" ? "الكل" : "All";
    if (type === "Residential") return i18n.language === "ar" ? "سكني" : "Residential";
    return i18n.language === "ar" ? "تجاري" : "Commercial";
  };

  return (
    <section className={styles.page}>
      <BaseContainer>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("projectsPage.title")}</h1>
          <p className={styles.sub}>{t("projectsPage.subtitle")}</p>
        </header>

        <nav className={styles.filterNav} aria-label="Filter projects by type">
          {(["All", "Residential", "Commercial"] as FilterType[]).map((type, index) => (
            <>
              {index > 0 ? <span className={styles.filterSep} aria-hidden key={`sep-${type}`} /> : null}
              <button
                key={type}
                type="button"
                className={`${styles.filterTab} ${activeFilter === type ? styles.filterTabActive : ""}`}
                onClick={() => setFilter(type)}
                aria-current={activeFilter === type ? "true" : undefined}
              >
                {filterLabel(type)}
              </button>
            </>
          ))}
        </nav>

        {filtered.length === 0 ? (
          <p className="text-center text-muted py-5">{t("projectsPage.empty")}</p>
        ) : (
          <div className={styles.imakerGrid}>
            {filtered.map((project, index) => {
              const name = pickLocalized(i18n.language, project.name, project.name_ar);
              const city = pickLocalized(i18n.language, project.city, project.city_ar);
              const gallery = getProjectGallery(project);
              const heroImage = gallery[0];
              const isLarge = index === 0 || index % 3 === 0;

              return (
                <Link
                  key={project.id}
                  href={projectDetailPath(project.id)}
                  className={`${styles.imakerCard} ${isLarge ? styles.imakerCardLarge : styles.imakerCardSmall}`}
                  aria-label={name}
                >
                  <div className={styles.imakerImageWrap}>
                    <Image
                      src={heroImage}
                      alt={name}
                      fill
                      sizes={isLarge ? "(max-width: 900px) 100vw, 65vw" : "(max-width: 900px) 100vw, 40vw"}
                      className={styles.imakerImage}
                      unoptimized={projectImageNeedsUnoptimized(heroImage)}
                    />
                    <div className={styles.imakerOverlay} aria-hidden />
                    <div className={styles.imakerArrow} aria-hidden>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.imakerCaption}>
                    <h2 className={styles.imakerName}>{name}</h2>
                    {city ? <p className={styles.imakerCity}>{city}</p> : null}
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
