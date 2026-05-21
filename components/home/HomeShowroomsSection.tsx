"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./home-showrooms-section.module.css";

type ShowroomItem = {
  id: number;
  name: string;
  name_ar?: string | null;
  city?: string | null;
  city_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  images?: string[] | null;
};

function showroomImage(showroom: ShowroomItem) {
  const image = showroom.images?.find(Boolean) || showroom.image_url;
  if (image) return image;
  return `https://picsum.photos/seed/showroom-${showroom.id}/900/1200`;
}

export default function HomeShowroomsSection() {
  return <HomeCollectionSection kind="showrooms" />;
}

export function HomeProjectsSection() {
  return <HomeCollectionSection kind="projects" />;
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

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/be/${kind}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      })
      .catch(() => {
        setItems([]);
      });
    return () => controller.abort();
  }, [kind]);

  const cards = useMemo(() => items, [items]);

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
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        {cards.length === 0 ? null : (
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
          <div
            className={`${styles.rail} ${isProjects ? styles.railProjects : ""}`}
            ref={railRef}
          >
          {cards.map((showroom) => {
            const name = pickLocalized(i18n.language, showroom.name, showroom.name_ar);
            const subtitle =
              pickLocalized(i18n.language, showroom.city, showroom.city_ar) ||
              (isProjects
                ? pickLocalized(
                    i18n.language,
                    (showroom as { description?: string }).description,
                    (showroom as { description_ar?: string }).description_ar
                  )
                : "");

            return (
            <Link
              key={showroom.id}
              href={isProjects ? "/projects" : "/showrooms"}
              className={`${styles.card} ${isProjects ? styles.cardProject : ""}`}
              aria-label={name}
            >
              <div className={styles.cardMedia}>
                <Image
                  src={showroomImage(showroom)}
                  alt={name}
                  fill
                  sizes="(max-width: 900px) 72vw, 24vw"
                  className={styles.image}
                  unoptimized={showroomImage(showroom).startsWith("http")}
                />
                {!isProjects ? <span className={styles.cardShade} aria-hidden /> : null}
              </div>
              {isProjects ? (
                <div className={styles.cardCopyBelow}>
                  <h3 className={styles.cardTitleBelow}>{name}</h3>
                  {subtitle ? <p className={styles.cardMetaBelow}>{subtitle}</p> : null}
                </div>
              ) : (
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{name}</h3>
                  {showroom.city ? (
                    <p className={styles.cardMeta}>
                      {pickLocalized(i18n.language, showroom.city, showroom.city_ar)}
                    </p>
                  ) : null}
                </div>
              )}
            </Link>
          );
          })}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
