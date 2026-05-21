"use client";

import type { ProjectType } from "@/lib/project-type";
import styles from "./project-filter-tabs.module.css";

type Props = {
  active: ProjectType;
  onChange: (type: ProjectType) => void;
  residentialLabel: string;
  commercialLabel: string;
};

export default function ProjectFilterTabs({
  active,
  onChange,
  residentialLabel,
  commercialLabel,
}: Props) {
  return (
    <div className={styles.bar} role="tablist" aria-label="Project type">
      <button
        type="button"
        role="tab"
        aria-selected={active === "residential"}
        className={`${styles.tab} ${active === "residential" ? styles.tabActive : ""}`}
        onClick={() => onChange("residential")}
      >
        {residentialLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "commercial"}
        className={`${styles.tab} ${active === "commercial" ? styles.tabActive : ""}`}
        onClick={() => onChange("commercial")}
      >
        {commercialLabel}
      </button>
    </div>
  );
}
