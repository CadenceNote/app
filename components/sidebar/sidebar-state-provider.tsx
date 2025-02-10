'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
    // Read localStorage synchronously during initial render
    const [defaultOpen] = useState(() => {
        if (typeof window === 'undefined') return false;
        const savedState = localStorage.getItem('sidebar:state');
        return savedState === 'true';
    });

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            {children}
        </SidebarProvider>
    );
}