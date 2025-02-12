import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { Meeting, MeetingType } from '@/lib/types/meeting';
import { meetingApi } from '@/services/meetingApi';
import { toast, useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserAvatar } from "@/components/common/UserAvatar";
import { Label } from "@/components/ui/label";
import { UserCombobox } from "@/components/common/UserCombobox";
import { useRouter } from "next/navigation";
import { Edit, Users, Clock, Calendar as CalendarIcon, ChevronDown, ChevronRight, Target, ListOrdered, Link2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface MeetingDetailProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | undefined;
    teamId: number;
    onMeetingUpdate?: (meeting: Meeting) => void;
}

interface DetailFieldProps {
    label: string;
    value: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, onClick, className = "" }) => (
    <div className={`relative py-2 ${className}`}>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="mt-1">{value}</div>
    </div>
);

interface MeetingSettings {
    goals: string[];
    agenda: string[];
    resources: string[];
}

interface MeetingData extends Meeting {
    created_by?: {
        id: string;
        email: string;
        full_name?: string;
    };
    created_at?: string;
    updated_at?: string;
    settings: MeetingSettings;
}

const defaultFormData = {
    title: '',
    description: '',
    type: MeetingType.OTHER,
    start_time: '',
    duration_minutes: 30,
    participant_ids: [] as string[],
    settings: {
        goals: [] as string[],
        agenda: [] as string[],
        resources: [] as string[]
    } as MeetingSettings
};

const calendarPopoverStyle: React.CSSProperties = {
    zIndex: 99999,
    position: 'relative'
};

// Add safe date formatting helper
const formatDateSafely = (dateString: string | undefined | null, formatString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return format(date, formatString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

// Add type for mutation input
interface UpdateMeetingInput {
    teamId: number;
    meetingId: number;
    data: Partial<Meeting>;
}

interface UpdateParticipantsInput {
    teamId: number;
    meetingId: number;
    participantIds: string[];
}

export function MeetingDetail({ isOpen, onClose, meeting, teamId, onMeetingUpdate }: MeetingDetailProps) {
    const router = useRouter();
    const [formData, setFormData] = useState(defaultFormData);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState("09:00");
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const { toast } = useToast();

    // Use SWR to manage meeting data
    const { data: currentMeeting, mutate: mutateMeeting } = useSWR(
        isOpen && meeting && teamId ? `meetings/${teamId}/${meeting.id}` : null,
        () => {
            if (!meeting || !teamId) return null;
            return meetingApi.getMeeting(teamId, meeting.id);
        }
    );

    // Update meeting function
    const updateMeeting = async ({ teamId, meetingId, data }: UpdateMeetingInput) => {
        if (!currentMeeting) return;

        try {
            // Optimistically update the UI
            await mutate(
                `meetings/${teamId}/${meetingId}`,
                { ...currentMeeting, ...data },
                false
            );

            // Make the API call
            await meetingApi.updateMeeting(teamId, meetingId, data);
            const updatedMeeting = await meetingApi.getMeeting(teamId, meetingId);

            // Update all related data
            await Promise.all([
                mutate(`meetings/${teamId}/${meetingId}`, updatedMeeting),
                mutate(`meetings/${teamId}`),
            ]);

            if (onMeetingUpdate) {
                onMeetingUpdate(updatedMeeting);
            }

            return updatedMeeting;
        } catch (error) {
            console.error('Failed to update meeting:', error);
            toast({
                title: "Error",
                description: "Failed to update meeting. Please try again.",
                variant: "destructive"
            });
            // Revalidate on error to ensure we have the correct data
            await mutate(`meetings/${teamId}/${meetingId}`);
            throw error;
        }
    };

    // Update participants function
    const updateParticipants = async ({ teamId, meetingId, participantIds }: UpdateParticipantsInput) => {
        if (!currentMeeting) return;

        try {
            // Optimistically update the UI
            await mutate(
                `meetings/${teamId}/${meetingId}`,
                {
                    ...currentMeeting,
                    participants: participantIds.map(id => ({
                        id,
                        email: '',
                        full_name: ''
                    }))
                },
                false
            );

            // Make the API call
            await meetingApi.updateParticipants(teamId, meetingId, participantIds);

            // Update all related data
            await Promise.all([
                mutate(`meetings/${teamId}/${meetingId}`),
                mutate(`meetings/${teamId}`)
            ]);
        } catch (error) {
            console.error('Failed to update participants:', error);
            toast({
                title: "Error",
                description: "Failed to update participants. Please try again.",
                variant: "destructive"
            });
            // Revalidate on error to ensure we have the correct data
            await mutate(`meetings/${teamId}/${meetingId}`);
            throw error;
        }
    };

    // Reset state when the modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setFormData(defaultFormData);
            setSelectedDate(undefined);
            setSelectedTime("09:00");
            setIsDatePopoverOpen(false);
        } else if (meeting && teamId) {
            // Force revalidate when modal opens
            mutate(`meetings/${teamId}/${meeting.id}`);
        }
    }, [isOpen, meeting, teamId]);

    // Update form data when meeting data changes
    useEffect(() => {
        if (currentMeeting && isOpen) {
            const meetingDate = parseISO(currentMeeting.start_time);
            setFormData({
                title: currentMeeting.title,
                description: currentMeeting.description || '',
                type: currentMeeting.type,
                start_time: currentMeeting.start_time,
                duration_minutes: currentMeeting.duration_minutes,
                participant_ids: currentMeeting.participants.map(p => p.id.toString()),
                settings: {
                    goals: currentMeeting.settings?.goals || [],
                    agenda: currentMeeting.settings?.agenda || [],
                    resources: currentMeeting.settings?.resources || []
                }
            });
            setSelectedDate(meetingDate);
            setSelectedTime(format(meetingDate, 'HH:mm'));
        }
    }, [currentMeeting, isOpen]);

    const handleSubmit = async () => {
        if (!meeting || !selectedDate || !teamId) return;

        try {
            const startTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`;

            // Update meeting details
            await updateMeeting({
                teamId,
                meetingId: meeting.id,
                data: {
                    title: formData.title,
                    description: formData.description,
                    type: formData.type,
                    start_time: startTime,
                    duration_minutes: formData.duration_minutes,
                    settings: {
                        goals: formData.settings.goals || [],
                        agenda: formData.settings.agenda || [],
                        resources: formData.settings.resources || []
                    }
                }
            });

            // Update participants
            if (formData.participant_ids.length > 0) {
                await updateParticipants({
                    teamId,
                    meetingId: meeting.id,
                    participantIds: formData.participant_ids
                });
            }

            setIsEditing(false);
            toast({
                title: "Success",
                description: "Meeting updated successfully"
            });
        } catch (error) {
            console.error('Failed to update meeting:', error);
            toast({
                title: "Error",
                description: "Failed to update meeting. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleJoinMeeting = () => {
        if (!meeting || !teamId) return;
        router.push(`/dashboard/${teamId}/meetings/${meeting.id}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogTitle className="sr-only">
                    {currentMeeting?.title || 'Meeting Details'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View and edit meeting details
                </DialogDescription>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto border-r">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-500">
                                    Meeting #{currentMeeting?.id}
                                </div>
                                <Button
                                    variant="default"
                                    onClick={handleJoinMeeting}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Join Meeting
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                {isEditing ? "Cancel Edit" : "Edit Meeting"}
                            </Button>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="text-xl font-semibold"
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>Date</Label>
                                    <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !selectedDate && "text-muted-foreground"
                                                )}
                                            >
                                                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                            side="bottom"
                                            sideOffset={4}
                                            style={calendarPopoverStyle}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    setIsDatePopoverOpen(false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label>Time</Label>
                                    <Input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Duration (minutes)</Label>
                                    <Input
                                        type="number"
                                        min="15"
                                        step="15"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <Label>Participants</Label>
                                    <UserCombobox
                                        teamId={teamId}
                                        selectedUsers={formData.participant_ids}
                                        onSelectionChange={(userIds) => setFormData(prev => ({ ...prev, participant_ids: userIds }))}
                                        placeholder="Select participants"
                                    />
                                </div>
                                <div className="mt-6 border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-4">Extra Settings</h3>

                                    {/* Goals Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Target className="h-4 w-4" />
                                                <span className="font-medium">Goals</span>
                                            </div>
                                            {(!formData.settings?.goals?.length) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        settings: {
                                                            ...prev.settings,
                                                            goals: ['']
                                                        }
                                                    }))}
                                                    className="text-muted-foreground hover:text-indigo-600"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Goals
                                                </Button>
                                            )}
                                        </div>
                                        {formData.settings?.goals?.length > 0 && (
                                            <Textarea
                                                value={formData.settings.goals?.join('\n') || ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    settings: {
                                                        ...prev.settings,
                                                        goals: e.target.value.split('\n')
                                                    }
                                                }))}
                                                placeholder="Enter meeting goals (one per line)"
                                                className="min-h-[100px] whitespace-pre-wrap"
                                            />
                                        )}
                                    </div>

                                    {/* Agenda Section */}
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <ListOrdered className="h-4 w-4" />
                                                <span className="font-medium">Agenda</span>
                                            </div>
                                            {(!formData.settings?.agenda?.length) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        settings: {
                                                            ...prev.settings,
                                                            agenda: ['']
                                                        }
                                                    }))}
                                                    className="text-muted-foreground hover:text-indigo-600"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Agenda
                                                </Button>
                                            )}
                                        </div>
                                        {formData.settings?.agenda?.length > 0 && (
                                            <Textarea
                                                value={formData.settings.agenda?.join('\n') || ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    settings: {
                                                        ...prev.settings,
                                                        agenda: e.target.value.split('\n')
                                                    }
                                                }))}
                                                placeholder="Enter agenda items (one per line)"
                                                className="min-h-[100px] whitespace-pre-wrap"
                                            />
                                        )}
                                    </div>

                                    {/* Resources Section */}
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Link2 className="h-4 w-4" />
                                                <span className="font-medium">Resources</span>
                                            </div>
                                            {(!formData.settings?.resources?.length) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        settings: {
                                                            ...prev.settings,
                                                            resources: ['']
                                                        }
                                                    }))}
                                                    className="text-muted-foreground hover:text-indigo-600"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Resources
                                                </Button>
                                            )}
                                        </div>
                                        {formData.settings?.resources?.length > 0 && (
                                            <Textarea
                                                value={formData.settings.resources?.join('\n') || ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    settings: {
                                                        ...prev.settings,
                                                        resources: e.target.value.split('\n')
                                                    }
                                                }))}
                                                placeholder="Enter resource URLs (one per line)"
                                                className="min-h-[100px] whitespace-pre-wrap"
                                            />
                                        )}
                                    </div>
                                </div>

                                <Button onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    Save Changes
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-semibold">{currentMeeting?.title}</h2>
                                {currentMeeting?.description && (
                                    <DetailField label="Description" value={<p className="text-muted-foreground">{currentMeeting.description}</p>} />
                                )}
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <DetailField label="Date" value={currentMeeting?.start_time ? formatDateSafely(currentMeeting.start_time, 'PPP') : 'No date set'} />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <DetailField label="Time" value={currentMeeting?.start_time ? formatDateSafely(currentMeeting.start_time, 'h:mm a') : 'No time set'} />
                                        <DetailField label="Duration" value={`${currentMeeting?.duration_minutes || 0} min`} />



                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm font-medium">Participants</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {currentMeeting?.participants.map((participant) => (
                                            <div
                                                key={participant.id}
                                                className="flex items-center gap-2 bg-muted rounded-full px-3 py-1"
                                            >
                                                <UserAvatar
                                                    userId={participant.id.toString()}
                                                    name={participant.full_name}
                                                    className="h-6 w-6"
                                                />
                                                <span className="text-sm">{participant.full_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {(currentMeeting?.settings?.goals?.length > 0 ||
                                    currentMeeting?.settings?.agenda?.length > 0 ||
                                    currentMeeting?.settings?.resources?.length > 0) && (
                                        <div className="border rounded-lg p-4">
                                            <h3 className="text-lg font-semibold mb-4">Extra Settings</h3>

                                            {currentMeeting.settings.goals && currentMeeting.settings.goals.length > 0 && (
                                                <div className="space-y-2 mb-6">
                                                    <div className="flex items-center gap-2 text-indigo-600">
                                                        <Target className="h-4 w-4" />
                                                        <h4 className="font-medium">Goals</h4>
                                                    </div>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {currentMeeting.settings.goals.map((goal, index) => (
                                                            <li key={index} className="text-muted-foreground whitespace-pre-wrap">
                                                                {goal}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {currentMeeting.settings.agenda && currentMeeting.settings.agenda.length > 0 && (
                                                <div className="space-y-2 mb-6">
                                                    <div className="flex items-center gap-2 text-indigo-600">
                                                        <ListOrdered className="h-4 w-4" />
                                                        <h4 className="font-medium">Agenda</h4>
                                                    </div>
                                                    <ol className="list-decimal pl-5 space-y-1">
                                                        {currentMeeting.settings.agenda.map((item, index) => (
                                                            <li key={index} className="text-muted-foreground whitespace-pre-wrap">
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}

                                            {currentMeeting.settings.resources && currentMeeting.settings.resources.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-indigo-600">
                                                        <Link2 className="h-4 w-4" />
                                                        <h4 className="font-medium">Resources</h4>
                                                    </div>
                                                    <ul className="space-y-1 pl-5">
                                                        {currentMeeting.settings.resources.map((url, index) => (
                                                            <li key={index}>
                                                                <a
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline break-all whitespace-pre-wrap"
                                                                >
                                                                    {url}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>


                    {/* Right Column - Additional Details */}
                    <div className="w-80 p-6 overflow-y-auto bg-muted/10">
                        <div className="space-y-6">
                            <DetailField
                                label="Created by"
                                value={
                                    <div className="flex items-center gap-2">
                                        <UserAvatar
                                            userId={currentMeeting?.created_by?.id || ''}
                                            name={currentMeeting?.created_by?.full_name || ''}
                                            className="h-6 w-6"
                                        />
                                        <span>{currentMeeting?.created_by?.full_name}</span>
                                    </div>
                                }
                            />
                            <DetailField
                                label="Created at"
                                value={currentMeeting?.created_at ? formatDateSafely(currentMeeting.created_at, 'PPP p') : 'N/A'}
                            />
                            <DetailField
                                label="Last updated"
                                value={currentMeeting?.updated_at ? formatDateSafely(currentMeeting.updated_at, 'PPP p') : 'N/A'}
                            />
                            <DetailField
                                label="Type"
                                value={currentMeeting?.type}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 