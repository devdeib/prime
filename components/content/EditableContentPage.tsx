"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BaseContainer from "@/components/common/container/BaseContainer";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./editable-content-page.module.css";

type PageContent = {
  eyebrow_en?: string;
  eyebrow_ar?: string;
  title_en?: string;
  title_ar?: string;
  body_en?: string;
  body_ar?: string;
  image_url?: string;
  stat_primary_value_en?: string;
  stat_primary_value_ar?: string;
  stat_primary_label_en?: string;
  stat_primary_label_ar?: string;
  stat_1_value_en?: string;
  stat_1_value_ar?: string;
  stat_1_label_en?: string;
  stat_1_label_ar?: string;
  stat_2_value_en?: string;
  stat_2_value_ar?: string;
  stat_2_label_en?: string;
  stat_2_label_ar?: string;
  stat_3_value_en?: string;
  stat_3_value_ar?: string;
  stat_3_label_en?: string;
  stat_3_label_ar?: string;
};

type Props = {
  contentKey: "about" | "services";
  fallbackImage?: string;
};

const DEFAULT_IMAGE = "https://picsum.photos/seed/la-dolce-content/1200/1400";

export default function EditableContentPage({
  contentKey,
  fallbackImage = DEFAULT_IMAGE,
}: Props) {
  const { i18n } = useTranslation("common");
  const [content, setContent] = useState<PageContent | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/be/site-content/${contentKey}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setContent(json ?? {}))
      .catch(() => setContent({}));
    return () => controller.abort();
  }, [contentKey]);

  const copy = useMemo(() => {
    const current = content ?? {};
    return {
      eyebrow: pickLocalized(
        i18n.language,
        current.eyebrow_en,
        current.eyebrow_ar
      ),
      title: pickLocalized(i18n.language, current.title_en, current.title_ar),
      body: pickLocalized(i18n.language, current.body_en, current.body_ar),
      image: current.image_url?.trim() || fallbackImage,
      statPrimaryValue: pickLocalized(
        i18n.language,
        current.stat_primary_value_en,
        current.stat_primary_value_ar
      ),
      statPrimaryLabel: pickLocalized(
        i18n.language,
        current.stat_primary_label_en,
        current.stat_primary_label_ar
      ),
      stats: [
        {
          value: pickLocalized(i18n.language, current.stat_1_value_en, current.stat_1_value_ar),
          label: pickLocalized(i18n.language, current.stat_1_label_en, current.stat_1_label_ar),
        },
        {
          value: pickLocalized(i18n.language, current.stat_2_value_en, current.stat_2_value_ar),
          label: pickLocalized(i18n.language, current.stat_2_label_en, current.stat_2_label_ar),
        },
        {
          value: pickLocalized(i18n.language, current.stat_3_value_en, current.stat_3_value_ar),
          label: pickLocalized(i18n.language, current.stat_3_label_en, current.stat_3_label_ar),
        },
      ].filter((item) => Boolean(item.value || item.label)),
    };
  }, [content, fallbackImage, i18n.language]);

  return (
    <section className={styles.page}>
      <BaseContainer>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <div className={styles.media}>
              <Image
                src={copy.image}
                alt={copy.title || "La Dolce Casa"}
                fill
                sizes="(max-width: 899px) 100vw, 42vw"
                unoptimized={copy.image.startsWith("http")}
              />
            </div>
            <article className={styles.copy}>
              {copy.eyebrow ? <p className={styles.eyebrow}>{copy.eyebrow}</p> : null}
              <h1 className={styles.title}>{copy.title}</h1>
              <div className={styles.body}>{copy.body}</div>

              {(copy.statPrimaryValue || copy.stats.length > 0) && (
                <div className={styles.numbers}>
                  {copy.statPrimaryValue ? (
                    <div className={styles.primaryStat}>
                      <div className={styles.primaryValue}>{copy.statPrimaryValue}</div>
                      {copy.statPrimaryLabel ? (
                        <div className={styles.primaryLabel}>{copy.statPrimaryLabel}</div>
                      ) : null}
                    </div>
                  ) : null}

                  {copy.stats.length > 0 ? (
                    <div className={styles.statsGrid}>
                      {copy.stats.map((stat, idx) => (
                        <div className={styles.statCard} key={`${idx}-${stat.value}-${stat.label}`}>
                          {stat.value ? <div className={styles.statValue}>{stat.value}</div> : null}
                          {stat.label ? <div className={styles.statLabel}>{stat.label}</div> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          </div>
        </div>
      </BaseContainer>
    </section>
  );
}
