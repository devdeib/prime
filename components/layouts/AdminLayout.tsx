"use client";

import { Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import AdminNavbar from "../navbar/admin/AdminNavbar";
import SideNavBar from "../navbar/sidebar/SideNavBar";
import styles from "./admin-layout.module.css";

interface ChildProps {
  children: React.ReactNode;
}
const AdminLayout: React.FC<ChildProps> = ({ children }) => {
  const { t } = useTranslation("common");
  return (
    <div className={styles.shell}>
      <AdminNavbar />
      <Row className={styles.mainRow}>
        <Col md="2" className={styles.sideCol}>
          <Row>
            <Col className="min-vh-100">
              <SideNavBar />
            </Col>
          </Row>
        </Col>
        <Col md="10" className={styles.contentCol}>
          {children}
        </Col>
      </Row>

      <footer className={styles.footer}>
        <p className="mb-0">{t("dashboard.dashboard")} · La Dolce Casa</p>
      </footer>
    </div>
  );
};

export default AdminLayout;
