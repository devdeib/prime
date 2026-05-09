"use client";

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaFacebookF,
  FaInstagram,
  FaSnapchat,
  FaLinkedinIn,
} from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import styles from "./footer.module.css";

const Footer = () => {
  const { t } = useTranslation("common");
  const year = new Date().getFullYear();
  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    snapchat: "",
    linkedin: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/be/site-content/footer_socials", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) =>
        setSocials({
          facebook: json?.facebook ?? "",
          instagram: json?.instagram ?? "",
          snapchat: json?.snapchat ?? "",
          linkedin: json?.linkedin ?? "",
        })
      )
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <footer className={styles.shell}>
      <Container className={styles.inner}>
        <div className={styles.brandWrap}>
          <BrandMark
            text={t("nav.brand")}
            className={styles.brandMark}
            logoWidth={48}
          />
        </div>
        <Row className={`g-4 ${styles.linkGrid}`}>
          <Col md={6} lg={3} className={styles.linkCol}>
            <h3 className={styles.title}>{t("footer.mainMenu")}</h3>
            <Link href="/projects" className={styles.link}>
              {t("nav.projects")}
            </Link>
            <Link href="/products/all-items" className={styles.link}>
              {t("nav.products")}
            </Link>
            <Link href="/showrooms" className={styles.link}>
              {t("nav.showrooms")}
            </Link>
            <Link href="/about-us" className={styles.link}>
              {t("nav.about")}
            </Link>
            <Link href="/services" className={styles.link}>
              {t("nav.services") === "nav.services" ? "SERVICES" : t("nav.services")}
            </Link>
          </Col>
          <Col md={6} lg={3} className={styles.linkCol}>
            <h3 className={styles.title}>{t("footer.links")}</h3>
            <Link href="/contact" className={styles.link}>
              {t("nav.contact")}
            </Link>
            
          </Col>
          <Col md={6} lg={3} className={styles.linkCol}>
            <h3 className={styles.title}>{t("footer.socials")}</h3>
            <div className={styles.socials}>
              <a href={socials.facebook || "#"} className={styles.socialIcon}>
                <FaFacebookF />
              </a>
              <a href={socials.instagram || "#"} className={styles.socialIcon}>
                <FaInstagram />
              </a>
              <a href={socials.snapchat || "#"} className={styles.socialIcon}>
                <FaSnapchat />
              </a>
              <a href={socials.linkedin || "#"} className={styles.socialIcon}>
                <FaLinkedinIn />
              </a>
            </div>
          </Col>
        </Row>
        <p className={styles.bottom}>
          {t("footer.copyrightPrefix")} {year} {t("footer.copyright")}
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
