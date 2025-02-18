"use client"

import React from "react"
import { useParams } from "next/navigation"
import { RealtimeNoteBoard } from "@/components/meetings/RealtimeNoteBoard"
import { useUser } from "@/hooks/useUser"
import { Card, CardContent } from "@/components/ui/card"
import { useTask } from "@/hooks/useTask"
import { useMeeting } from "@/hooks/useMeeting"
import { useTeams } from "@/hooks/useTeams"
import { MeetingHeader } from "@/components/meetings/MeetingHeader"
import { TeamRole } from "@/lib/types/team"
import { Participant } from "@/lib/types/meeting"

function LoadingSpinner({ message }: { message: string }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
            <div className="flex items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24">
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
                    <h3 className="text-lg font-medium text-foreground">Loading...</h3>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
        </div>
    )
}

function ErrorDisplay({ message }: { message: string }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
            <Card className="w-[350px]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                    <svg className="h-12 w-12 text-destructive mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Meeting</h3>
                    <p className="text-sm text-muted-foreground text-center">{message}</p>
                </CardContent>
            </Card>
        </div>
    )
}

export default function RealtimeDemo() {
    console.log("[RealtimeDemo] Component mounting...")
    const params = useParams()
    const teamId = Number.parseInt(params.teamId as string)
    const meetingId = Number.parseInt(params.meetingId as string)

    // State for board loading
    const [boardReady, setBoardReady] = React.useState(false)
    const [showLoader, setShowLoader] = React.useState(true)

    // 1. Load user data
    const { user, isLoading: userLoading, error: userError } = useUser()
    console.log("[RealtimeDemo] User data:", { user: user?.id, loading: userLoading, error: userError })

    // 2. Load teams data
    const { teams, isLoading: teamsLoading, teamsError } = useTeams()
    const teamData = React.useMemo(() => teams?.find(t => t.id === teamId), [teams, teamId])
    console.log("[RealtimeDemo] Teams data:", {
        teamsCount: teams?.length,
        teamFound: !!teamData,
        loading: teamsLoading,
        error: teamsError
    })

    // 3. Load meeting data - only start loading when we have team data
    const { meeting, isLoadingMeeting, meetingError } = useMeeting(
        teamData ? teamId : undefined,
        teamData ? meetingId : undefined
    )
    console.log("[RealtimeDemo] Meeting data:", {
        meetingId,
        found: !!meeting,
        loading: isLoadingMeeting,
        error: meetingError,
        participantsCount: meeting?.participants?.length,
        teamDataReady: !!teamData
    })

    // 4. Load tasks data - only start loading when we have team data
    const { tasks, isLoadingTasks, tasksError } = useTask(teamData ? teamId : undefined)
    console.log("[RealtimeDemo] Tasks data:", {
        tasksCount: tasks?.length,
        loading: isLoadingTasks,
        error: tasksError
    })

    // Handle board ready state
    const handleBoardReady = React.useCallback(() => {
        console.log("[RealtimeDemo] Board signaled ready")
        setBoardReady(true)
        // Hide loader when board is ready
        setShowLoader(false)
    }, [])

    // Effect to hide loader if taking too long
    React.useEffect(() => {
        // Fallback to hide loader after 10 seconds
        const timeout = setTimeout(() => {
            if (showLoader) {
                console.log("[RealtimeDemo] Hiding loader after timeout")
                setShowLoader(false)
            }
        }, 10000)

        return () => clearTimeout(timeout)
    }, [showLoader])

    // Memoize formatted data
    const formattedParticipants = React.useMemo(() =>
        meeting?.participants?.map(p => ({
            id: String(p.id),
            email: p.email || "",
            full_name: p.name || p.full_name || "",
            role: teamData?.members?.find(m => m.user_id === String(p.id))?.role as TeamRole
        })) || [],
        [meeting?.participants, teamData?.members])

    const formattedTasks = React.useMemo(() =>
        tasks?.map(task => ({
            id: Number(task.id),
            title: task.title,
            team_ref_number: task.team_ref_number || ""
        })) || [],
        [tasks])

    const userRole = React.useMemo(() =>
        teamData?.members?.find(m => m.user_id === user?.id)?.role as TeamRole || "member",
        [teamData?.members, user?.id])

    // Loading states for data fetching
    if (userLoading || teamsLoading || isLoadingMeeting || isLoadingTasks) {
        return <LoadingSpinner message="Loading meeting data..." />
    }

    // Error states
    if (userError) return <ErrorDisplay message="Failed to load user data" />
    if (teamsError) return <ErrorDisplay message="Failed to load team data" />
    if (meetingError) return <ErrorDisplay message="Failed to load meeting data" />
    if (tasksError) return <ErrorDisplay message="Failed to load tasks data" />

    // Data validation
    if (!user) return <ErrorDisplay message="User not authenticated" />
    if (!teamData) return <ErrorDisplay message="Team not found" />
    if (!meeting) return <ErrorDisplay message="Meeting not found" />

    console.log("[RealtimeDemo] Formatted participants:", formattedParticipants)
    console.log("[RealtimeDemo] Rendering with data:", {
        participantsCount: formattedParticipants.length,
        tasksCount: formattedTasks.length,
        userRole,
        boardReady,
        showLoader
    })

    return (
        <div className="min-h-screen bg-background">
            {/* Loading Overlay */}
            {showLoader && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
                    <LoadingSpinner message="Connecting to collaborative session..." />
                </div>
            )}

            {/* Main content */}
            <MeetingHeader
                teamId={String(teamId)}
                teamName={teamData.name}
                meetingId={String(meetingId)}
                title={meeting.title}
                durationMinutes={meeting.duration_minutes}
                participantCount={formattedParticipants.length}
                participants={formattedParticipants}
                canEdit={userRole === "admin" || userRole === "meeting_manager"}
                isDemoMode={true}
                onUpdate={() => { }}
                onCreateMeeting={() => { }}
            />

            <div className={`max-w-[2000px] mx-auto p-6 space-y-6 transition-opacity duration-300 ${!boardReady ? "opacity-0" : "opacity-100"}`}>
                <RealtimeNoteBoard
                    key={`${teamId}-${meetingId}`}
                    meetingId={meetingId}
                    currentUserId={user.id}
                    userRole={userRole}
                    participants={formattedParticipants}
                    onReady={handleBoardReady}
                    tasks={formattedTasks}
                    teamId={teamId}
                    meeting={meeting}
                />
            </div>
        </div>
    )
}