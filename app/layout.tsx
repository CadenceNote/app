import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Optimize font loading
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Agilee",
    default: "Agilee - Streamline your agile ceremonies",
  },
  description: "Streamline your agile ceremonies with intelligent note-taking.",
  keywords: ["agile", "scrum", "kanban", "notes", "meetings", "productivity", "team collaboration"],
  authors: [
    {
      name: "Agilee Team",
    },
  ],
  creator: "Agilee",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://agilee.app",
    title: "Agilee - Streamline your agile ceremonies",
    description: "Streamline your agile ceremonies with intelligent note-taking.",
    siteName: "Agilee",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agilee - Streamline your agile ceremonies",
    description: "Streamline your agile ceremonies with intelligent note-taking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Agilee" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Agilee" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}