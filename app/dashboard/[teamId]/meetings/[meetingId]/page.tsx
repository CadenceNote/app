'use client';

import { MeetingHeader } from '@/components/meetings/MeetingHeader';
import { DailyStandupPage } from '@/components/meetings/DailyStandupPage';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { meetingApi } from '@/services/meetingApi';
import { teamApi } from '@/services/teamApi';
import { TeamRole } from '@/lib/types/team';
import { Skeleton } from "@/components/ui/skeleton";

interface Meeting {
    id: number;
    title: string;
    description?: string;
    duration_minutes: number;
    participants: Array<{
        id: number;
        email: string;
        full_name: string;
    }>;
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
                    <div className="h-14">
                        <div className="h-full max-w-[2000px] mx-auto px-6 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <Skeleton className="h-6 w-48" />
                                <div className="flex items-center gap-6">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="w-full">
                <div className="max-w-[2000px] mx-auto px-6 py-6">
                    {/* Description Skeleton */}
                    <div className="mb-6">
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Goals and Agenda Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg p-6">
                                <Skeleton className="h-5 w-32 mb-4" />
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, j) => (
                                        <Skeleton key={j} className="h-4 w-full" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Participant Notes Skeleton */}
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
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
    const teamId = params.teamId as string;
    const meetingId = params.meetingId as string;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { user, isLoading } = useUser();
    const [userRole, setUserRole] = useState<TeamRole | null>(null);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [teamName, setTeamName] = useState<string>('');

    const loadData = async () => {
        if (user) {
            try {
                const [roleResponse, meetingResponse, teamResponse] = await Promise.all([
                    meetingApi.getTeamRole(parseInt(teamId)),
                    meetingApi.getMeeting(parseInt(teamId), parseInt(meetingId)),
                    teamApi.getTeam(parseInt(teamId))
                ]);
                setUserRole(roleResponse.role);
                setMeeting(meetingResponse);
                setTeamName(teamResponse.name || `Team ${teamId}`);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [user, teamId, meetingId]);

    if (isLoading || !userRole || !meeting) {
        return <LoadingSkeleton />;
    }

    if (!user) {
        return <div>User not found</div>;
    }

    if (!meetingId) {
        return <div>Meeting not found</div>;
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <MeetingHeader
                teamId={teamId}
                teamName={teamName}
                meetingId={meetingId}
                onCreateMeeting={() => setIsCreateModalOpen(true)}
                title={meeting.title}
                durationMinutes={meeting.duration_minutes}
                participantCount={meeting.participants?.length}
                lastSaved={lastSaved}
                isSaving={isSaving}
                participants={meeting.participants}
                canEdit={userRole === 'admin' || userRole === 'meeting_manager'}
                onUpdate={loadData}
            />
            <DailyStandupPage
                teamId={parseInt(teamId)}
                meetingId={parseInt(meetingId)}
                currentUserId={user?.id}
                userRole={userRole}
                onSaveStatusChange={(saving: boolean, saved: Date | null) => {
                    setIsSaving(saving);
                    if (saved) setLastSaved(saved);
                }}
                hideHeader
            />
            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={parseInt(teamId)}
            />
        </div>
    );
}