"use client";

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import styles from "./footer.module.css";

const Footer = () => {
  const { t } = useTranslation("common");
  const year = new Date().getFullYear();

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
        <Row className="g-4">
          <Col md={3}>
            <h3 className={styles.title}>{t("footer.mainMenu")}</h3>
            <Link href="/products/all-items" className={styles.link}>
              {t("nav.products")}
            </Link>
            <Link href="/about-us" className={styles.link}>
              {t("nav.about")}
            </Link>
            <Link href="/showrooms" className={styles.link}>
              {t("nav.showrooms")}
            </Link>
          </Col>
          <Col md={3}>
            <h3 className={styles.title}>{t("footer.support")}</h3>
            <a href="#" className={styles.link}>
              {t("footer.help")}
            </a>
            <a href="#" className={styles.link}>
              {t("footer.faq")}
            </a>
          </Col>
          <Col md={3}>
            <h3 className={styles.title}>{t("footer.links")}</h3>
            {/* <Link href="/contact-us" className={styles.link}>
              {t("nav.contact")}
            </Link> */}
            <Link href="/products/others" className={styles.link}>
              {t("footer.othersLink")}
            </Link>
          </Col>
          <Col md={3}>
            <h3 className={styles.title}>{t("footer.socials")}</h3>
            <div className={styles.socials}>
              <a href="#" className={styles.socialIcon}>
                <FaFacebookF />
              </a>
              <a href="#" className={styles.socialIcon}>
                <FaInstagram />
              </a>
              <a href="#" className={styles.socialIcon}>
                <FaTwitter />
              </a>
              <a href="#" className={styles.socialIcon}>
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
