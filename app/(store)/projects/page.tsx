"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import { projectDetailPath, type Project } from "@/lib/projects";
import BaseContainer from "@/components/common/container/BaseContainer";
import styles from "./projects.module.css";

type FilterType = "All" | "Residential" | "Commercial";

export default function ProjectsPage() {
  const { t, i18n } = useTranslation("common");
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState<FilterType>("All");

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

  const sorted = [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  );

  const filtered =
    filter === "All"
      ? sorted
      : sorted.filter(
          (p) => (p.project_type ?? "Residential") === filter
        );

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
                className={`${styles.filterTab} ${filter === type ? styles.filterTabActive : ""}`}
                onClick={() => setFilter(type)}
                aria-current={filter === type ? "true" : undefined}
              >
                {filterLabel(type)}
              </button>
            </>
          ))}
        </nav>

        {filtered.length === 0 ? (
          <p className="text-center text-muted py-5">
            {t("projectsPage.empty")}
          </p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((project) => {
              const label = `${pickLocalized(i18n.language, project.name, project.name_ar)} (${pickLocalized(i18n.language, project.city, project.city_ar)})`;

              return (
                <li key={project.id}>
                  <Link
                    href={projectDetailPath(project.id)}
                    className={styles.listItem}
                    aria-label={label}
                  >
                    <span className={styles.listName}>
                      {pickLocalized(i18n.language, project.name, project.name_ar)}
                    </span>
                    {project.project_type && project.project_type !== "Residential" ? (
                      <span className={styles.listTypeBadge}>{filterLabel(project.project_type)}</span>
                    ) : null}
                    <span className={styles.listCity}>
                      {pickLocalized(i18n.language, project.city, project.city_ar)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </BaseContainer>
    </section>
  );
}
