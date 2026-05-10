"use client";

import Link from "next/link";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import ProfileNavItem from "../ProfileNavItem";
import LanguageToggle from "../LanguageToggle";
import styles from "./admin-navbar.module.css";

const AdminNavbar = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <Navbar expand="lg" className={styles.bar}>
        <Container fluid="xxl" className={styles.navContainer}>
          <Navbar.Brand as="div" className={styles.brandCentered}>
            <BrandMark
              href="/dashboard/home"
              stacked
              text={t("nav.brand")}
              className={styles.brandMark}
              logoWidth={12}
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav className={`me-auto ${styles.leftLinks}`}>
              <Nav.Link as={Link} href="/" className={styles.navLink}>
                {t("dashboard.backToStore")}
              </Nav.Link>
            </Nav>
            <Nav className={`align-items-center flex-wrap ${styles.rightLinks}`}>
              <LanguageToggle />
              <ProfileNavItem onLight />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default AdminNavbar;
