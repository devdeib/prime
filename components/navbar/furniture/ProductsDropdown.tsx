"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./products-dropdown.module.css";

type Category = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

type Props = {
  /** Inherit link colour class from parent navbar */
  linkClassName?: string;
  /** Notify parent when mega menu opens (navbar turns white on hero) */
  onOpenChange?: (open: boolean) => void;
};

const MEGA_COLUMNS = 3;

function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const cols: T[][] = Array.from({ length: columnCount }, () => []);
  if (items.length === 0) return cols;

  const base = Math.floor(items.length / columnCount);
  const remainder = items.length % columnCount;
  let index = 0;

  for (let c = 0; c < columnCount; c++) {
    const size = base + (c < remainder ? 1 : 0);
    cols[c] = items.slice(index, index + size);
    index += size;
  }

  return cols;
}

export default function ProductsDropdown({
  linkClassName = "",
  onOpenChange,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const controller = new AbortController();
    fetch("/api/be/categories", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, []);

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
    t("nav.products") === "nav.products" ? "PRODUCTS" : t("nav.products");
  const seeAllLabel =
    t("nav.seeAllProducts") === "nav.seeAllProducts"
      ? "SEE ALL PRODUCTS"
      : t("nav.seeAllProducts");
  const collectionsLabel =
    t("nav.viewCollections") === "nav.viewCollections"
      ? "VIEW COLLECTIONS"
      : t("nav.viewCollections");
  const columns = splitIntoColumns(categories, MEGA_COLUMNS);

  return (
    <div ref={ref} className={styles.root}>
      <button
        type="button"
        className={`${styles.trigger} ${linkClassName}`}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onClick={() => setMenuOpen(!open)}
      >
        {label}
      </button>

      <div
        className={`${styles.megaWrap} ${open ? styles.megaWrapOpen : ""}`}
        role="menu"
        aria-label={label}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        {open ? (
          <div
            className={styles.backdrop}
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
        <div className={styles.megaPanel}>
          <div className={styles.megaInner}>
            <div className={styles.columns}>
              {columns.map((column, columnIndex) => (
                <ul
                  key={`col-${columnIndex}`}
                  className={styles.column}
                  role="none"
                >
                  {column.map((cat) => (
                    <li key={cat.id} role="none">
                      <Link
                        href={`/products/${cat.alias}`}
                        className={styles.categoryLink}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        {pickLocalized(i18n.language, cat.name, cat.name_ar)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>

            <aside className={styles.aside} aria-label={seeAllLabel}>
              <Link
                href="/products/all-items"
                className={styles.asideLink}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                {seeAllLabel}
              </Link>
              <Link
                href="/showrooms"
                className={`${styles.asideLink} ${styles.asideLinkBottom}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                {collectionsLabel}
              </Link>
            </aside>
          </div>
        </div>
      </div>

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
            <Link
              href="/products/all-items"
              className={styles.mobileItem}
              onClick={() => setMenuOpen(false)}
            >
              {seeAllLabel}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products/${cat.alias}`}
                className={styles.mobileItem}
                onClick={() => setMenuOpen(false)}
              >
                {pickLocalized(i18n.language, cat.name, cat.name_ar)}
              </Link>
            ))}
            <Link
              href="/showrooms"
              className={styles.mobileItem}
              onClick={() => setMenuOpen(false)}
            >
              {collectionsLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
