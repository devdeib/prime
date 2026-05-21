"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./products-nav-dropdown.module.css";

type Category = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

type Props = {
  navLinkClassName?: string;
  onLight?: boolean;
};

export default function ProductsNavDropdown({
  navLinkClassName = "",
  onLight = false,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const productsLabel =
    t("nav.products") === "nav.products" ? "PRODUCTS" : t("nav.products");
  const allLabel = t("catalog.all") === "catalog.all" ? "All Products" : t("catalog.all");

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
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${onLight ? styles.rootOnLight : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`${styles.trigger} ${navLinkClassName} ${open ? styles.triggerOpen : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {productsLabel}
        <span className={styles.chevron} aria-hidden />
      </button>

      <div
        id={menuId}
        className={`${styles.menu} ${open ? styles.menuOpen : ""}`}
        role="menu"
        hidden={!open}
      >
        <Link
          href="/products/all-items"
          className={styles.item}
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          {allLabel}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products/${category.alias}`}
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {pickLocalized(i18n.language, category.name, category.name_ar)}
          </Link>
        ))}
      </div>

      <details className={styles.mobileAccordion}>
        <summary className={`${styles.mobileSummary} ${navLinkClassName}`}>
          {productsLabel}
        </summary>
        <div className={styles.mobilePanel}>
          <Link
            href="/products/all-items"
            className={styles.mobileItem}
            onClick={() => setOpen(false)}
          >
            {allLabel}
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products/${category.alias}`}
              className={styles.mobileItem}
            >
              {pickLocalized(i18n.language, category.name, category.name_ar)}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
