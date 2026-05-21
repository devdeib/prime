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
};

export default function ProductsDropdown({ linkClassName = "" }: Props) {
  const { t, i18n } = useTranslation("common");
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const label =
    t("nav.products") === "nav.products" ? "PRODUCTS" : t("nav.products");

  return (
    <div
      ref={ref}
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <button
        type="button"
        className={`${styles.trigger} ${linkClassName}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
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

      {/* Dropdown panel */}
      <div
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
        role="menu"
        aria-label={label}
      >
        <div className={styles.panelInner}>
          <Link
            href="/products/all-items"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("catalog.all") === "catalog.all" ? "All Products" : t("catalog.all")}
          </Link>

          {categories.length > 0 ? (
            <div className={styles.separator} aria-hidden />
          ) : null}

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.alias}`}
              className={styles.item}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {pickLocalized(i18n.language, cat.name, cat.name_ar)}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile accordion fallback — visible below lg breakpoint */}
      <div className={styles.mobileAccordion}>
        <button
          type="button"
          className={`${styles.mobileToggle} ${linkClassName}`}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
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
              onClick={() => setOpen(false)}
            >
              {t("catalog.all") === "catalog.all" ? "All Products" : t("catalog.all")}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products/${cat.alias}`}
                className={styles.mobileItem}
                onClick={() => setOpen(false)}
              >
                {pickLocalized(i18n.language, cat.name, cat.name_ar)}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
