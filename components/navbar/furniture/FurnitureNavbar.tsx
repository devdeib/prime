"use client";

import Link from "next/link";
import Nav from "react-bootstrap/Nav";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import ProfileNavItem from "../ProfileNavItem";
import LanguageToggle from "../LanguageToggle";
import ProjectsDropdown from "./ProjectsDropdown";
import { isCollectionDetailHeroPath } from "@/lib/detail-hero";
import styles from "./furniture-navbar.module.css";

export default function FurnitureNavbar() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session } = useSession();

  const [scrolled, setScrolled]         = useState(false);
  const [isNarrow, setIsNarrow]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isHome        = pathname === "/";
  const isDetailHero  = isCollectionDetailHeroPath(pathname);
  const isShowroomHero= pathname != null && /^\/showrooms\/\d+$/.test(pathname);
  const isHeroPage    = isHome || isDetailHero;

  const useLightNavbar = !isHeroPage || scrolled || projectsOpen;
  const profileOnLight = useLightNavbar || isNarrow;
  const profileHeroFlat= isHeroPage && !scrolled;

  /* scroll listener */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* breakpoint listener */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 991px)");
    const fn = () => { setIsNarrow(mq.matches); if (!mq.matches) setMenuOpen(false); };
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  /* close menu on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  /* close menu on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [menuOpen]);

  /* prevent body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const linkCls = (active: boolean) =>
    `${styles.navLink} ${styles.ft14} fw-normal${active ? " " + styles.navLinkActive : ""}`;

  const navItems = (mobile = false) => (
    <>
      <Nav.Link
        as={Link} href="/about-us"
        className={linkCls(pathname === "/about-us")}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.about") === "nav.about" ? "ABOUT US" : t("nav.about")}
      </Nav.Link>

      <ProjectsDropdown
        linkClassName={linkCls(!!pathname?.startsWith("/projects"))}
        onOpenChange={setProjectsOpen}
        onNavigate={() => setMenuOpen(false)}
        isMobile={mobile}
      />

      <Nav.Link
        as={Link} href="/fit-out"
        className={linkCls(pathname === "/fit-out")}
        onClick={() => setMenuOpen(false)}
      >
        FIT-OUT
      </Nav.Link>

      <Nav.Link
        as={Link} href="/showrooms"
        className={linkCls(pathname === "/showrooms" || isShowroomHero)}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.showrooms")}
      </Nav.Link>

      <Nav.Link
        as={Link} href="/services"
        className={linkCls(pathname === "/services")}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.services") === "nav.services" ? "SERVICES" : t("nav.services")}
      </Nav.Link>

      <span className={styles.navDivider} aria-hidden />

      <span className={`${styles.languageWrap} ${profileOnLight ? styles.langOnLight : ""}`}>
        <LanguageToggle />
      </span>

      <Nav.Link
        as={Link} href="/vip-meeting"
        className={linkCls(pathname === "/vip-meeting")}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.vipMeeting")}
      </Nav.Link>

      {!session && (
        <Nav.Link
          as={Link} href="/auth/signin"
          className={`${styles.navLink} ${styles.ft14}`}
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.signIn")}
        </Nav.Link>
      )}

      {session && (
        <ProfileNavItem onLight={profileOnLight} heroFlat={profileHeroFlat} />
      )}
    </>
  );

  return (
    <>
      <header
        ref={menuRef}
        className={`${styles.navShell} ${useLightNavbar ? styles.navScrolled : ""}`}
        role="banner"
      >
        <div className={styles.navContainer}>

          {/* Logo */}
          <div className={styles.brandLeft}>
            <BrandMark
              href="/"
              stacked
              showText={false}
              text={t("nav.brand")}
              className={styles.brandMark}
              logoWidth={12}
              priority={isHeroPage}
            />
          </div>

          {/* Desktop links */}
          <nav className={styles.desktopLinks} aria-label="Main navigation">
            {navItems(false)}
          </nav>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className={styles.hamburger}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={`${styles.hamburgerBar} ${menuOpen ? styles.barTop : ""}`} />
            <span className={`${styles.hamburgerBar} ${menuOpen ? styles.barMid : ""}`} />
            <span className={`${styles.hamburgerBar} ${menuOpen ? styles.barBot : ""}`} />
          </button>

        </div>
      </header>

      {/* Mobile drawer */}
      {isNarrow && (
        <>
          {/* Backdrop */}
          <div
            className={`${styles.mobileBackdrop} ${menuOpen ? styles.mobileBackdropOpen : ""}`}
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <nav
            className={`${styles.mobileDrawer} ${menuOpen ? styles.mobileDrawerOpen : ""}`}
            aria-label="Mobile navigation"
            aria-hidden={!menuOpen}
          >
            <div className={styles.mobileInner}>
              {navItems(true)}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
