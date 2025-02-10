import { AppSidebar } from '@/components/sidebar/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex w-full h-screen overflow-hidden">
            <AppSidebar className="shrink-0 bg-background/5" />
            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background">
                <div className="min-h-screen w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}