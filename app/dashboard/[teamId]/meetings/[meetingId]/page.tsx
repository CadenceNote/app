'use client';

import { MeetingHeader } from '@/components/meetings/MeetingHeader';
import { DailyStandupPage } from '@/components/meetings/DailyStandupPage';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { meetingApi } from '@/services/meetingApi';
import { teamApi } from '@/services/teamApi';
import { taskApi } from '@/services/taskApi';
import { TeamRole } from '@/lib/types/team';
import { Skeleton } from "@/components/ui/skeleton";
import { MeetingType, MeetingStatus } from '@/lib/types/meeting';

interface TeamMember {
    user_id: number;
    role: TeamRole;
}

interface TeamData {
    id: number;
    name: string;
    members: TeamMember[];
}

interface Meeting {
    id: number;
    title: string;
    description?: string;
    type: MeetingType;
    status: MeetingStatus;
    duration_minutes: number;
    start_time: string;
    participants: Array<{
        id: number;
        email: string;
        full_name: string;
        role?: TeamRole;
    }>;
    notes: Record<string, {
        blocks: Array<{
            id: string;
            type: 'todo' | 'blocker' | 'done';
            content: {
                text: string;
                task?: {
                    id: number;
                };
            };
            created_by: number;
            created_at: string;
        }>;
    }>;
    settings?: {
        goals: string[];
        agenda: string[];
        resources?: string[];
    };
}

interface Task {
    id: number;
    title: string;
    team_ref_number: string;
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="w-full">
                    <div className="h-16 border-b border-gray-100">
                        <div className="h-full max-w-[2000px] mx-auto px-6 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-28" />
                        </div>
                    </div>

                </div>
            </div>

            {/* Content Skeleton */}
            <div className="w-full">
                <div className="max-w-[2000px] mx-auto px-6 py-6">

                    {/* Goals and Agenda Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg p-6">
                                <Skeleton className="h-5 w-32 mb-4" />
                                <div className="space-y-3">
                                    {[...Array(2)].map((_, j) => (
                                        <Skeleton key={j} className="h-4 w-full" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Participant Notes Skeleton */}
                    <div className="space-y-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm">
                                <div className="grid grid-cols-[200px_1fr] divide-x">
                                    <div className="p-4 space-y-4">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <Skeleton className="h-16 w-16 rounded-full" />
                                            <div className="space-y-2 w-full">
                                                <Skeleton className="h-5 w-32 mx-auto" />
                                                <Skeleton className="h-4 w-40 mx-auto" />
                                                <Skeleton className="h-5 w-24 mx-auto" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {['todo', 'blocker', 'done'].map((type) => (
                                            <div key={type} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-5 w-24" />
                                                </div>
                                                <div className="space-y-3 pl-6">
                                                    {[...Array(2)].map((_, j) => (
                                                        <Skeleton key={j} className="h-20 w-full" />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeamMeetingsPage() {
    const params = useParams();
    const teamId = parseInt(params.teamId as string);
    const meetingId = parseInt(params.meetingId as string);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { user, isLoading: isUserLoading } = useUser();
    const [userRole, setUserRole] = useState<TeamRole | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Centralized data states
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAllData = async () => {
        if (!user) return;

        console.time('fullDataLoad');
        try {
            const [meetingResponse, teamResponse, roleResponse, tasksResponse] = await Promise.all([
                meetingApi.getMeeting(teamId, meetingId),
                teamApi.getTeam(teamId),
                meetingApi.getTeamRole(teamId),
                taskApi.listTasks(teamId)
            ]);

            setMeeting(meetingResponse as Meeting);
            setTeamData(teamResponse as TeamData);
            setUserRole(roleResponse.role);
            setTasks(tasksResponse);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
            console.timeEnd('fullDataLoad');
        }
    };

    useEffect(() => {
        // if (!isUserLoading && user) {
        loadAllData();
        // }
    }, [user, isUserLoading, teamId, meetingId]);

    if (isLoading || !userRole || !meeting || !teamData) {
        return <LoadingSkeleton />;
    }

    if (!user) {
        return <div>User not found</div>;
    }

    if (!meetingId) {
        return <div>Meeting not found</div>;
    }

    // Prepare participants with roles
    const participantsWithRoles = meeting.participants.map(p => ({
        ...p,
        role: teamData.members.find(m => m.user_id === p.id)?.role || 'member' as TeamRole
    }));

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <MeetingHeader
                teamId={String(teamId)}
                teamName={teamData.name}
                meetingId={String(meetingId)}
                onCreateMeeting={() => setIsCreateModalOpen(true)}
                title={meeting.title}
                durationMinutes={meeting.duration_minutes}
                participantCount={meeting.participants.length}
                lastSaved={lastSaved}
                isSaving={isSaving}
                participants={participantsWithRoles}
                canEdit={userRole === 'admin' || userRole === 'meeting_manager'}
                onUpdate={loadAllData}
            />
            <DailyStandupPage
                teamId={teamId}
                meetingId={meetingId}
                currentUserId={user.id}
                userRole={userRole}
                meeting={meeting}
                teamData={teamData}
                tasks={tasks}
                onSaveStatusChange={(saving: boolean, saved: Date | null) => {
                    setIsSaving(saving);
                    if (saved) setLastSaved(saved);
                }}
                hideHeader
                onUpdate={loadAllData}
            />
            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={teamId}
            />
        </div>
    );
}