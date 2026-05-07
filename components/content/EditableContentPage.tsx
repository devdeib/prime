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
              {copy.eyebrow ? (
                <p className={styles.eyebrow}>{copy.eyebrow}</p>
              ) : null}
              <h1 className={styles.title}>{copy.title}</h1>
              <div className={styles.body}>{copy.body}</div>
            </article>
          </div>
        </div>
      </BaseContainer>
    </section>
  );
}
