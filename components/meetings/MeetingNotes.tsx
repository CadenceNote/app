'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { meetingApi } from '@/services/meetingApi';
import { TeamMember } from '@/lib/types/team';
import { ParticipantRow } from './ParticipantRow';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { Meeting } from '@/lib/types/meeting';

interface MeetingNotesProps {
    teamId: number;
    meetingId: number;
}

export function MeetingNotes({ teamId, meetingId }: MeetingNotesProps) {
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchMeetingData = async () => {
        try {
            const data = await meetingApi.getMeeting(teamId, meetingId);
            setMeeting(data);
        } catch (error) {
            console.error('Failed to fetch meeting data:', error);
            toast({
                title: "Error",
                description: "Failed to load meeting data",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        fetchMeetingData();
    }, [teamId, meetingId]);

    const handleNotesUpdate = async (userId: number, notes: any) => {
        try {
            await meetingApi.updateNotes(teamId, meetingId, userId, notes);
            await fetchMeetingData(); // Refresh data after update
        } catch (error) {
            console.error('Failed to update notes:', error);
            toast({
                title: "Error",
                description: "Failed to update notes",
                variant: "destructive"
            });
        }
    };

    if (!meeting) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{meeting.title}</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsParticipantsModalOpen(true)}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Participants
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {meeting.participants.map((participant) => (
                        <ParticipantRow
                            key={participant.id}
                            userName={participant.name}
                            notes={meeting.notes[participant.id] || { todo: [], blockers: [], done: [] }}
                            canEdit={true} // TODO: Add proper permission check
                            onNotesUpdate={(notes) => handleNotesUpdate(participant.id, notes)}
                            teamId={teamId}
                            meetingId={meetingId}
                            userId={participant.id}
                        />
                    ))}
                </CardContent>
            </Card>

            <MeetingParticipantsModal
                open={isParticipantsModalOpen}
                onOpenChange={setIsParticipantsModalOpen}
                teamId={teamId}
                meetingId={meetingId}
                currentParticipants={meeting.participants}
                onParticipantsUpdate={fetchMeetingData}
            />
        </div>
    );
}
