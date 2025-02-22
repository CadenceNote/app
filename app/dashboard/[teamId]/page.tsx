/*
* Team Dashboard Page
* 
* This page displays the dashboard for a team.
* It includes statistics, meeting and task lists, and modals for creating meetings and tasks.
*/
"use client"

import { use } from "react"
import AIAssistant from "@/components/personal_dashboard/AIAssistant"
import TeamStats from "@/components/team_dashboard/TeamStats"
import TeamAlerts from "@/components/team_dashboard/TeamAlerts"
import TeamEvents from "@/components/team_dashboard/TeamEvents"
import TeamTasks from "@/components/team_dashboard/TeamTasks"
import TeamMeetings from "@/components/team_dashboard/TeamMeetings"
import DashboardHeader from "@/components/header/DashboardHeader"
import { useState } from "react"
import { useTeams } from "@/hooks/useTeams"

export default function TeamDashboard({ params }: { params: Promise<{ teamId: string }> }) {
    const resolvedParams = use(params);
    const teamId = parseInt(resolvedParams.teamId);
    const [date, setDate] = useState<Date>();
    const [searchTerm, setSearchTerm] = useState("");
    const { teams } = useTeams()
    const currentTeam = teams?.find(t => t.id === teamId)
    return (
        <div className="h-full flex flex-col">

            <div className="flex-1 container mx-auto py-6 space-y-8">
                {/* Stats Row */}
                <TeamStats teamId={teamId} />

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content - First Two Columns */}
                    <div className="lg:col-span-2 space-y-6">
                        <AIAssistant teamId={teamId} />

                        <div className="">
                            <TeamTasks searchTerm={searchTerm} teamId={teamId} />
                        </div>

                        <div className="">
                            <TeamMeetings teamId={teamId} />
                        </div>
                    </div>

                    {/* Side Column - Calendar and Events */}
                    <div className="space-y-6">
                        <TeamEvents
                            date={date}
                            setDate={setDate}
                            teamId={teamId}
                        />
                        {/* <TeamAlerts teamId={teamId} /> */}
                    </div>
                </div>
            </div>
        </div>
    );
}