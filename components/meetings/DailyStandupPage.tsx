/** 
 * DailyStandupPage Component
 * 
 * Top-level page component for daily standup meetings:
 * - Handles user authentication and team roles
 * - Manages meeting metadata (title, description)
 * - Controls participant list and modal
 * - Renders overall page layout
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Users, Target, ListTodo, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { meetingApi } from '@/services/meetingApi';
import { MeetingType, MeetingStatus, MeetingNoteBlock } from '@/lib/types/meeting';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { TeamRole } from '@/lib/types/team';
import { ParticipantNoteBoard } from './ParticipantNoteBoard';
import { useUser } from '@/hooks/useUser';
import { teamApi } from '@/services/teamApi';
import { Card } from '../ui/card';

interface MeetingNotes {
    blocks: MeetingNoteBlock[];
}

interface MeetingAPIResponse {
    id: number;
    title: string;
    description?: string;
    type: MeetingType;
    status: MeetingStatus;
    duration_minutes: number;
    start_time: string;
    participants: {
        id: number;
        email: string;
        full_name: string;
    }[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
    settings?: {
        goals: string[];
        agenda: string[];
    };
}

interface ExtendedMeeting extends Omit<MeetingAPIResponse, 'participants'> {
    participants: {
        id: number;
        email: string;
        full_name: string;
        role: TeamRole;
    }[];
}

interface DailyStandupPageProps {
    teamId: number;
    meetingId: number;
    currentUserId: number;
    userRole: TeamRole;
}

export function DailyStandupPage({
    teamId,
    meetingId,
    currentUserId,
    userRole
}: DailyStandupPageProps) {
    const [meeting, setMeeting] = useState<ExtendedMeeting | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const { user, isLoading: isUserLoading } = useUser();
    const [currentUser, setCurrentUser] = useState<{ id: number; role: TeamRole } | null>(null);
    const { toast } = useToast();
    const meetingRef = useRef<ExtendedMeeting | null>(null);

    // Keep meetingRef in sync with meeting state
    useEffect(() => {
        meetingRef.current = meeting;
    }, [meeting]);

    const fetchMeetingData = async () => {
        try {
            const data = await meetingApi.getMeeting(teamId, meetingId) as MeetingAPIResponse;

            // Get team member roles for each participant
            const teamData = await teamApi.getTeam(teamId);
            const memberRoles = new Map(teamData.members?.map(m => [m.user_id, m.role as TeamRole]));

            const transformedData: ExtendedMeeting = {
                ...data,
                participants: data.participants.map(p => ({
                    id: p.id,
                    email: p.email,
                    full_name: p.full_name,
                    role: memberRoles.get(p.id) || 'member'
                }))
            };

            // Only update if data has changed
            const meetingChanged = JSON.stringify(meetingRef.current) !== JSON.stringify(transformedData);


            if (meetingChanged) {
                setMeeting(transformedData);
            }
        } catch (error) {
            console.error('[MeetingNotes] Failed to fetch meeting data:', error);
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
                console.error('[MeetingNotes] Failed to fetch user data:', error);
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

    // Handle visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {

            if (document.visibilityState === 'visible') {
                fetchMeetingData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [teamId, meetingId]);

    const handleSave = useCallback(() => {
        fetchMeetingData();
    }, [teamId, meetingId]);

    if (!meeting || !currentUser || isUserLoading) return null;

    return (
        <div className="min-h-screen bg-[#F4F5F7]">
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    {/* Header Section */}
                    <div className="px-8 py-6 border-b border-gray-100">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold text-gray-900">{meeting?.title || 'Daily Standup'}</h1>
                                <p className="text-sm text-gray-500">{meeting?.description || 'Share updates with your team'}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="inline-flex items-center text-sm text-gray-500">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {meeting.duration_minutes} minutes
                                    </span>
                                    <span className="inline-flex items-center text-sm text-gray-500">
                                        <Users className="h-4 w-4 mr-1" />
                                        {meeting.participants.length} participants
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsParticipantsModalOpen(true)}
                                className="hover:bg-gray-50"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Participants
                            </Button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* Meeting Goals Section */}
                            <Card className="rounded-lg p-6 border border-gray-100">
                                <h3 className="text-sm font-semibold flex items-center text-gray-700 mb-4">
                                    <Target className="h-4 w-4 mr-2 text-blue-600" />
                                    Goals
                                </h3>
                                <div className="space-y-3">
                                    {meeting.settings?.goals?.length ? (
                                        meeting.settings.goals.map((goal: string, index: number) => (
                                            <p key={index} className="text-sm text-gray-600 flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{goal}</span>
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No goals set</p>
                                    )}
                                </div>
                            </Card>

                            {/* Meeting Agenda Section */}
                            <Card className="rounded-lg p-6 border border-gray-100">
                                <h3 className="text-sm font-semibold flex items-center text-gray-700 mb-4">
                                    <ListTodo className="h-4 w-4 mr-2 text-blue-600" />
                                    Agenda
                                </h3>
                                <div className="space-y-3">
                                    {meeting.settings?.agenda?.length ? (
                                        meeting.settings.agenda.map((item: string, index: number) => (
                                            <p key={index} className="text-sm text-gray-600 flex items-start">
                                                <span className="mr-2 text-blue-600 font-medium">{index + 1}.</span>
                                                <span>{item}</span>
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No agenda items</p>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Notes Section */}
                        {meeting.participants && (
                            <div className="bg-white">
                                <ParticipantNoteBoard
                                    teamId={teamId}
                                    meetingId={meeting.id}
                                    currentUserId={currentUserId}
                                    userRole={userRole}
                                    participants={meeting.participants}
                                    onSave={handleSave}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <MeetingParticipantsModal
                    open={isParticipantsModalOpen}
                    onOpenChange={setIsParticipantsModalOpen}
                    teamId={teamId}
                    meetingId={meetingId}
                    currentParticipants={meeting.participants}
                    onParticipantsUpdate={fetchMeetingData}
                />
            </div>
        </div>
    );
}
