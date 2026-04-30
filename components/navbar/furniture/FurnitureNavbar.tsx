"use client";

import Link from "next/link";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import ProfileNavItem from "../ProfileNavItem";
import HamBurgerIcon from "../HamBurgerIcon";
import LanguageToggle from "../LanguageToggle";
import styles from "./furniture-navbar.module.css";

export default function FurnitureNavbar() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const useLightNavbar = !isHome || scrolled;
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      variant="dark"
      fixed="top"
      className={`${styles.navShell} ${useLightNavbar ? styles.navScrolled : ""}`}
    >
      <Container fluid="xxl" className={styles.navContainer}>
        <Navbar.Brand
          as="div"
          role="general-navbar-brand-role"
          className={styles.brandCentered}
        >
          <BrandMark
            href="/"
            stacked
            text={t("nav.brand")}
            className={styles.brandMark}
            logoWidth={12}
          />
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="offcanvasNavbar"
          role="navbar-toggle-role"
          className={styles.navToggle}
        >
          <HamBurgerIcon />
        </Navbar.Toggle>

        <Navbar.Collapse
          id="responsive-navbar-nav"
          className={styles.mobileCollapse}
        >
          <Nav className={`me-auto ${styles.leftLinks}`}>
            <Nav.Link
              as={Link}
              href="/projects"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.projects")}
            </Nav.Link>

            <Nav.Link
              as={Link}
              href="/products/all-items"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.products")}
            </Nav.Link>

            <Nav.Link
              as={Link}
              href="/showrooms"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.showrooms")}
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/about-us"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.about")}
            </Nav.Link>
          </Nav>

          <Nav className={`align-items-center flex-wrap ${styles.rightLinks}`}>
            <span
              className={`${styles.languageWrap} ${
                useLightNavbar ? styles.langOnLight : ""
              }`}
              >
              <LanguageToggle />
            </span>
              {!session && (
                <Nav.Link
                  as={Link}
                  href="/auth/signin"
                  className={`${styles.navLink} ${styles.ft14}`}
                >
                  {t("nav.signIn")}
                </Nav.Link>
              )}
            {session && <ProfileNavItem />}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
