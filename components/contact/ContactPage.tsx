"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BaseContainer from "@/components/common/container/BaseContainer";
import { pickLocalized } from "@/lib/bilingual";
import styles from "./contact-page.module.css";

type VisualRow = {
  image_url?: string | null;
  images?: string[] | null;
};

type ContactContent = {
  title_en?: string;
  title_ar?: string;
  headquarters_en?: string;
  headquarters_ar?: string;
  headquarters_value_en?: string;
  headquarters_value_ar?: string;
  phone_label_en?: string;
  phone_label_ar?: string;
  phone_value_en?: string;
  phone_value_ar?: string;
  email_label_en?: string;
  email_label_ar?: string;
  email_value_en?: string;
  email_value_ar?: string;
  hours_label_en?: string;
  hours_label_ar?: string;
  hours_value_en?: string;
  hours_value_ar?: string;
  map_embed_url?: string;
};

const FALLBACK_VISUAL = "https://picsum.photos/seed/la-dolce-contact/1000/1200";

function findLeadImage(row: VisualRow) {
  return row.images?.find(Boolean) || row.image_url || null;
}

export default function ContactPage() {
  const { t, i18n } = useTranslation("common");
  const [visualUrl, setVisualUrl] = useState(FALLBACK_VISUAL);
  const [content, setContent] = useState<ContactContent>({});
  const copy = {
    title:
      pickLocalized(i18n.language, content.title_en, content.title_ar) ||
      (t("contactPage.title") === "contactPage.title"
        ? "CONTACT"
        : t("contactPage.title")),
    headquarters:
      pickLocalized(
        i18n.language,
        content.headquarters_en,
        content.headquarters_ar
      ) ||
      (t("contactPage.headquarters") === "contactPage.headquarters"
        ? "HEADQUARTERS"
        : t("contactPage.headquarters")),
    headquartersValue:
      pickLocalized(
        i18n.language,
        content.headquarters_value_en,
        content.headquarters_value_ar
      ) ||
      (t("contactPage.headquartersValue") === "contactPage.headquartersValue"
        ? "Rome, Italy"
        : t("contactPage.headquartersValue")),
    phone:
      pickLocalized(i18n.language, content.phone_label_en, content.phone_label_ar) ||
      (t("contactPage.phone") === "contactPage.phone"
        ? "PHONE NUMBER"
        : t("contactPage.phone")),
    phoneValue:
      pickLocalized(i18n.language, content.phone_value_en, content.phone_value_ar) ||
      (t("contactPage.phoneValue") === "contactPage.phoneValue"
        ? "+39 998 656 6333 44"
        : t("contactPage.phoneValue")),
    email:
      pickLocalized(i18n.language, content.email_label_en, content.email_label_ar) ||
      (t("contactPage.email") === "contactPage.email"
        ? "EMAIL"
        : t("contactPage.email")),
    emailValue:
      pickLocalized(i18n.language, content.email_value_en, content.email_value_ar) ||
      (t("contactPage.emailValue") === "contactPage.emailValue"
        ? "info@ladolcecasa.net"
        : t("contactPage.emailValue")),
    hours:
      pickLocalized(i18n.language, content.hours_label_en, content.hours_label_ar) ||
      (t("contactPage.hours") === "contactPage.hours"
        ? "OPENING HOURS"
        : t("contactPage.hours")),
    hoursValue:
      pickLocalized(i18n.language, content.hours_value_en, content.hours_value_ar) ||
      (t("contactPage.hoursValue") === "contactPage.hoursValue"
        ? "Monday - Friday: 09:30 - 19:00\nSaturday: 10:00 - 17:00"
        : t("contactPage.hoursValue")),
    visualAlt:
      t("contactPage.visualAlt") === "contactPage.visualAlt"
        ? "La Dolce Casa contact visual"
        : t("contactPage.visualAlt"),
  };

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/api/be/site-content/contact", { signal: controller.signal }).then((res) =>
        res.json()
      ),
      fetch("/api/be/projects", { signal: controller.signal }).then((res) =>
        res.json()
      ),
      fetch("/api/be/showrooms", { signal: controller.signal }).then((res) =>
        res.json()
      ),
    ])
      .then(([contactContent, projects, showrooms]) => {
        setContent(contactContent ?? {});
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
              {content.map_embed_url?.trim() ? (
                <iframe
                  src={content.map_embed_url}
                  title={copy.title}
                  className={styles.map}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <Image
                  src={visualUrl}
                  alt={copy.visualAlt}
                  fill
                  sizes="(max-width: 959px) 100vw, 44vw"
                  className={styles.image}
                  unoptimized={visualUrl.startsWith("http")}
                />
              )}
            </div>
          </div>
        </div>
      </BaseContainer>
    </section>
  );
}
