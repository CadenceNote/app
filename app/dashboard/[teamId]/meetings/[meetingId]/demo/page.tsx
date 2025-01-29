"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { type Team, TeamRole } from "@/lib/types/team"
import { type Meeting, Participant } from "@/lib/types/meeting"
import { RealtimeNoteBoard } from "@/components/meetings/RealtimeNoteBoard"
import { meetingApi } from "@/services/meetingApi"
import { teamApi } from "@/services/teamApi"
import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { taskApi } from "@/services/taskApi"

interface MeetingWithParticipants extends Omit<Meeting, "participants"> {
    participants: Array<{
        id: number
        email: string
        full_name: string
        role?: string
    }>
}

export default function RealtimeDemo() {
    const params = useParams()
    const teamId = Number.parseInt(params.teamId as string)
    const meetingId = Number.parseInt(params.meetingId as string)

    const [meeting, setMeeting] = useState<MeetingWithParticipants | null>(null)
    const [teamData, setTeamData] = useState<Team | null>(null)
    const [tasks, setTasks] = useState<Array<{ id: number; title: string; team_ref_number: string; }>>([])

    const [error, setError] = useState<string>("")
    const [currentUserId, setCurrentUserId] = useState<number | null>(null)
    const { user, isLoading: userLoading } = useUser()
    const [boardReady, setBoardReady] = useState(false)
    const [showLoader, setShowLoader] = useState(true)

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (userLoading) return

                const [meetingRes, teamDataRes, tasksRes] = await Promise.all([
                    meetingApi.getMeeting(meetingId, teamId),
                    teamApi.getTeam(teamId),
                    taskApi.listTasks(teamId),
                ])

                // Transform the meeting data to match the expected format
                const meetingWithParticipants = {
                    ...meetingRes,
                    participants: meetingRes.participants.map((p) => ({
                        id: p.id,
                        email: p.email || "",
                        full_name: p.full_name || "",
                        role: teamDataRes.members?.find((m) => m.user_id === p.id)?.role || "member",
                    })),
                }
                console.log("meetingRes", meetingRes)
                console.log("meetingWithParticipants", meetingWithParticipants)
                setMeeting(meetingWithParticipants)
                setTeamData(teamDataRes)
                setCurrentUserId(user?.id ?? null)
                setTasks(tasksRes)
            } catch (error) {
                console.error("Error fetching data:", error)
                setError("Failed to load meeting data")
                setShowLoader(false)
            }
        }

        fetchAllData()
    }, [teamId, meetingId, user, userLoading])

    const handleBoardReady = useCallback(() => {
        setBoardReady(true)
    }, [])

    // Combine all readiness states
    const allReady = !!meeting && !!teamData && !!user && !!currentUserId && boardReady

    useEffect(() => {
        if (allReady) {
            const timer = setTimeout(() => setShowLoader(false), 300)
            return () => clearTimeout(timer)
        }
    }, [allReady])

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-screen">
                <Card className="w-[350px]">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <svg className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Meeting</h3>
                        <p className="text-sm text-gray-500 text-center">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const userRole = teamData?.members?.find((m) => m.user_id === currentUserId)?.role || "member"

    return (
        <div className="flex-1 bg-[#F9FAFB] relative min-h-screen">
            {/* Loading overlay */}
            <div
                className={`fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center 
                transition-opacity duration-300 ${showLoader ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
                <div className="flex items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">Loading collaborative session...</h3>
                        <p className="text-sm text-gray-500">Connecting to your meeting space.</p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div
                className={`max-w-[2000px] mx-auto transition-opacity duration-300 ${showLoader ? "opacity-0" : "opacity-100"}`}
            >
                {meeting && teamData && currentUserId && (
                    <RealtimeNoteBoard
                        meetingId={meetingId}
                        currentUserId={currentUserId}
                        userRole={userRole}
                        participants={meeting.participants}
                        onReady={handleBoardReady}
                        tasks={tasks}
                        teamId={teamId}
                    />
                )}
            </div>
        </div>
    )
}

