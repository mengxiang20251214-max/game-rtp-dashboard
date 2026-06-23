import type { Metadata } from "next";
import { Inter, Orbitron, Playfair_Display, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getSiteSettings } from "@/lib/site";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://game-rtp-dashboard.vercel.app";
const SITE_NAME = "RTP 数据中枢";
const SITE_DESC =
  "深色赛博朋克风格的游戏 RTP（Return To Player）实时展示面板，实时监控老虎机、桌游与真人游戏的回报率。";

// 标题与 favicon 从站点设置动态读取（后台可改，前台立即生效）
export async function generateMetadata(): Promise<Metadata> {
  const { siteTitle, logo } = await getSiteSettings();
  const title = siteTitle || `${SITE_NAME} · Game RTP Dashboard`;
  const icon = logo || "/icon.svg";

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${SITE_NAME}` },
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
    icons: { icon, shortcut: icon, apple: icon },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: SITE_DESC,
      url: SITE_URL,
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESC,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${orbitron.variable} ${playfair.variable} ${spaceMono.variable}`}
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
