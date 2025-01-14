// app/dashboard/[teamId]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { MeetingList } from '@/components/meetings/MeetingList';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';

export default function TeamDashboardPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Meetings Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Team Meetings</h2>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Meeting
                    </Button>
                </div>
                <MeetingList teamId={teamId} />
            </div>

            {/* Tasks Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Team Tasks</h2>
                    <Button onClick={() => router.push(`/dashboard/${teamId}/tasks/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                </div>
                <TaskList teamId={teamId} />
            </div>

            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={parseInt(teamId)}
            />
        </div>
    );
}