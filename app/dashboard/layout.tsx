'use client';

import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/header/DashboardHeader';
import { useTeams } from '@/hooks/useTeams';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const teamId = params?.teamId as string | undefined;
    const { teams } = useTeams();

    // Get current team name if in team scope
    const currentTeam = teamId ? teams.find(team => team.id === Number(teamId)) : undefined;
    const context = currentTeam ? currentTeam.name : 'Personal Dashboard';

    return (
        <ProtectedRoute>
            <div className="flex overflow-hidden w-full">
                <AppSidebar className="shrink-0 bg-background/5" />
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden ">
                    <DashboardHeader context={context} />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}