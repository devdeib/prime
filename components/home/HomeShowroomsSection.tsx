"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import { projectDetailPath } from "@/lib/projects";
import { showroomDetailPath } from "@/lib/showrooms";
import styles from "./home-showrooms-section.module.css";

type ShowroomItem = {
  id: number;
  name: string;
  name_ar?: string | null;
  city?: string | null;
  city_ar?: string | null;
  image_url?: string | null;
  images?: string[] | null;
};

const FALLBACK_SHOWROOMS: ShowroomItem[] = [
  { id: 1, name: "Showroom", city: "Riyadh" },
  { id: 2, name: "Showroom", city: "Jeddah" },
  { id: 3, name: "Showroom", city: "Rome" },
  { id: 4, name: "Showroom", city: "Dubai" },
];

const FALLBACK_PROJECTS: ShowroomItem[] = [
  { id: 1, name: "Residential Project", city: "Riyadh" },
  { id: 2, name: "Villa Interior", city: "Jeddah" },
  { id: 3, name: "Private Residence", city: "Dubai" },
  { id: 4, name: "Apartment Styling", city: "Rome" },
];

const PLACEHOLDER_IMAGE = "/images/La dolce casa.svg";

function showroomImage(showroom: ShowroomItem) {
  const image = showroom.images?.find(Boolean) || showroom.image_url;
  if (image) return image;
  return PLACEHOLDER_IMAGE;
}

export default function HomeShowroomsSection() {
  return <HomeCollectionSection kind="showrooms" />;
}

export function HomeProjectsSection() {
  return <HomeCollectionSection kind="projects" />;
}

function ProjectFeatureCard({
  project,
  size,
  language,
}: {
  project: ShowroomItem;
  size: "large" | "small";
  language: string;
}) {
  const name = pickLocalized(language, project.name, project.name_ar);
  const meta = project.city
    ? pickLocalized(language, project.city, project.city_ar)
    : null;

  return (
    <Link
      href={projectDetailPath(project.id)}
      className={
        size === "large" ? styles.projectCardLarge : styles.projectCardSmall
      }
      aria-label={name}
    >
      <div className={styles.projectMedia}>
        <Image
          src={showroomImage(project)}
          alt={name}
          fill
          sizes={
            size === "large"
              ? "(max-width: 900px) 100vw, 65vw"
              : "(max-width: 900px) 100vw, 32vw"
          }
          className={styles.projectImage}
          unoptimized={showroomImage(project).startsWith("http")}
        />
      </div>
      <div className={styles.projectCaption}>
        <h3 className={styles.projectCardTitle}>{name}</h3>
        {meta ? <p className={styles.projectCardMeta}>{meta}</p> : null}
      </div>
    </Link>
  );
}

function HomeCollectionSection({ kind }: { kind: "showrooms" | "projects" }) {
  const { t, i18n } = useTranslation("common");
  const [items, setItems] = useState<ShowroomItem[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const isProjects = kind === "projects";
  const title =
    t(isProjects ? "homeProjects.title" : "homeShowrooms.title") ===
    (isProjects ? "homeProjects.title" : "homeShowrooms.title")
      ? isProjects
        ? "PROJECTS"
        : "SHOWROOMS"
      : t(isProjects ? "homeProjects.title" : "homeShowrooms.title");
  const subtitle =
    t(isProjects ? "homeProjects.subtitle" : "homeShowrooms.subtitle") ===
    (isProjects ? "homeProjects.subtitle" : "homeShowrooms.subtitle")
      ? isProjects
        ? "Explore selected projects and completed interiors shaped with the same care as our showroom experiences."
        : "You can visit us in one of our curated showrooms and explore how each collection comes to life in a real interior setting."
      : t(isProjects ? "homeProjects.subtitle" : "homeShowrooms.subtitle");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const fallback = isProjects ? FALLBACK_PROJECTS : FALLBACK_SHOWROOMS;
    fetch(`/api/be/${kind}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems(fallback);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems(fallback);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [kind, isProjects]);

  const cards = items;

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 320),
      behavior: "smooth",
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 className={`${styles.title} ${styles.homeSectionTitle}`}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <div className={styles.sliderShell}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            aria-label={`Previous ${title.toLowerCase()}`}
            onClick={() => scrollRail(-1)}
          />
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            aria-label={`Next ${title.toLowerCase()}`}
            onClick={() => scrollRail(1)}
          />
          <div className={styles.rail} ref={railRef} aria-busy={loading || undefined}>
          {loading && [1, 2, 3, 4].map((n) => (
            <div key={n} className={`${styles.skeletonRailCard} ${styles.skeleton}`} />
          ))}
          {!loading && cards.map((showroom) => (
            <Link
              key={showroom.id}
              href={
                isProjects ? projectDetailPath(showroom.id) : showroomDetailPath(showroom.id)
              }
              className={styles.card}
              aria-label={pickLocalized(
                i18n.language,
                showroom.name,
                showroom.name_ar
              )}
            >
              <Image
                src={showroomImage(showroom)}
                alt={pickLocalized(i18n.language, showroom.name, showroom.name_ar)}
                fill
                sizes="(max-width: 900px) 72vw, 24vw"
                className={styles.image}
                unoptimized={showroomImage(showroom).startsWith("http")}
              />
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>
                  {pickLocalized(i18n.language, showroom.name, showroom.name_ar)}
                </h3>
                {showroom.city ? (
                  <p className={styles.cardMeta}>
                    {pickLocalized(i18n.language, showroom.city, showroom.city_ar)}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
