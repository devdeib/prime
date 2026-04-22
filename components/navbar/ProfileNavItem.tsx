import { signOut, useSession } from "next-auth/react";
import React from "react";
import { Nav, Dropdown, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ApiUser } from "@/data/types/auth";
import { MdDashboard, MdLogout } from "react-icons/md";
import { FaUserCog } from "react-icons/fa";
import styles from "./profile-nav-item.module.css";

const ProfileNavItem = () => {
  const { t } = useTranslation("common");
  const { data: session } = useSession();

  if (!session) {
    return (
      <>
        <Spinner
          as="span"
          animation="grow"
          size="sm"
          role="status"
          aria-hidden="true"
        />
        <span style={{ marginLeft: "5px" }}>{t("profile.loading")}</span>
      </>
    );
  } else {
    const user = (session as any).user as ApiUser;
    return (
      <Nav className={styles.navRoot}>
        <Dropdown align={"end"}>
          <Dropdown.Toggle
            variant="link"
            id="dropdown-basic"
            className={styles.trigger}
          >
            <span className="ft-15 fw-normal">{user.first_name}</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className={styles.menu}>
            <Dropdown.Item href="/dashboard/users/profile" className={styles.menuItem}>
              <FaUserCog size={18} className={styles.icon} />
              <span className={`${styles.label} ft-14 fw-normal`}>{t("profile.profile")}</span>
            </Dropdown.Item>
            <Dropdown.Item href="/dashboard/home" className={styles.menuItem}>
              <MdDashboard size={18} className={styles.icon} />
              <span className={`${styles.label} ft-14 fw-normal`}>{t("profile.dashboard")}</span>
            </Dropdown.Item>
            <Dropdown.Item onClick={() => signOut()} className={styles.menuItem}>
              <MdLogout size={18} className={styles.icon} />
              <span className={`${styles.label} ft-14 fw-normal`}>{t("profile.logout")}</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
    );
  }
};

export default ProfileNavItem;
