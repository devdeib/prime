"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import styles from "./projects-dropdown.module.css";

type Props = {
  linkClassName?: string;
  onOpenChange?: (open: boolean) => void;
};

type Project = {
  id: number;
  project_type?: string | null;
};

export default function ProjectsDropdown({
  linkClassName = "",
  onOpenChange,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/be/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        if (!Array.isArray(data)) return;
        const cats = Array.from(
          new Set(data.map((p) => p.project_type ?? "Residential").filter(Boolean))
        ).sort();
        setCategories(cats);
      })
      .catch(() => setCategories(["Residential", "Commercial"]));
  }, []);

  const router = useRouter();

  const setMenuOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setMenuOpen(false), 200);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        clearCloseTimer();
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const label =
    t("nav.projects") === "nav.projects" ? "PROJECTS" : t("nav.projects");

  const items = categories.map((cat) => ({
    href: `/projects?type=${encodeURIComponent(cat)}`,
    label: cat,
  }));

  return (
    <div ref={ref} className={styles.root}>
      <button
        type="button"
        className={`${styles.trigger} ${linkClassName}`}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onClick={() => { setMenuOpen(false); router.push("/projects"); }}
      >
        {label}
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          aria-hidden
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div
        className={`${styles.megaWrap} ${open ? styles.megaWrapOpen : ""}`}
        role="menu"
        aria-label={label}
      >
        <div
          className={styles.megaPanel}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <div className={styles.megaInner}>
            <div className={styles.columns}>
              <ul className={styles.column} role="none">
                {items.map((item) => (
                  <li key={item.href} role="none">
                    <Link
                      href={item.href}
                      className={styles.categoryLink}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <aside className={styles.aside}>
              <Link
                href="/projects"
                className={styles.asideLink}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                {i18n.language === "ar" ? "عرض جميع المشاريع" : "SEE ALL PROJECTS"}
              </Link>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile accordion */}
      <div className={styles.mobileAccordion}>
        <button
          type="button"
          data-nav-item
          className={styles.mobileToggle}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setMenuOpen(!open)}
        >
          {label}
          <svg
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            width="10"
            height="10"
            viewBox="0 0 10 6"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open ? (
          <div className={styles.mobilePanel}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileItem} ${styles.mobileCategoryItem}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
