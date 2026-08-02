import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { InstallBanner } from "@/features/pwa/ui/install-banner";
import { PwaRegister } from "@/features/pwa/ui/pwa-register";
import { basePath } from "@/shared/config/hosting";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShelfLog",
    template: "%s · ShelfLog",
  },
  description:
    "Цифровой паспорт дома: вещи, места хранения, документы, гарантии и напоминания.",
  applicationName: "ShelfLog",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShelfLog",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: `${basePath}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${basePath}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `${basePath}/icons/icon-180.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        {children}
        <PwaRegister />
        <InstallBanner />
      </body>
    </html>
  );
}
