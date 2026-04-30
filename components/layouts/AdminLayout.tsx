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
        <Col lg="3" xl="2" className={styles.sideCol}>
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <p className={styles.sideEyebrow}>La Dolce Casa</p>
              <h2 className={styles.sideTitle}>{t("dashboard.dashboard")}</h2>
            </div>
            <div className={styles.sideBody}>
              <SideNavBar />
            </div>
          </div>
        </Col>
        <Col lg="9" xl="10" className={styles.contentCol}>
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
