import localFont from "next/font/local";

export const fontDisplay = localFont({
  src: "../public/fonts/Italian-Didot-W90-Normal/Italian Didot W90 Normal.ttf",
  variable: "--font-display",
  display: "swap",
});

export const fontBodyArabic = localFont({
  src: "../public/fonts/Cairo/Cairo-VariableFont_slnt,wght.ttf",
  variable: "--font-body-ar",
  display: "swap",
  weight: "200 900",
});

export const fontBodyArabicAlt = localFont({
  src: "../public/fonts/Noto_Kufi_Arabic/NotoKufiArabic-VariableFont_wght.ttf",
  variable: "--font-body-ar-alt",
  display: "swap",
  weight: "100 900",
});
