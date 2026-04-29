"use client";

import { useTranslation } from "react-i18next";
import styles from "./dashboard-home.module.css";

export default function DashboardHomePage() {
  const { t } = useTranslation("common");

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.panel}>
          <p className={styles.eyebrow}>La Dolce Casa</p>
          <h1 className={styles.title}>{t("dashboard.dashboard")}</h1>
          <p className={styles.text}>
            A calmer control room for products, categories, hero images, and
            showroom and project content. The goal here is a cleaner administrative
            experience that feels connected to the storefront instead of a
            separate generic tool.
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>01</span>
            <span className={styles.statLabel}>Storefront theme aligned</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>05</span>
            <span className={styles.statLabel}>Core admin sections ready</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <article className={styles.note}>
          <h2 className={styles.noteTitle}>{t("dashboard.products")}</h2>
          <p className={styles.noteText}>
            Manage catalog items with a lighter form surface and clearer table hierarchy.
          </p>
        </article>
        <article className={styles.note}>
          <h2 className={styles.noteTitle}>{t("dashboard.categories")}</h2>
          <p className={styles.noteText}>
            Keep category naming and aliases organized without the old cluttered feel.
          </p>
        </article>
        <article className={styles.note}>
          <h2 className={styles.noteTitle}>{t("dashboard.showroomsMenu")}</h2>
          <p className={styles.noteText}>
            Curate showroom information and media in a layout that better matches the public site.
          </p>
        </article>
        <article className={styles.note}>
          <h2 className={styles.noteTitle}>{t("dashboard.projectsMenu")}</h2>
          <p className={styles.noteText}>
            Publish completed work using the same bilingual gallery flow available for showrooms.
          </p>
        </article>
      </div>
    </section>
  );
}
