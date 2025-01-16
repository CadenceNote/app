'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { meetingApi } from '@/services/meetingApi';
import { MeetingNotes as MeetingNotesType } from '@/lib/types/meeting';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { TeamRole } from '@/lib/types/team';
import { StandupNotes } from './StandupNotes';
import { useUser } from '@/hooks/useUser';

interface MeetingNotesProps {
    teamId: number;
    meetingId: number;
}

interface MeetingParticipant {
    id: number;
    email: string;
    full_name: string;
    role?: string;
}

interface MeetingResponse {
    id: number;
    title: string;
    type: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants: MeetingParticipant[];
    notes: Record<string, MeetingNotesType>;
    settings?: {
        goals: string[];
        agenda: string[];
    };
}

interface ExtendedMeeting extends MeetingResponse {
    participants: MeetingParticipant[];
}

export function MeetingNotes({ teamId, meetingId }: MeetingNotesProps) {
    const [meeting, setMeeting] = useState<ExtendedMeeting | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const { user, isLoading: isUserLoading } = useUser();
    const [currentUser, setCurrentUser] = useState<{ id: number; role: TeamRole } | null>(null);
    const { toast } = useToast();

    const fetchMeetingData = async () => {
        try {
            const data = await meetingApi.getMeeting(teamId, meetingId);
            const transformedData: ExtendedMeeting = {
                ...data,
                participants: data.participants.map(p => ({
                    id: p.id,
                    email: p.email,
                    full_name: p.full_name,
                    role: p.role
                }))
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
        const loadData = async () => {
            if (!user) return;

            try {
                // Get user's role in the team - this should be cached
                const teamData = await meetingApi.getTeamRole(teamId);
                setCurrentUser({
                    id: user.id,
                    role: teamData.role
                });
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load user data",
                    variant: "destructive"
                });
            }
        };

        if (!isUserLoading) {
            loadData();
            fetchMeetingData();
        }
    }, [teamId, meetingId, user, isUserLoading]);

    if (!meeting || !currentUser || isUserLoading) return null;

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
                    <CardTitle>Standup Notes</CardTitle>
                    <CardDescription>Share your updates, blockers, and completed items</CardDescription>
                </CardHeader>
                <CardContent>
                    <StandupNotes
                        teamId={teamId}
                        meetingId={meetingId}
                        currentUserId={currentUser.id}
                        userRole={currentUser.role}
                        participants={meeting.participants}
                        onSave={fetchMeetingData}
                    />
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
