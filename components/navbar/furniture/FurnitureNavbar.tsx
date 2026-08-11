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
import ProjectsDropdown from "./ProjectsDropdown";
import { isCollectionDetailHeroPath } from "@/lib/detail-hero";
import styles from "./furniture-navbar.module.css";

export default function FurnitureNavbar() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);

  const isHome = pathname === "/";
  const isDetailHero = isCollectionDetailHeroPath(pathname);
  const isShowroomHero = pathname != null && /^\/showrooms\/\d+$/.test(pathname);
  const isHeroPage = isHome || isDetailHero;
  const useLightNavbar = !isHeroPage || scrolled || projectsMenuOpen;
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

  const linkCls = (active: boolean) =>
    `${styles.navLink} ${styles.ft14} fw-normal ${active ? styles.navLinkActive : ""}`;

  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      variant="dark"
      fixed="top"
      className={`${styles.navShell} ${useLightNavbar ? styles.navScrolled : ""} ${
        projectsMenuOpen ? styles.navProductsOpen : ""
      }`}
    >
      <Container fluid="xxl" className={styles.navContainer}>

        {/* ── Logo — left-aligned ─────────────────────────────────── */}
        <Navbar.Brand as="div" className={styles.brandLeft}>
          <BrandMark
            href="/"
            stacked
            showText={false}
            text={t("nav.brand")}
            className={styles.brandMark}
            logoWidth={12}
            priority={isHeroPage}
          />
        </Navbar.Brand>

        {/* ── Mobile toggle ───────────────────────────────────────── */}
        <Navbar.Toggle
          aria-controls="responsive-navbar-nav"
          className={styles.navToggle}
        >
          <HamBurgerIcon />
        </Navbar.Toggle>

        {/* ── All links — right side ──────────────────────────────── */}
        <Navbar.Collapse id="responsive-navbar-nav" className={styles.mobileCollapse}>
          <Nav className={`ms-auto align-items-center ${styles.mainLinks}`}>

            {/* Page links */}
            <Nav.Link as={Link} href="/about-us" className={linkCls(pathname === "/about-us")}>
              {t("nav.about") === "nav.about" ? "ABOUT US" : t("nav.about")}
            </Nav.Link>

            <ProjectsDropdown
              linkClassName={linkCls(pathname != null && pathname.startsWith("/projects"))}
              onOpenChange={setProjectsMenuOpen}
            />

            <Nav.Link as={Link} href="/fit-out" className={linkCls(pathname === "/fit-out")}>
              FIT-OUT
            </Nav.Link>

            <Nav.Link
              as={Link}
              href="/showrooms"
              className={linkCls(pathname === "/showrooms" || isShowroomHero)}
            >
              {t("nav.showrooms")}
            </Nav.Link>

            <Nav.Link
              as={Link}
              href="/services"
              className={linkCls(pathname === "/services")}
            >
              {t("nav.services") === "nav.services" ? "SERVICES" : t("nav.services")}
            </Nav.Link>

            {/* Divider */}
            <span className={styles.navDivider} aria-hidden />

            {/* Utilities */}
            <span className={`${styles.languageWrap} ${profileOnLight ? styles.langOnLight : ""}`}>
              <LanguageToggle />
            </span>

            <Nav.Link
              as={Link}
              href="/vip-meeting"
              className={linkCls(pathname === "/vip-meeting")}
            >
              {t("nav.vipMeeting")}
            </Nav.Link>

            {!session && (
              <Nav.Link as={Link} href="/auth/signin" className={`${styles.navLink} ${styles.ft14}`}>
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
