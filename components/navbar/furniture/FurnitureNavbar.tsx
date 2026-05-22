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
import ProductsDropdown from "./ProductsDropdown";
import { isProjectHeroPath } from "@/lib/projects";
import styles from "./furniture-navbar.module.css";

export default function FurnitureNavbar() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const isHome = pathname === "/";
  const isProjectHero = isProjectHeroPath(pathname);
  const isHeroPage = isHome || isProjectHero;
  const useLightNavbar = !isHeroPage || scrolled;
  /** Mobile menu uses a light panel; profile trigger uses dark text on light. */
  const profileOnLight = useLightNavbar || isNarrow;
  const profileHeroFlat = isHeroPage && !scrolled;
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 991px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
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
            priority={isHeroPage}
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
              className={`${styles.navLink} ${styles.ft14} fw-normal ${
                pathname === "/projects" || isProjectHero ? styles.navLinkActive : ""
              }`}
            >
              {t("nav.projects")}
            </Nav.Link>

            <ProductsDropdown
              linkClassName={`${styles.navLink} ${styles.ft14} fw-normal`}
            />

            <Nav.Link
              as={Link}
              href="/showrooms"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.showrooms")}
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/services"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.services") === "nav.services" ? "SERVICES" : t("nav.services")}
            </Nav.Link>
          </Nav>

          <Nav className={`align-items-center flex-wrap ${styles.rightLinks}`}>
            <span
              className={`${styles.languageWrap} ${
                profileOnLight ? styles.langOnLight : ""
              }`}
              >
              <LanguageToggle />
            </span>
            <Nav.Link
              as={Link}
              href="/vip-meeting"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.vipMeeting")}
            </Nav.Link>
              {!session && (
                <Nav.Link
                  as={Link}
                  href="/auth/signin"
                  className={`${styles.navLink} ${styles.ft14}`}
                >
                  {t("nav.signIn")}
                </Nav.Link>
              )}
            {session && (
              <ProfileNavItem onLight={profileOnLight} heroFlat={profileHeroFlat} />
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
