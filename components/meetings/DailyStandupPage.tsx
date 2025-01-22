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
import { Users, Target, ListTodo, Clock, Info, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { meetingApi } from '@/services/meetingApi';
import { MeetingType, MeetingStatus, MeetingNoteBlock } from '@/lib/types/meeting';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { TeamRole } from '@/lib/types/team';
import { ParticipantNoteBoard } from './ParticipantNoteBoard';
import { useUser } from '@/hooks/useUser';
import { teamApi } from '@/services/teamApi';
import { Card } from '../ui/card';
import { SaveStatus } from './SaveStatus';
import Link from 'next/link';

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
    hideHeader?: boolean;
    onSaveStatusChange?: (saving: boolean, saved: Date | null) => void;
}

export function DailyStandupPage({
    teamId,
    meetingId,
    currentUserId,
    userRole,
    hideHeader,
    onSaveStatusChange
}: DailyStandupPageProps) {
    const [meeting, setMeeting] = useState<ExtendedMeeting | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
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
    // useEffect(() => {
    //     const handleVisibilityChange = () => {

    //         if (document.visibilityState === 'visible') {
    //             fetchMeetingData();
    //         }
    //     };

    //     document.addEventListener('visibilitychange', handleVisibilityChange);
    //     return () => {
    //         document.removeEventListener('visibilitychange', handleVisibilityChange);
    //     };
    // }, [teamId, meetingId]);

    const handleSave = useCallback(() => {
        fetchMeetingData();
    }, [teamId, meetingId]);

    const handleSaveStatusChange = useCallback((saving: boolean, saved: Date | null) => {
        setIsSaving(saving);
        if (saved) setLastSaved(saved);
        onSaveStatusChange?.(saving, saved);
    }, [onSaveStatusChange]);

    if (!meeting || !currentUser || isUserLoading) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#F9FAFB]">


            {/* Main Content - Keep max-width for content readability */}
            <div className="flex-1 w-full">
                <div className="max-w-[2000px] mx-auto px-6 py-6">
                    {/* Goals and Agenda Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Meeting Goals */}
                        <Card className="bg-white">
                            <div className="p-6">
                                <h3 className="text-sm font-medium flex items-center text-gray-900 mb-4">
                                    <Target className="h-4 w-4 mr-2 text-blue-600" />
                                    Meeting Goals
                                </h3>
                                <div className="space-y-3">
                                    {meeting.settings?.goals?.length ? (
                                        meeting.settings.goals.map((goal: string, index: number) => (
                                            <p key={index} className="text-sm text-gray-600 flex items-start">
                                                <span className="mr-2">•</span>
                                                {goal}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No goals set</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Meeting Agenda */}
                        <Card className="bg-white">
                            <div className="p-6">
                                <h3 className="text-sm font-medium flex items-center text-gray-900 mb-4">
                                    <ListTodo className="h-4 w-4 mr-2 text-blue-600" />
                                    Meeting Agenda
                                </h3>
                                <div className="space-y-3">
                                    {meeting.settings?.agenda?.length ? (
                                        meeting.settings.agenda.map((item: string, index: number) => (
                                            <p key={index} className="text-sm text-gray-600 flex items-start">
                                                <span className="mr-2 text-blue-600 font-medium">{index + 1}.</span>
                                                {item}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No agenda items</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Notes Section */}
                    {meeting.participants && (
                        <div className="bg-white rounded-lg shadow-sm">
                            <ParticipantNoteBoard
                                teamId={teamId}
                                meetingId={meeting.id}
                                currentUserId={currentUserId}
                                userRole={userRole}
                                participants={meeting.participants}
                                onSave={handleSave}
                                onSaveStatusChange={handleSaveStatusChange}
                            />
                        </div>
                    )}
                </div>
                <div className="max-w-[2000px] mx-auto px-6">
                    <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                        <div className="flex items-center text-sm text-blue-900 mb-3">
                            <Info className="h-4 w-4 mr-2" />
                            <span className="font-medium">Quick Tips</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                            <div className="flex items-start">
                                <span className="mr-2">•</span>
                                Use <kbd className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-200 text-xs">@</kbd>
                                to mention team members
                            </div>
                            <div className="flex items-start">
                                <span className="mr-2">•</span>
                                Use <kbd className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-200 text-xs">#</kbd>
                                to reference tasks
                            </div>
                            <div className="flex items-start">
                                <span className="mr-2">•</span>
                                Press <kbd className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-200 text-xs">/</kbd>
                                to create tasks
                            </div>
                        </div>
                    </div>
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
    );
}
