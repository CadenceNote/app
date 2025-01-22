'use client';

import { MeetingHeader } from '@/components/meetings/MeetingHeader';
import { DailyStandupPage } from '@/components/meetings/DailyStandupPage';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { meetingApi } from '@/services/meetingApi';
import { TeamRole } from '@/lib/types/team';

export default function TeamMeetingsPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const meetingId = params.meetingId as string;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { user, isLoading } = useUser();
    const [userRole, setUserRole] = useState<TeamRole | null>(null);

    useEffect(() => {
        const loadUserRole = async () => {
            if (user) {
                try {
                    const response = await meetingApi.getTeamRole(parseInt(teamId));
                    setUserRole(response.role);
                } catch (error) {
                    console.error('Error loading user role:', error);
                }
            }
        };
        loadUserRole();
    }, [user, teamId]);

    if (isLoading || !userRole) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>User not found</div>;
    }

    if (!meetingId) {
        return <div>Meeting not found</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <MeetingHeader
                teamId={teamId}
                meetingId={meetingId}
                onCreateMeeting={() => setIsCreateModalOpen(true)}
            />
            <DailyStandupPage
                teamId={parseInt(teamId)}
                meetingId={parseInt(meetingId)}
                currentUserId={user?.id}
                userRole={userRole}
            />
            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={parseInt(teamId)}
            />
        </div>
    );
}