import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/globals.css";
import "./globals.css";
import Providers from "./providers";
import {
  fontBodyArabic,
  fontBodyArabicAlt,
  fontDisplay,
} from "@/lib/fonts";

export const metadata: Metadata = {
  title: "La dolce casa",
  description: "Furniture storefront — sofas, beds, dining, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontBodyArabic.variable} ${fontBodyArabicAlt.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
