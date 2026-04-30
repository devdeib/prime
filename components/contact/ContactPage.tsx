"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BaseContainer from "@/components/common/container/BaseContainer";
import styles from "./contact-page.module.css";

type VisualRow = {
  image_url?: string | null;
  images?: string[] | null;
};

const FALLBACK_VISUAL = "https://picsum.photos/seed/la-dolce-contact/1000/1200";

function findLeadImage(row: VisualRow) {
  return row.images?.find(Boolean) || row.image_url || null;
}

export default function ContactPage() {
  const { t } = useTranslation("common");
  const [visualUrl, setVisualUrl] = useState(FALLBACK_VISUAL);
  const copy = {
    title:
      t("contactPage.title") === "contactPage.title"
        ? "CONTACT"
        : t("contactPage.title"),
    headquarters:
      t("contactPage.headquarters") === "contactPage.headquarters"
        ? "HEADQUARTERS"
        : t("contactPage.headquarters"),
    headquartersValue:
      t("contactPage.headquartersValue") === "contactPage.headquartersValue"
        ? "Rome, Italy"
        : t("contactPage.headquartersValue"),
    phone:
      t("contactPage.phone") === "contactPage.phone"
        ? "PHONE NUMBER"
        : t("contactPage.phone"),
    phoneValue:
      t("contactPage.phoneValue") === "contactPage.phoneValue"
        ? "+39 998 656 6333 44"
        : t("contactPage.phoneValue"),
    email:
      t("contactPage.email") === "contactPage.email"
        ? "EMAIL"
        : t("contactPage.email"),
    emailValue:
      t("contactPage.emailValue") === "contactPage.emailValue"
        ? "info@ladolcecasa.net"
        : t("contactPage.emailValue"),
    hours:
      t("contactPage.hours") === "contactPage.hours"
        ? "OPENING HOURS"
        : t("contactPage.hours"),
    hoursValue:
      t("contactPage.hoursValue") === "contactPage.hoursValue"
        ? "Monday - Friday: 09:30 - 19:00\nSaturday: 10:00 - 17:00"
        : t("contactPage.hoursValue"),
    visualAlt:
      t("contactPage.visualAlt") === "contactPage.visualAlt"
        ? "La Dolce Casa contact visual"
        : t("contactPage.visualAlt"),
  };

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/api/be/projects", { signal: controller.signal }).then((res) =>
        res.json()
      ),
      fetch("/api/be/showrooms", { signal: controller.signal }).then((res) =>
        res.json()
      ),
    ])
      .then(([projects, showrooms]) => {
        const firstProject = Array.isArray(projects) ? projects[0] : null;
        const firstShowroom = Array.isArray(showrooms) ? showrooms[0] : null;
        const nextVisual =
          (firstProject && findLeadImage(firstProject)) ||
          (firstShowroom && findLeadImage(firstShowroom));

        if (nextVisual) setVisualUrl(nextVisual);
      })
      .catch(() => {
        setVisualUrl(FALLBACK_VISUAL);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className={styles.page}>
      <BaseContainer>
        <div className={styles.inner}>
          <div className={styles.grid}>
            <div>
              <h1 className={styles.title}>{copy.title}</h1>
              <div className={styles.list}>
                <article className={styles.item}>
                  <h2 className={styles.label}>{copy.headquarters}</h2>
                  <p className={styles.value}>{copy.headquartersValue}</p>
                </article>
                <article className={styles.item}>
                  <h2 className={styles.label}>{copy.phone}</h2>
                  <p className={styles.value}>{copy.phoneValue}</p>
                </article>
                <article className={styles.item}>
                  <h2 className={styles.label}>{copy.email}</h2>
                  <p className={styles.value}>{copy.emailValue}</p>
                </article>
                <article className={styles.item}>
                  <h2 className={styles.label}>{copy.hours}</h2>
                  <p className={styles.value}>{copy.hoursValue}</p>
                </article>
              </div>
            </div>

            <div className={styles.visual}>
              <Image
                src={visualUrl}
                alt={copy.visualAlt}
                fill
                sizes="(max-width: 959px) 100vw, 44vw"
                className={styles.image}
                unoptimized={visualUrl.startsWith("http")}
              />
            </div>
          </div>
        </div>
      </BaseContainer>
    </section>
  );
}
