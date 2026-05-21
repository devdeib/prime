"use client";

import Image from "next/image";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./project-portfolio-card.module.css";

export type ProjectCardData = {
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

function leadImage(project: ProjectCardData, placeholder: string) {
  const fromList = project.images?.find(Boolean);
  if (fromList) return fromList;
  if (project.image_url?.trim()) return project.image_url.trim();
  return placeholder;
}

type Props = {
  project: ProjectCardData;
  language: string;
  placeholder?: string;
  onActivate: () => void;
  animationDelay?: string;
};

export default function ProjectPortfolioCard({
  project,
  language,
  placeholder = "/images/La dolce casa.svg",
  onActivate,
  animationDelay,
}: Props) {
  const src = leadImage(project, placeholder);
  const title = pickLocalized(language, project.name, project.name_ar);
  const subtitle =
    pickLocalized(language, project.description, project.description_ar) ||
    pickLocalized(language, project.city, project.city_ar);

  return (
    <article
      className={styles.card}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <button
        type="button"
        className={styles.hit}
        onClick={onActivate}
        aria-label={title}
      >
        <div className={styles.media}>
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 42vw"
            className={styles.image}
            unoptimized={src.startsWith("http") || src.startsWith("/uploads/")}
          />
          <span className={styles.overlay} aria-hidden />
        </div>
        <div className={styles.copy}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
      </button>
    </article>
  );
}
