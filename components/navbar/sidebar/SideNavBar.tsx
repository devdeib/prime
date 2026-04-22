"use client";

import {
  MdDashboard,
  MdOutlinePhotoLibrary,
  MdStoreMallDirectory,
  MdCall,
  MdLogin,
  MdManageAccounts,
  MdOutlineSettingsSystemDaydream,
  MdOutlineAnalytics,
  MdSettingsApplications,
  MdAutoGraph,
  MdNotificationsActive,
} from "react-icons/md";
import { FaRegUser, FaBuilding, FaHandshake } from "react-icons/fa";
import SingleListItems from "./SingleListItems";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export type SingleItemProps = {
  id: number;
  /** i18n key under `common` namespace, e.g. `dashboard.dashboard` */
  labelKey: string;
  url: string;
  icon: CallableFunction;
  onClickFn?: CallableFunction;
};

interface SideNavItems {
  [key: string]: SingleItemProps[];
}

export const sideNavItems = (role: string): SideNavItems => {
  const navItems: SideNavItems = {
    main: [
      {
        id: 1,
        labelKey: "dashboard.dashboard",
        url: "/dashboard/home",
        icon: (size: number = 21) => <MdDashboard size={size} />,
      },
    ],
    list: [],
    user: [
      {
        id: 9,
        labelKey: "dashboard.profile",
        url: "/dashboard/users/profile",
        icon: (size: number = 21) => <MdManageAccounts size={size} />,
      },
      {
        id: 10,
        labelKey: "dashboard.logout",
        url: "#",
        icon: (size: number = 21) => <MdLogin size={size} />,
        onClickFn: async () => await signOut(),
      },
    ],
  };

  if (role === "admin") {
    const adminRoutes: SingleItemProps[] = [
      {
        id: 2,
        labelKey: "dashboard.users",
        url: "/dashboard/users",
        icon: (size: number = 21) => <FaRegUser size={size} />,
      },
      {
        id: 3,
        labelKey: "dashboard.categories",
        url: "/dashboard/categories",
        icon: (size: number = 21) => <FaHandshake size={size} />,
      },
      {
        id: 4,
        labelKey: "dashboard.products",
        url: "/dashboard/products",
        icon: (size: number = 21) => <FaBuilding size={size} />,
      },
      {
        id: 5,
        labelKey: "dashboard.heroSlides",
        url: "/dashboard/hero-slides",
        icon: (size: number = 21) => <MdOutlinePhotoLibrary size={size} />,
      },
      {
        id: 6,
        labelKey: "dashboard.showroomsMenu",
        url: "/dashboard/showrooms",
        icon: (size: number = 21) => <MdStoreMallDirectory size={size} />,
      },
    ];
    navItems.list = adminRoutes;
  }

  return navItems;
};

const SideNavBar = () => {
  const { t } = useTranslation("common");
  const { data: session } = useSession();
  if (!session) {
    return (
      <Button variant="outline-dark" className="mt-3 ml-3 mb-3">
        <Spinner
          as="span"
          animation="grow"
          size="sm"
          role="status"
          aria-hidden="true"
        />
        <span style={{ marginLeft: "5px" }}>{t("profile.loading")}</span>
      </Button>
    );
  } else {
    const role = (session as any).role;
    const sideNavData = sideNavItems(role);
    return (
      <div>
        {Object.keys(sideNavData).map((key, index) => {
          const eachItem = sideNavData[key];
          return (
            <SingleListItems key={index} data={eachItem} sectionKey={key} />
          );
        })}
      </div>
    );
  }
};

export default SideNavBar;
