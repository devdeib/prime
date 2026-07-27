"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./brand-mark.module.css";

type BrandMarkProps = {
  href?: string | null;
  className?: string;
  stacked?: boolean;
  showText?: boolean;
  text?: string;
  logoWidth?: number;
  /** Prefer above-the-fold logos (avoids Next.js LCP warning for lazy-loaded LCP). */
  priority?: boolean;
};

export default function BrandMark({
  href = "/",
  className,
  stacked = true,
  showText = true,
  text = "Prime",
  logoWidth = 54,
  priority,
}: BrandMarkProps) {
  const eagerLogo = priority === true || logoWidth >= 54;
  const content = (
    <span
      className={`${styles.brandMark} ${stacked ? styles.stacked : styles.inline} ${className ?? ""}`.trim()}
    >
      <Image
        src="/images/prime-logo.svg"
        alt="Prime logo"
        width={logoWidth}
        height={Math.round((logoWidth * 71) / 63)}
        priority={eagerLogo}
        className={styles.logo}
      />
      {showText ? <span className={styles.text}>{text}</span> : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className={styles.link} aria-label={text}>
      {content}
    </Link>
  );
}
