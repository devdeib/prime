"use client";

import { SessionProvider } from "next-auth/react";
import I18nProvider from "@/components/i18n/I18nProvider";
import FurnitureStoreProvider from "@/context/FurnitureStoreProvider";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider>
      <SessionProvider refetchInterval={5 * 60}>
        <FurnitureStoreProvider>{children}</FurnitureStoreProvider>
      </SessionProvider>
    </I18nProvider>
  );
}
