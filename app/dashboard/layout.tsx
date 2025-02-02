'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <SidebarProvider>
                <div className="flex w-full h-screen overflow-hidden">
                    <AppSidebar className="shrink-0 bg-background/5" />
                    {/* Main Content */}
                    <main className="flex-1 overflow-auto bg-background">
                        <div className="min-h-screen w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        </DashboardProvider>
    );
}