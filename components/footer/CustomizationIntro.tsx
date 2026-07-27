"use client";

import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import styles from "./footer.module.css";

export default function CustomizationIntro() {
  const { i18n } = useTranslation("common");

  const heading =
    i18n.language === "ar"
      ? "نؤمن أن الأثاث يجب أن يشعر وكأنه ينتمي إليك حقًا."
      : "We believe furniture should feel like it truly belongs to you.";

  const body =
    i18n.language === "ar"
      ? "يمكن تنفيذ كل قطعة بما يناسب مساحتك، وذوقك، واختياراتك. من الأبعاد إلى الأقمشة إلى التشطيبات، القرار لك."
      : "Every piece can be made to fit your space, your style, and your choices. From dimensions to fabrics to finishes, you decide.";

  return (
    <section className={styles.customIntro}>
      <div className={styles.customIntroInner}>
        {/* <BrandMark
          showText={false}
          text="Prime"
          className={styles.customIntroBrand}
          logoWidth={88}
        /> */}
        <h2 className={styles.customIntroTitle}>{heading}</h2>
        <p className={styles.customIntroText}>{body}</p>
      </div>
    </section>
  );
}
