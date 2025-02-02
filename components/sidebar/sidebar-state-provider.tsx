'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [defaultOpen, setDefaultOpen] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('sidebar:state');
        setDefaultOpen(savedState === 'true');
        setMounted(true);
    }, []);

    // Don't render anything until we've determined the initial state
    if (!mounted) {
        return (
            <SidebarProvider defaultOpen={false}>
                <div style={{ visibility: 'hidden' }}>{children}</div>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            {children}
        </SidebarProvider>
    );
} 