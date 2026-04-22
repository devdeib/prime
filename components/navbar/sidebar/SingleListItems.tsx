"use client";

import React from "react";
import { Nav } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { SingleItemProps } from "./SideNavBar";
import styles from "./sidebar.module.css";

type SingleListProps = {
  data: SingleItemProps[];
  sectionKey: string;
};

const SingleListItems: React.FC<SingleListProps> = ({ data, sectionKey }) => {
  const { t } = useTranslation("common");
  const sectionTitle = t(`dashboard.navSection.${sectionKey}`, {
    defaultValue: sectionKey,
  });

  return (
    <div>
      {data.length > 0 && (
        <>
          <div className={styles.sectionTitle}>{sectionTitle}</div>
          <Nav className={`flex-column ${styles.navList}`}>
            {data.map((item) => {
              return item.url !== "#" ? (
                <Nav.Link href={item.url} key={item.id} className={styles.navLink}>
                  <span className={styles.navIcon}>{item.icon()}</span>
                  <span className={styles.navLabel}>{t(item.labelKey)}</span>
                </Nav.Link>
              ) : (
                <a
                  onClick={async () => {
                    item.onClickFn !== undefined
                      ? await item?.onClickFn()
                      : alert("Function not defined !");
                  }}
                  key={item.id}
                  className={`nav-link ${styles.navLink}`}
                  style={{ cursor: "pointer" }}
                >
                  <span className={styles.navIcon}>{item.icon()}</span>
                  <span className={styles.navLabel}>{t(item.labelKey)}</span>
                </a>
              );
            })}
          </Nav>
        </>
      )}
    </div>
  );
};

export default SingleListItems;
