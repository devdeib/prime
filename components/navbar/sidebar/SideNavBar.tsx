"use client";

import {
  FiGrid,
  FiUsers,
  FiTag,
  FiBox,
  FiImage,
  FiMapPin,
  FiBriefcase,
  FiEdit3,
  FiUser,
  FiLogOut,
  FiCalendar,
} from "react-icons/fi";
import SingleListItems from "./SingleListItems";
import { signOut, useSession } from "next-auth/react";
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
        icon: (size: number = 18) => <FiGrid size={size} />,
      },
    ],
    list: [],
    user: [
      {
        id: 9,
        labelKey: "dashboard.profile",
        url: "/dashboard/users/profile",
        icon: (size: number = 18) => <FiUser size={size} />,
      },
      {
        id: 10,
        labelKey: "dashboard.logout",
        url: "#",
        icon: (size: number = 18) => <FiLogOut size={size} />,
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
        icon: (size: number = 18) => <FiUsers size={size} />,
      },
      {
        id: 3,
        labelKey: "dashboard.categories",
        url: "/dashboard/categories",
        icon: (size: number = 18) => <FiTag size={size} />,
      },
      {
        id: 4,
        labelKey: "dashboard.products",
        url: "/dashboard/products",
        icon: (size: number = 18) => <FiBox size={size} />,
      },
      {
        id: 5,
        labelKey: "dashboard.heroSlides",
        url: "/dashboard/hero-slides",
        icon: (size: number = 18) => <FiImage size={size} />,
      },
      {
        id: 6,
        labelKey: "dashboard.showroomsMenu",
        url: "/dashboard/showrooms",
        icon: (size: number = 18) => <FiMapPin size={size} />,
      },
      {
        id: 7,
        labelKey: "dashboard.projectsMenu",
        url: "/dashboard/projects",
        icon: (size: number = 18) => <FiBriefcase size={size} />,
      },
      {
        id: 8,
        labelKey: "dashboard.contentMenu",
        url: "/dashboard/content",
        icon: (size: number = 18) => <FiEdit3 size={size} />,
      },
      {
        id: 11,
        labelKey: "dashboard.vipMeetings",
        url: "/dashboard/vip-meetings",
        icon: (size: number = 18) => <FiCalendar size={size} />,
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
