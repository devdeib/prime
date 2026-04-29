"use client";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Badge, NavDropdown } from "react-bootstrap";
import { FaCartPlus, FaHeart } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFurnitureStore } from "@/context/FurnitureStoreContext";
import { pickLocalized } from "@/lib/bilingual";
import BrandMark from "@/components/brand/BrandMark";
import ProfileNavItem from "../ProfileNavItem";
import HamBurgerIcon from "../HamBurgerIcon";
import LanguageToggle from "../LanguageToggle";
import styles from "./furniture-navbar.module.css";

type NavCategory = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

export default function FurnitureNavbar() {
  const { t, i18n } = useTranslation("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const { cartItems, setCartShow } = useFurnitureStore();
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const useLightNavbar = !isHome || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/be/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => setCategories([]));
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

        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className={`me-auto ${styles.leftLinks}`}>
            {/* <Nav.Link href="/" className={`${styles.navLink} ${styles.ft14} fw-normal`}>
              {t("nav.home")}
            </Nav.Link> */}
            <NavDropdown
              title={t("nav.products")}
              id="products"
              className={`${styles.ft14} fw-normal nav-products ${styles.navDropdown}`}
            >
              {categories.map((category) => (
                <NavDropdown.Item
                  key={category.id}
                  href={`/products/${category.alias}`}
                  className={`text-dark fw-normal ${styles.dropdownItem}`}
                >
                  {pickLocalized(i18n.language, category.name, category.name_ar)}
                </NavDropdown.Item>
              ))}
            </NavDropdown>

            <Nav.Link
              href="/showrooms"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.showrooms")}
            </Nav.Link>
            <Nav.Link
              href="/projects"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.projects")}
            </Nav.Link>
            <Nav.Link
              href="/about-us"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.about")}
            </Nav.Link>
            {/* <Nav.Link
              href="/contact-us"
              className={`${styles.navLink} ${styles.ft14} fw-normal`}
            >
              {t("nav.contact")}
            </Nav.Link> */}
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
              <>
                <Nav.Link
                  href="/auth/signin"
                  className={`${styles.navLink} ${styles.ft14}`}
                >
                  {t("nav.signIn")}
                </Nav.Link>
                {/* <Nav.Link
                  href="/auth/signup"
                  className={`text-white ${styles.ft14} mr-2`}
                >
                  {t("nav.signUp")}
                </Nav.Link> */}
              </>
            )}

            {/* <Nav.Link href="#" className={`text-white ${styles.ft14}`}>
              <FaHeart size={18} />
              <span>
                <sup className="text-white">
                  <Badge bg="danger" className={styles.ft10}>
                    0
                  </Badge>
                </sup>
              </span>
            </Nav.Link>

            <Nav.Link
              className={`text-white ${styles.ft14}`}
              onClick={() => setCartShow(true)}
            >
              <FaCartPlus size={18} />
              <span>
                <sup className="text-white">
                  <Badge bg="danger" className={styles.ft10}>
                    {cartItems.length}
                  </Badge>
                </sup>
              </span>
            </Nav.Link> */}

            {session && <ProfileNavItem />}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
