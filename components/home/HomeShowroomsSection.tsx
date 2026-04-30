"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
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

function showroomImage(showroom: ShowroomItem) {
  const image = showroom.images?.find(Boolean) || showroom.image_url;
  if (image) return image;
  return `https://picsum.photos/seed/showroom-${showroom.id}/900/1200`;
}

export default function HomeShowroomsSection() {
  const { t, i18n } = useTranslation("common");
  const [showrooms, setShowrooms] = useState<ShowroomItem[]>([]);
  const title =
    t("homeShowrooms.title") === "homeShowrooms.title"
      ? "SHOWROOMS"
      : t("homeShowrooms.title");
  const subtitle =
    t("homeShowrooms.subtitle") === "homeShowrooms.subtitle"
      ? "You can visit us in one of our curated showrooms and explore how each collection comes to life in a real interior setting."
      : t("homeShowrooms.subtitle");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/be/showrooms", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setShowrooms(data);
        }
      })
      .catch(() => {
        setShowrooms([]);
      });
    return () => controller.abort();
  }, []);

  const cards = useMemo(
    () => (showrooms.length > 0 ? showrooms : FALLBACK_SHOWROOMS),
    [showrooms]
  );

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <div className={styles.rail}>
          {cards.map((showroom) => (
            <Link
              key={showroom.id}
              href="/showrooms"
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
    </section>
  );
}
