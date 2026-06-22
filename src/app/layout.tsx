import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://game-rtp-dashboard.vercel.app";
const SITE_NAME = "RTP 数据中枢";
const SITE_DESC =
  "深色赛博朋克风格的游戏 RTP（Return To Player）实时展示面板，实时监控老虎机、桌游与真人游戏的回报率。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Game RTP Dashboard`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "RTP",
    "游戏回报率",
    "Return To Player",
    "老虎机",
    "桌游",
    "真人游戏",
    "game dashboard",
    "casino rtp",
  ],
  authors: [{ name: SITE_NAME }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Game RTP Dashboard`,
    description: SITE_DESC,
    url: SITE_URL,
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Game RTP Dashboard`,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${orbitron.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
