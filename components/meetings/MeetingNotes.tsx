'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { meetingApi } from '@/services/meetingApi';
import { MeetingNotes as MeetingNotesType } from '@/lib/types/meeting';
import { ParticipantRow } from './ParticipantRow';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { TeamMember } from '@/lib/types/team';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MeetingNotesProps {
    teamId: number;
    meetingId: number;
}

interface ExtendedTeamMember extends TeamMember {
    email: string;
    full_name: string;
}

interface ExtendedMeeting {
    id: number;
    title: string;
    type: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants: ExtendedTeamMember[];
    notes: Record<string, MeetingNotesType>;
    settings: {
        goals: string[];
        agenda: string[];
    };
}

export function MeetingNotes({ teamId, meetingId }: MeetingNotesProps) {
    const [meeting, setMeeting] = useState<ExtendedMeeting | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchMeetingData = async () => {
        try {
            const data = await meetingApi.getMeeting(teamId, meetingId);
            const transformedData: ExtendedMeeting = {
                id: data.id,
                title: data.title,
                type: data.type,
                status: data.status,
                participants: data.participants as ExtendedTeamMember[],
                notes: data.notes,
                settings: (data as any).settings || { goals: [], agenda: [] }
            };
            setMeeting(transformedData);
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

    const handleNotesUpdate = async (userId: number, notes: MeetingNotesType) => {
        try {
            await meetingApi.updateNotes(teamId, meetingId, userId, notes);
            await fetchMeetingData();
        } catch (error) {
            console.error('Failed to update notes:', error);
            toast({
                title: "Error",
                description: "Failed to update notes",
                variant: "destructive"
            });
        }
    };

    if (!meeting) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Meeting Overview */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-2xl font-bold">{meeting.title}</CardTitle>
                                <div className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium capitalize">
                                    {meeting.type}
                                </div>
                                <div className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
                                    {meeting.status}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {meeting.participants.length} participants
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsParticipantsModalOpen(true)}
                        >
                            Manage Participants
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Meeting Goals Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center">
                                <Target className="h-4 w-4 mr-2" />
                                Goals
                            </h3>
                            <div className="pl-6 space-y-2">
                                {meeting.settings?.goals?.length ? (
                                    meeting.settings.goals.map((goal: string, index: number) => (
                                        <p key={index} className="text-sm text-muted-foreground">
                                            • {goal}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No goals set</p>
                                )}
                            </div>
                        </div>

                        {/* Meeting Agenda Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center">
                                <ListTodo className="h-4 w-4 mr-2" />
                                Agenda
                            </h3>
                            <div className="pl-6 space-y-2">
                                {meeting.settings?.agenda?.length ? (
                                    meeting.settings.agenda.map((item: string, index: number) => (
                                        <p key={index} className="text-sm text-muted-foreground">
                                            {index + 1}. {item}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No agenda items</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Meeting Notes</CardTitle>
                    <CardDescription>Notes and action items from each participant</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {meeting.participants.map((participant) => (
                            <div key={participant.id} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                                        <AvatarFallback>{participant.full_name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium">{participant.full_name}</h4>
                                        <p className="text-sm text-muted-foreground">{participant.email}</p>
                                    </div>
                                </div>
                                <ParticipantRow
                                    teamId={teamId}
                                    meetingId={meetingId}
                                    userId={participant.id}
                                    userName={participant.full_name}
                                    notes={meeting.notes[participant.id.toString()] || { todo: [], blockers: [], done: [] }}
                                    onNotesUpdate={(notes: MeetingNotesType) => handleNotesUpdate(participant.id, notes)}
                                    canEdit={true}
                                />
                            </div>
                        ))}
                    </div>
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
