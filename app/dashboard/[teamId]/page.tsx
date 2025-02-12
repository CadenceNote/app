/*
* Team Dashboard Page
* 
* This page displays the dashboard for a team.
* It includes statistics, meeting and task lists, and modals for creating meetings and tasks.
*/
"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams } from "next/navigation"
import TeamSidebar from "@/components/team_dashboard/TeamSidebar"
import TeamAIAssistant from "@/components/team_dashboard/TeamAIAssistant"
import TeamStats from "@/components/team_dashboard/TeamStats"
import TeamAlerts from "@/components/team_dashboard/TeamAlerts"
import TeamEvents from "@/components/team_dashboard/TeamEvents"
import TeamTasks from "@/components/team_dashboard/TeamTasks"
import TeamMeetings from "@/components/team_dashboard/TeamMeetings"
import TeamHeader from "@/components/team_dashboard/TeamHeader"
import { useTask } from '@/hooks/useTask';
import { useTeams } from '@/hooks/useTeams';
import { useMeeting } from '@/hooks/useMeeting';
import { useUser } from '@/hooks/useUser';
import { useToast } from "@/hooks/use-toast"

export default function TeamDashboardPage() {
    const params = useParams();
    const teamId = parseInt(params.teamId as string);
    const [searchTerm, setSearchTerm] = useState("")
    const [activeSection, setActiveSection] = useState('summary-section')
    const [date, setDate] = useState<Date>(new Date())
    const { toast } = useToast()

    // Use our hooks with team scope
    const { user } = useUser();
    const { teams, isLoading: isLoadingTeams } = useTeams();
    const currentTeam = teams?.find(t => t.id === teamId);

    // Use task hook for specific team
    const { tasks, tasksError, isLoadingTasks } = useTask(teamId);

    // Use meeting hook for specific team
    const {
        meetings,
        meetingsError,
        isLoadingMeetings
    } = useMeeting(teamId);

    useEffect(() => {
        if (tasksError) {
            toast({
                title: "Error",
                description: "Failed to fetch team tasks",
                variant: "destructive"
            });
        }
        if (meetingsError) {
            toast({
                title: "Error",
                description: "Failed to fetch team meetings",
                variant: "destructive"
            });
        }
    }, [tasksError, meetingsError, toast]);

    // Don't render content until data is loaded
    if (isLoadingTeams || isLoadingTasks || isLoadingMeetings) {
        return <div className="flex h-screen items-center justify-center">Loading team dashboard...</div>;
    }

    if (!currentTeam) {
        return <div className="flex h-screen items-center justify-center">Team not found</div>;
    }

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <TeamSidebar activeSection={activeSection} setActiveSection={setActiveSection} teamId={teamId} />
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto ml-64 ">
                <TeamHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} teamId={teamId} />

                <Suspense fallback={<div>Loading...</div>}>
                    {/* Dashboard Content */}
                    <div className="min-h-screen  max-w-7xl mx-auto">
                        {/* Summary Section */}
                        <section id="summary-section" className="min-h-screen p-6 space-y-6 pt-24">
                            {/* AI Assistant */}
                            <TeamAIAssistant teamId={teamId} />

                            {/* Stats */}
                            <TeamStats
                                tasks={tasks || []}
                                meetings={meetings || []}
                                team={currentTeam}
                            />

                            {/* Alerts */}
                            <TeamAlerts teamId={teamId} />
                        </section>

                        {/* Calendar Section */}
                        <section id="calendar-section" className="min-h-screen p-6 space-y-6 pt-24">
                            <TeamEvents
                                meetings={meetings || []}
                                tasks={tasks || []}
                                date={date}
                                setDate={setDate}
                                teamId={teamId}
                            />
                        </section>

                        {/* Tasks Section */}
                        <section id="tasks-section" className="min-h-screen p-6 space-y-6  pt-24">
                            <TeamTasks
                                searchTerm={searchTerm}
                                teamId={teamId}
                            />
                        </section>

                        {/* Meetings Section */}
                        <section id="meetings-section" className="min-h-screen p-6 space-y-6 pt-24">
                            <TeamMeetings teamId={teamId} />
                        </section>
                    </div>
                </Suspense>
            </main>
        </div>
    )
}