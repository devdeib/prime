"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa6";
import { pickLocalized } from "@/lib/bilingual";
import {
  getShowroomGallery,
  type Showroom,
} from "@/lib/showrooms";
import { projectImageNeedsUnoptimized } from "@/lib/projects";
import ProjectGalleryCarousel from "@/components/projects/ProjectGalleryCarousel";
import styles from "@/components/projects/project-detail.module.css";

type Props = {
  showroomId: number;
};

export default function ShowroomDetailView({ showroomId }: Props) {
  const { t, i18n } = useTranslation("common");
  const [showroom, setShowroom] = useState<Showroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);

    fetch(`/api/be/showrooms/${showroomId}`, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setShowroom(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object" && "id" in data) {
          setShowroom(data as Showroom);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setNotFound(true);
          setShowroom(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [showroomId]);

  if (loading) {
    return (
      <section className={styles.page}>
        <p className={styles.loading}>{t("dashboard.loading")}</p>
      </section>
    );
  }

  if (notFound || !showroom) {
    return (
      <section className={styles.page}>
        <div className={styles.notFound}>
          <p>{t("showroomDetail.notFound")}</p>
          <Link href="/showrooms" className={styles.backLink}>
            <FaArrowLeft aria-hidden />
            {t("showroomDetail.backToShowrooms")}
          </Link>
        </div>
      </section>
    );
  }

  const gallery = getShowroomGallery(showroom);
  const heroImage = gallery[0];
  const name = pickLocalized(i18n.language, showroom.name, showroom.name_ar);
  const city = pickLocalized(i18n.language, showroom.city, showroom.city_ar);
  const address = pickLocalized(i18n.language, showroom.address, showroom.address_ar);
  const description = pickLocalized(
    i18n.language,
    showroom.description,
    showroom.description_ar
  );

  const metaAddress = address?.trim() || "—";

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

      <section
        className={`${styles.metaBar} ${styles.metaBarTwo}`}
        aria-label={t("showroomDetail.metaLabel")}
      >
        <div className={styles.metaCell}>
          <span className={styles.metaLabel}>{t("showroomDetail.location")}</span>
          <span className={styles.metaValue}>{city || "—"}</span>
        </div>
        <div className={styles.metaCell}>
          <span className={styles.metaLabel}>{t("showroomDetail.address")}</span>
          <span className={styles.metaValue}>{metaAddress}</span>
        </div>
      </section>

      <section className={styles.details}>
        <Link href="/showrooms" className={styles.backLink}>
          <FaArrowLeft aria-hidden />
          {t("showroomDetail.backToShowrooms")}
        </Link>

        {description ? (
          <div className={styles.descriptionBlock}>
            <h2 className={styles.detailsHeading}>{t("showroomDetail.about")}</h2>
            <p className={styles.description}>{description}</p>
          </div>
        ) : null}
      </section>

      {gallery.length > 0 ? (
        <section className={styles.gallerySection} aria-label={t("showroomDetail.gallery")}>
          <ProjectGalleryCarousel images={gallery} alt={name} />
        </section>
      ) : null}
    </article>
  );
}
