import type { Metadata, Viewport } from "next";
import { Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import { AuthProvider } from "@/components/layout/AuthProvider";
import "@/styles/globals.css";

/* ── フォント ── */
const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});
const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

/* ── DM Serif Display はnext/fontに未対応のためCDN ── */
// 代わりにglobals.cssへ @import で追記する

/* ── メタデータ ── */
export const metadata: Metadata = {
  title: {
    default:  "NovelFlow — あなただけの物語を、読もう",
    template: "%s | NovelFlow",
  },
  description:
    "登場人物をあなたの名前に変えて没入できる小説プラットフォーム。ページめくり型と縦スクロール型、2つの読書体験。",
  keywords: ["小説", "名前変換", "読書", "投稿", "創作"],
  openGraph: {
    type:      "website",
    locale:    "ja_JP",
    siteName:  "NovelFlow",
    title:     "NovelFlow — あなただけの物語を、読もう",
    description: "登場人物をあなたの名前に変えて没入できる小説プラットフォーム。",
  },
  twitter: {
    card:    "summary_large_image",
    creator: "@novelflow_app",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,
  themeColor:          "#0a0910",
};

/* ── ルートレイアウト ── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${notoSerif.variable} ${notoSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* DM Serif Display (CDN) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
