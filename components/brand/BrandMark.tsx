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
};

export default function BrandMark({
  href = "/",
  className,
  stacked = true,
  showText = true,
  text = "La Dolce Casa",
  logoWidth = 54,
}: BrandMarkProps) {
  const content = (
    <span
      className={`${styles.brandMark} ${stacked ? styles.stacked : styles.inline} ${className ?? ""}`.trim()}
    >
      <Image
        src="/images/La dolce casa.svg"
        alt="La Dolce Casa logo"
        width={logoWidth}
        height={Math.round((logoWidth * 71) / 63)}
        priority={logoWidth >= 54}
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
