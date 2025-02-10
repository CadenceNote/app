import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider"
import { AvatarCacheProvider } from '@/contexts/AvatarCache';
import { SWRConfig } from "swr";
import { SidebarStateProvider } from "@/components/sidebar/sidebar-state-provider";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agilee",
  description: "Streamline your agile ceremonies with intelligent note-taking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans `}
      >
        <ThemeProvider>
          <AvatarCacheProvider>
            <SWRConfig
              value={{
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
                focusThrottleInterval: 30000,
                dedupingInterval: 30000,
                shouldRetryOnError: false,
                errorRetryCount: 2,
                refreshInterval: 0,
                refreshWhenHidden: false,
                refreshWhenOffline: false,
                suspense: false,
                revalidateIfStale: false,
                revalidateOnMount: true,
                keepPreviousData: true,
              }}
            >
              <SidebarStateProvider>
                {children}
              </SidebarStateProvider>
            </SWRConfig>
          </AvatarCacheProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}