"use client";

import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
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
      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <BrandMark
              href="/dashboard/home"
              stacked={false}
              showText={false}
              text="Prime"
              logoWidth={100}
              priority
              className={styles.sidebarBrandMark}
            />
          </div>
          <div className={styles.sideBody}>
            <SideNavBar />
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.contentInner}>
            {children}
          </div>
        </main>
      </div>

      <footer className={styles.footer}>
        <p className="mb-0">{t("dashboard.dashboard")}</p>
      </footer>
    </div>
  );
};

export default AdminLayout;
