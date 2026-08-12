"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import styles from "./projects-dropdown.module.css";

type Props = {
  linkClassName?: string;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
  isMobile?: boolean;
};

type Project = {
  id: number;
  project_type?: string | null;
};

export default function ProjectsDropdown({
  linkClassName = "",
  onOpenChange,
  onNavigate,
  isMobile = false,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

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

  useEffect(() => () => clearCloseTimer(), []);

  // Desktop: close on outside click
  useEffect(() => {
    if (isMobile || !open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        clearCloseTimer();
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  // Desktop: close on Escape
  useEffect(() => {
    if (isMobile || !open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isMobile]);

  const label = t("nav.projects") === "nav.projects" ? "PROJECTS" : t("nav.projects");
  const items = categories.map((cat) => ({
    href: `/projects?type=${encodeURIComponent(cat)}`,
    label: cat,
  }));

  const navigate = () => {
    setMenuOpen(false);
    onNavigate?.();
  };

  // ── MOBILE: Projects toggle + collapsible category sub-links ──
  if (isMobile) {
    return (
      <div className={styles.mobileRoot}>
        <button
          type="button"
          className={`${linkClassName} ${styles.mobileMainLink}`}
          onClick={() => setOpen((v) => !v)}
        >
          {label}
          <svg
            className={`${styles.mobileChevron} ${open ? styles.mobileChevronOpen : ""}`}
            width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && categories.length > 0 && (
          <div className={styles.mobileSubLinks}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileSubLink}
                onClick={navigate}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP: hover mega-dropdown ──────────────────────────────
  return (
    <div ref={ref} className={styles.root}>
      <button
        type="button"
        className={`${styles.trigger} ${linkClassName}`}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={() => { clearCloseTimer(); setMenuOpen(true); }}
        onMouseLeave={() => { closeTimerRef.current = setTimeout(() => setMenuOpen(false), 200); }}
        onClick={() => { setMenuOpen(false); router.push("/projects"); }}
      >
        {label}
      </button>

      {open && (
        <div className={styles.backdrop} aria-hidden onClick={() => setMenuOpen(false)} />
      )}

      <div
        className={`${styles.megaWrap} ${open ? styles.megaWrapOpen : ""}`}
        role="menu"
        aria-label={label}
      >
        <div
          className={styles.megaPanel}
          onMouseEnter={() => { clearCloseTimer(); setMenuOpen(true); }}
          onMouseLeave={() => { closeTimerRef.current = setTimeout(() => setMenuOpen(false), 200); }}
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
                      onClick={navigate}
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
                onClick={navigate}
              >
                {i18n.language === "ar" ? "عرض جميع المشاريع" : "SEE ALL PROJECTS"}
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
