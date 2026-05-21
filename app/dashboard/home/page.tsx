"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import styles from "./dashboard-home.module.css";

type DashboardCounts = {
  users: number;
  categories: number;
  products: number;
  heroSlides: number;
  showrooms: number;
  projects: number;
  meetingsToday: number;
};

export default function DashboardHomePage() {
  const { t } = useTranslation("common");
  const [counts, setCounts] = useState<DashboardCounts | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [
          usersRes,
          categoriesRes,
          productsRes,
          heroSlidesRes,
          showroomsRes,
          projectsRes,
          meetingsRes,
        ] = await Promise.all([
          fetch("/api/be/users", { credentials: "include" }),
          fetch("/api/be/categories", { credentials: "include" }),
          fetch("/api/be/products", { credentials: "include" }),
          fetch("/api/be/hero-slides", { credentials: "include" }),
          fetch("/api/be/showrooms", { credentials: "include" }),
          fetch("/api/be/projects", { credentials: "include" }),
          fetch("/api/be/vip-meetings/today", { credentials: "include" }),
        ]);

        const [
          usersJson,
          categoriesJson,
          productsJson,
          heroSlidesJson,
          showroomsJson,
          projectsJson,
          meetingsJson,
        ] = await Promise.all([
          usersRes.json().catch(() => []),
          categoriesRes.json().catch(() => []),
          productsRes.json().catch(() => []),
          heroSlidesRes.json().catch(() => []),
          showroomsRes.json().catch(() => []),
          projectsRes.json().catch(() => []),
          meetingsRes.json().catch(() => []),
        ]);

        if (!mounted) return;
        setCounts({
          users: Array.isArray(usersJson) ? usersJson.length : 0,
          categories: Array.isArray(categoriesJson) ? categoriesJson.length : 0,
          products: Array.isArray(productsJson) ? productsJson.length : 0,
          heroSlides: Array.isArray(heroSlidesJson) ? heroSlidesJson.length : 0,
          showrooms: Array.isArray(showroomsJson) ? showroomsJson.length : 0,
          projects: Array.isArray(projectsJson) ? projectsJson.length : 0,
          meetingsToday: Array.isArray(meetingsJson) ? meetingsJson.length : 0,
        });
      } catch {
        if (mounted) setCounts(null);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: t("dashboard.users") === "dashboard.users" ? "Users" : t("dashboard.users"), value: counts?.users ?? "—" },
      { label: t("dashboard.categories") === "dashboard.categories" ? "Categories" : t("dashboard.categories"), value: counts?.categories ?? "—" },
      { label: t("dashboard.products") === "dashboard.products" ? "Products" : t("dashboard.products"), value: counts?.products ?? "—" },
      { label: t("dashboard.heroSlides") === "dashboard.heroSlides" ? "Hero slides" : t("dashboard.heroSlides"), value: counts?.heroSlides ?? "—" },
      { label: t("dashboard.showroomsMenu") === "dashboard.showroomsMenu" ? "Showrooms" : t("dashboard.showroomsMenu"), value: counts?.showrooms ?? "—" },
      { label: t("dashboard.projectsMenu") === "dashboard.projectsMenu" ? "Projects" : t("dashboard.projectsMenu"), value: counts?.projects ?? "—" },
      { label: t("dashboard.meetingsTodayCount") === "dashboard.meetingsTodayCount" ? "Meetings today" : t("dashboard.meetingsTodayCount"), value: counts?.meetingsToday ?? "—" },
    ],
    [counts, t]
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>DASBOARD</h1>
      </header>

      <div className={styles.card}>
        <div className={styles.statsRow} aria-label="Website summary">
          {cards.map((card, index) => (
            <div
              key={card.label}
              className={`${styles.statCell} ${
                index < cards.length - 1 ? styles.statCellWithDivider : ""
              }`}
            >
              <div className={styles.statNumber}>{card.value}</div>
              <div className={styles.statName}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.featureGrid}>
          <article className={styles.feature}>
            <h2 className={styles.featureTitle}>{t("dashboard.products")}</h2>
            <p className={styles.featureText}>
              Manage catalog items with clearer hierarchy and better media handling.
            </p>
          </article>
          <article className={styles.feature}>
            <h2 className={styles.featureTitle}>{t("dashboard.categories")}</h2>
            <p className={styles.featureText}>
              Keep naming and aliases consistent across the bilingual storefront.
            </p>
          </article>
          <article className={styles.feature}>
            <h2 className={styles.featureTitle}>{t("dashboard.showroomsMenu")}</h2>
            <p className={styles.featureText}>
              Curate showroom content with the same visual language as the public site.
            </p>
          </article>
          <article className={styles.feature}>
            <h2 className={styles.featureTitle}>{t("dashboard.projectsMenu")}</h2>
            <p className={styles.featureText}>
              Publish completed work with consistent bilingual presentation.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
