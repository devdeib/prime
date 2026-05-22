"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa6";
import { pickLocalized } from "@/lib/bilingual";
import {
  getProjectGallery,
  projectImageNeedsUnoptimized,
  type Project,
} from "@/lib/projects";
import ProjectGalleryCarousel from "./ProjectGalleryCarousel";
import styles from "./project-detail.module.css";

type Props = {
  projectId: number;
};

export default function ProjectDetailView({ projectId }: Props) {
  const { t, i18n } = useTranslation("common");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);

    fetch(`/api/be/projects/${projectId}`, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setProject(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object" && "id" in data) {
          setProject(data as Project);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setNotFound(true);
          setProject(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [projectId]);

  if (loading) {
    return (
      <section className={styles.page}>
        <p className={styles.loading}>{t("dashboard.loading")}</p>
      </section>
    );
  }

  if (notFound || !project) {
    return (
      <section className={styles.page}>
        <div className={styles.notFound}>
          <p>{t("projectDetail.notFound")}</p>
          <Link href="/projects" className={styles.backLink}>
            <FaArrowLeft aria-hidden />
            {t("projectDetail.backToProjects")}
          </Link>
        </div>
      </section>
    );
  }

  const gallery = getProjectGallery(project);
  const heroImage = gallery[0];
  const name = pickLocalized(i18n.language, project.name, project.name_ar);
  const city = pickLocalized(i18n.language, project.city, project.city_ar);
  const address = pickLocalized(i18n.language, project.address, project.address_ar);
  const description = pickLocalized(
    i18n.language,
    project.description,
    project.description_ar
  );
  const typology =
    project.project_type === "Commercial"
      ? i18n.language === "ar"
        ? "تجاري"
        : "Commercial"
      : i18n.language === "ar"
        ? "سكني"
        : "Residential";

  const metaAddress =
    address?.trim() ||
    (i18n.language === "ar" ? "—" : "—");

  return (
    <article className={styles.page}>
      <section className={styles.hero} aria-label={name}>
        <div className={styles.heroMedia}>
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
            unoptimized={projectImageNeedsUnoptimized(heroImage)}
          />
          <div className={styles.heroOverlay} aria-hidden />
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{name}</h1>
          {city ? <p className={styles.heroSub}>{city}</p> : null}
        </div>
      </section>

      <section className={styles.metaBar} aria-label={t("projectDetail.metaLabel")}>
        <div className={styles.metaCell}>
          <span className={styles.metaLabel}>{t("projectDetail.location")}</span>
          <span className={styles.metaValue}>{city || "—"}</span>
        </div>
        <div className={styles.metaCell}>
          <span className={styles.metaLabel}>{t("projectDetail.typology")}</span>
          <span className={styles.metaValue}>{typology}</span>
        </div>
        <div className={styles.metaCell}>
          <span className={styles.metaLabel}>{t("projectDetail.address")}</span>
          <span className={styles.metaValue}>{metaAddress}</span>
        </div>
      </section>

      <section className={styles.details}>
        <Link href="/projects" className={styles.backLink}>
          <FaArrowLeft aria-hidden />
          {t("projectDetail.backToProjects")}
        </Link>

        {description ? (
          <div className={styles.descriptionBlock}>
            <h2 className={styles.detailsHeading}>{t("projectDetail.about")}</h2>
            <p className={styles.description}>{description}</p>
          </div>
        ) : null}
      </section>

      {gallery.length > 0 ? (
        <section className={styles.gallerySection} aria-label={t("projectDetail.gallery")}>
          <ProjectGalleryCarousel images={gallery} alt={name} />
        </section>
      ) : null}
    </article>
  );
}
