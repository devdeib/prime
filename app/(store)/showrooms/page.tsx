"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import { showroomDetailPath, type Showroom } from "@/lib/showrooms";
import BaseContainer from "@/components/common/container/BaseContainer";
import styles from "./showrooms.module.css";

export default function ShowroomsPage() {
  const { t, i18n } = useTranslation("common");
  const [items, setItems] = useState<Showroom[]>([]);

  useEffect(() => {
    const c = new AbortController();
    fetch("/api/be/showrooms", { signal: c.signal })
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

  return (
    <section className={styles.page}>
      <BaseContainer>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("showroomsPage.title")}</h1>
          <p className={styles.sub}>{t("showroomsPage.subtitle")}</p>
        </header>

        {sorted.length === 0 ? (
          <p className="text-center text-muted py-5">
            {t("showroomsPage.empty")}
          </p>
        ) : (
          <ul className={styles.list}>
            {sorted.map((showroom) => {
              const label = `${pickLocalized(i18n.language, showroom.name, showroom.name_ar)} (${pickLocalized(i18n.language, showroom.city, showroom.city_ar)})`;

              return (
                <li key={showroom.id}>
                  <Link
                    href={showroomDetailPath(showroom.id)}
                    className={styles.listItem}
                    aria-label={label}
                  >
                    <span className={styles.listName}>
                      {pickLocalized(i18n.language, showroom.name, showroom.name_ar)}
                    </span>
                    <span className={styles.listCity}>
                      {pickLocalized(i18n.language, showroom.city, showroom.city_ar)}
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
