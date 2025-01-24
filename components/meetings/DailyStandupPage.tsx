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

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ListTodo, Info, Edit2, Check, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { meetingApi } from '@/services/meetingApi';
import { MeetingType, MeetingStatus, MeetingNoteBlock } from '@/lib/types/meeting';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { TeamRole } from '@/lib/types/team';
import { ParticipantNoteBoard } from './ParticipantNoteBoard';
import { Card } from '../ui/card';
import { MeetingHeader } from './MeetingHeader';
import { Textarea } from "@/components/ui/textarea";

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
        role?: TeamRole;
    }[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
    settings?: {
        goals: string[];
        agenda: string[];
        resources?: string[];
    };
}

interface TeamData {
    id: number;
    name: string;
    members: Array<{
        user_id: number;
        role: TeamRole;
    }>;
}

interface Task {
    id: number;
    title: string;
    team_ref_number: string;
}

interface DailyStandupPageProps {
    teamId: number;
    meetingId: number;
    currentUserId: number;
    userRole: TeamRole;
    hideHeader?: boolean;
    onSaveStatusChange?: (saving: boolean, saved: Date | null) => void;
    meeting: MeetingAPIResponse;
    teamData: TeamData;
    tasks: Task[];
    onUpdate: () => void;
}

export function DailyStandupPage({
    teamId,
    meetingId,
    currentUserId,
    userRole,
    hideHeader,
    onSaveStatusChange,
    meeting: initialMeeting,
    teamData,
    tasks,
    onUpdate
}: DailyStandupPageProps) {
    const [meeting, setMeeting] = useState<MeetingAPIResponse>(initialMeeting);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState(meeting.description || '');
    const [isEditingResources, setIsEditingResources] = useState(false);
    const [editedResources, setEditedResources] = useState(meeting.settings?.resources?.join('\n') || '');
    const [isEditingAgenda, setIsEditingAgenda] = useState(false);
    const [editedAgenda, setEditedAgenda] = useState(meeting.settings?.agenda?.join('\n') || '');

    const handleSaveStatusChange = useCallback((saving: boolean, saved: Date | null) => {
        setIsSaving(saving);
        if (saved) setLastSaved(saved);
        onSaveStatusChange?.(saving, saved);
    }, [onSaveStatusChange]);

    const handleDescriptionEdit = async () => {
        if (isEditingDescription) {
            try {
                await meetingApi.updateMeeting(teamId, meetingId, {
                    description: editedDescription
                });
                setMeeting(prev => ({
                    ...prev,
                    description: editedDescription
                }));
                setIsEditingDescription(false);
                toast({
                    title: "Success",
                    description: "Meeting description updated",
                });
                onUpdate();
            } catch (error) {
                console.error('[MeetingNotes] Failed to update description:', error);
                toast({
                    title: "Error",
                    description: "Failed to update description",
                    variant: "destructive"
                });
            }
        } else {
            setEditedDescription(meeting.description || '');
            setIsEditingDescription(true);
        }
    };

    const handleResourcesEdit = async () => {
        if (isEditingResources) {
            try {
                // Split by newlines and filter out empty lines
                const resourcesList = editedResources
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                const updatedSettings = {
                    ...(meeting.settings || {}),
                    goals: meeting.settings?.goals || [],
                    agenda: meeting.settings?.agenda || [],
                    resources: resourcesList
                };

                await meetingApi.updateMeeting(teamId, meetingId, {
                    settings: updatedSettings
                });

                setMeeting(prev => ({
                    ...prev,
                    settings: updatedSettings
                }));

                setIsEditingResources(false);
                toast({
                    title: "Success",
                    description: "Meeting resources updated",
                });
                onUpdate();
            } catch (error) {
                console.error('[MeetingNotes] Failed to update resources:', error);
                toast({
                    title: "Error",
                    description: "Failed to update resources",
                    variant: "destructive"
                });
            }
        } else {
            setEditedResources(meeting.settings?.resources?.join('\n') || '');
            setIsEditingResources(true);
        }
    };

    const handleAgendaEdit = async () => {
        if (isEditingAgenda) {
            try {
                // Split by newlines and filter out empty lines
                const agendaList = editedAgenda
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                const updatedSettings = {
                    ...(meeting.settings || {}),
                    goals: meeting.settings?.goals || [],
                    agenda: agendaList,
                    resources: meeting.settings?.resources || []
                };

                await meetingApi.updateMeeting(teamId, meetingId, {
                    settings: updatedSettings
                });

                setMeeting(prev => ({
                    ...prev,
                    settings: updatedSettings
                }));

                setIsEditingAgenda(false);
                toast({
                    title: "Success",
                    description: "Meeting agenda updated",
                });
                onUpdate();
            } catch (error) {
                console.error('[MeetingNotes] Failed to update agenda:', error);
                toast({
                    title: "Error",
                    description: "Failed to update agenda",
                    variant: "destructive"
                });
            }
        } else {
            setEditedAgenda(meeting.settings?.agenda?.join('\n') || '');
            setIsEditingAgenda(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
            {!hideHeader && (
                <MeetingHeader
                    teamId={String(teamId)}
                    teamName={teamData.name}
                    meetingId={String(meetingId)}
                    title={meeting.title}
                    durationMinutes={meeting.duration_minutes}
                    participantCount={meeting.participants.length}
                    lastSaved={lastSaved}
                    isSaving={isSaving}
                    participants={meeting.participants}
                    onCreateMeeting={() => {/* handle create meeting */ }}
                    canEdit={userRole === 'admin' || userRole === 'meeting_manager'}
                    onUpdate={onUpdate}
                />
            )}

            {/* Main Content - Keep max-width for content readability */}
            <div className="flex-1 w-full">
                <div className="max-w-[2000px] mx-auto px-6 py-6">
                    {/* Goals, Agenda, and Description Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Meeting Description */}
                        <Card className="bg-white">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium flex items-center text-gray-900">
                                        <Info className="h-4 w-4 mr-2 text-blue-600" />
                                        Meeting Description
                                    </h3>
                                    {(userRole === 'meeting_manager' || userRole === 'admin') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDescriptionEdit}
                                            className="h-8 px-2 text-gray-500 hover:text-gray-900"
                                        >
                                            {isEditingDescription ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Edit2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {isEditingDescription ? (
                                        <Textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            placeholder="Add a description..."
                                            className="min-h-[100px] text-sm"
                                        />
                                    ) : meeting?.description ? (
                                        <p className="text-sm text-gray-600">{meeting.description}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No description available</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Meeting Resources */}
                        <Card className="bg-white">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium flex items-center text-gray-900">
                                        <Link2 className="h-4 w-4 mr-2 text-blue-600" />
                                        Resources & Links
                                    </h3>
                                    {(userRole === 'meeting_manager' || userRole === 'admin') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleResourcesEdit}
                                            className="h-8 px-2 text-gray-500 hover:text-gray-900"
                                        >
                                            {isEditingResources ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Edit2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {isEditingResources ? (
                                        <Textarea
                                            value={editedResources}
                                            onChange={(e) => setEditedResources(e.target.value)}
                                            placeholder="Add resources (one per line)..."
                                            className="min-h-[100px] text-sm"
                                        />
                                    ) : meeting?.settings?.resources?.length ? (
                                        meeting.settings.resources.map((resource: string, index: number) => (
                                            <p key={index} className="text-sm text-gray-600 flex items-start">
                                                <span className="mr-2">•</span>
                                                <a
                                                    href={resource}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-all"
                                                >
                                                    {resource}
                                                </a>
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No resources added</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Meeting Agenda */}
                        <Card className="bg-white">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium flex items-center text-gray-900">
                                        <ListTodo className="h-4 w-4 mr-2 text-blue-600" />
                                        Meeting Agenda
                                    </h3>
                                    {(userRole === 'meeting_manager' || userRole === 'admin') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAgendaEdit}
                                            className="h-8 px-2 text-gray-500 hover:text-gray-900"
                                        >
                                            {isEditingAgenda ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Edit2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {isEditingAgenda ? (
                                        <Textarea
                                            value={editedAgenda}
                                            onChange={(e) => setEditedAgenda(e.target.value)}
                                            placeholder="Add agenda items (one per line)..."
                                            className="min-h-[100px] text-sm"
                                        />
                                    ) : meeting.settings?.agenda?.length ? (
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
                                onSaveStatusChange={handleSaveStatusChange}
                                tasks={tasks}
                                notes={meeting.notes}
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
                onParticipantsUpdate={onUpdate}
            />
        </div>
    );
}
