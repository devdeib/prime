"use client";

import Link from "next/link";
import { Form, Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useTranslation } from "react-i18next";
import ProfileNavItem from "../ProfileNavItem";
import LanguageToggle from "../LanguageToggle";
import styles from "./admin-navbar.module.css";

const AdminNavbar = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <Navbar expand="lg" className={`px-3 ${styles.bar}`}>
        <Container fluid>
          <Navbar.Brand as={Link} href="/dashboard/home">
            <span className={`ft-18 ${styles.brand}`}>{t("dashboard.dashboard")}</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            >
              <Form className="d-flex">
                <Form.Control
                  type="search"
                  placeholder={t("dashboard.search")}
                  className={`me-2 rounded-0 ${styles.ghostInput}`}
                  aria-label={t("dashboard.search")}
                />
                <Button variant="outline-light" className="rounded-0">
                  <span>{t("dashboard.search")}</span>
                </Button>
              </Form>
              <Nav.Link as={Link} href="/" className="ms-2">
                <Button variant="outline-light" size="sm" className={styles.backBtn}>
                  {t("dashboard.backToStore")}
                </Button>
              </Nav.Link>
            </Nav>
            <Nav className="align-items-center gap-1 flex-wrap">
              <LanguageToggle />
              <ProfileNavItem />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default AdminNavbar;
