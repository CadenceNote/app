'use client';

import { MeetingHeader } from '@/components/meetings/MeetingHeader';
import { MeetingNotes } from '@/components/meetings/MeetingNotes';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TeamMeetingsPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const meetingId = params.meetingId as string;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            <MeetingNotes
                teamId={parseInt(teamId)}
                meetingId={parseInt(meetingId)}
            />
            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={parseInt(teamId)}
            />
        </div>
    );
}