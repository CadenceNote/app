'use client';

import { ThemeProvider } from "@/components/theme-provider"
import { AvatarCacheProvider } from '@/contexts/AvatarCache';
import { SWRConfig } from "swr";
import { SidebarStateProvider } from "@/components/sidebar/sidebar-state-provider";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useEffect } from "react";
import { notificationJobService } from "@/services/notificationJobService";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Start notification jobs
        notificationJobService.startNotificationJobs();

        // Cleanup on unmount
        return () => {
            notificationJobService.stopNotificationJobs();
        };
    }, []);

    return (
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
            <Toaster />
            <Analytics />
            <SpeedInsights />
        </ThemeProvider>
    );
} 