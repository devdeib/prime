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
  openGraph: {
    title: "La dolce casa",
    description: "Furniture storefront — sofas, beds, dining, and more.",
    url: "https://ladolcecasa.net/",
    type: "website",
    images: [
      {
        url: "https://ladolcecasa.net/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "La dolce casa — Curated furniture for a modern home.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "La dolce casa",
    description: "Furniture storefront — sofas, beds, dining, and more.",
    images: ["https://ladolcecasa.net/images/og-image.png"],
  },
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
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
