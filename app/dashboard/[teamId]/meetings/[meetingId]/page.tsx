'use client';

import { MeetingHeader } from '@/components/meetings/MeetingHeader';
import { MeetingNotes } from '@/components/meetings/MeetingNotes';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TeamMeetingsPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="container mx-auto p-6">
            <MeetingHeader
                teamId={teamId}
                onCreateMeeting={() => setIsCreateModalOpen(true)}
            />
            <MeetingNotes teamId={teamId} />
            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}