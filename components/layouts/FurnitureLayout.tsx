"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { isProjectHeroPath } from "@/lib/projects";
import CartOffCanvas from "../cart/CartOffCanvas";
import CustomizationIntro from "../footer/CustomizationIntro";
import Footer from "../footer/footer";
import FurnitureNavbar from "../navbar/furniture/FurnitureNavbar";
import styles from "./furniture-layout.module.css";

type Props = {
  children: React.ReactNode;
};

export default function FurnitureLayout({ children }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isProjectHero = isProjectHeroPath(pathname);
  const isHeroLayout = isHome || isProjectHero;

  const contentClass = useMemo(
    () => (!isHeroLayout ? styles.contentOffset : undefined),
    [isHeroLayout]
  );

  return (
    <main className={styles.main}>
      <FurnitureNavbar />
      <CartOffCanvas />
      <div className={contentClass}>{children}</div>
      {isHome ? <CustomizationIntro /> : null}
      <Footer />
    </main>
  );
}
