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
  title: "Prime",
  description: "Furniture storefront — sofas, beds, dining, and more.",
  openGraph: {
    title: "Prime",
    description: "Furniture storefront — sofas, beds, dining, and more.",
    url: "https://primewebsite.net/",
    type: "website",
    images: [
      {
        url: "https://primewebsite.net/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prime — Curated furniture for a modern home.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime",
    description: "Furniture storefront — sofas, beds, dining, and more.",
    images: ["https://primewebsite.net/images/og-image.jpg"],
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
