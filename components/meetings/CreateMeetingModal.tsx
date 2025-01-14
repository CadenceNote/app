'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { meetingApi } from '@/services/meetingApi';
import { teamApi } from '@/services/teamApi';
import { MeetingType } from '@/lib/types/meeting';
import { TeamMember } from '@/lib/types/team';
import { cn } from "@/lib/utils";

interface CreateMeetingModalProps {
    open: boolean;
    onClose: () => void;
    teamId: number;
}

// Map of meeting types to display names
const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
    [MeetingType.DAILY]: 'Daily Standup',
    [MeetingType.PLANNING]: 'Sprint Planning',
    [MeetingType.REVIEW]: 'Sprint Review',
    [MeetingType.RETRO]: 'Sprint Retrospective',
    [MeetingType.ADHOC]: 'Ad Hoc Meeting'
};

const DURATION_OPTIONS = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
];

export function CreateMeetingModal({ open, onClose, teamId }: CreateMeetingModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '' as MeetingType,
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration_minutes: 30,
        is_recurring: false,
        participant_ids: [] as number[]
    });
    const [loading, setLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const team = await teamApi.getTeam(teamId);
                setTeamMembers(team.members || []);
                // Set all team members as default participants
                setFormData(prev => ({
                    ...prev,
                    participant_ids: team.members?.map(member => member.user_id) || []
                }));
            } catch (error) {
                console.error('Failed to fetch team members:', error);
                toast({
                    title: "Error",
                    description: "Failed to load team members",
                    variant: "destructive"
                });
            }
        };

        if (open) {
            fetchTeamMembers();
        }
    }, [teamId, open, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create a date object in local time
            const localDate = new Date(`${formData.date}T${formData.time}`);

            // Convert to UTC string and format it
            const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
            const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
            const utcYear = localDate.getUTCFullYear();
            const utcMonth = (localDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const utcDay = localDate.getUTCDate().toString().padStart(2, '0');

            // Format in the exact format the backend expects
            const formattedDateTime = `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}:00Z`;

            const payload = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                start_time: formattedDateTime,
                duration_minutes: formData.duration_minutes,
                participant_ids: formData.participant_ids
            };

            console.log('Creating meeting with payload:', payload);

            const response = await meetingApi.createMeeting(teamId, payload);

            toast({
                title: "Success",
                description: "Meeting created successfully",
            });

            router.refresh();
            onClose();

            if (response && response.id) {
                router.push(`/dashboard/${teamId}/meetings/${response.id}`);
            }
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Meeting creation error:', err);
            toast({
                title: "Error",
                description: err.message || "Failed to create meeting",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Meeting</DialogTitle>
                    <DialogDescription>
                        Schedule a new meeting for your team
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Meeting Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData(prev => ({ ...prev, title: e.target.value }))
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Meeting Type *</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: MeetingType) =>
                                setFormData(prev => ({ ...prev, type: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select meeting type" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MEETING_TYPE_LABELS).map(([type, label]) => (
                                    <SelectItem key={type} value={type}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData(prev => ({ ...prev, description: e.target.value }))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData(prev => ({ ...prev, date: e.target.value }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time *</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) =>
                                    setFormData(prev => ({ ...prev, time: e.target.value }))
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Select
                            value={formData.duration_minutes.toString()}
                            onValueChange={(value) =>
                                setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                {DURATION_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="participants">Participants</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const allUserIds = teamMembers.map(m => m.user_id);
                                    const allSelected = allUserIds.every(id => formData.participant_ids.includes(id));
                                    setFormData(prev => ({
                                        ...prev,
                                        participant_ids: allSelected ? [] : allUserIds
                                    }));
                                }}
                            >
                                {formData.participant_ids.length === teamMembers.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="max-h-[250px] overflow-y-auto">
                                {teamMembers.map((member) => {
                                    const isSelected = formData.participant_ids.includes(member.user_id);
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => {
                                                const newParticipantIds = isSelected
                                                    ? formData.participant_ids.filter(id => id !== member.user_id)
                                                    : [...formData.participant_ids, member.user_id];
                                                setFormData(prev => ({ ...prev, participant_ids: newParticipantIds }));
                                            }}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3",
                                                "cursor-pointer transition-colors duration-150",
                                                "border-b last:border-b-0",
                                                "hover:bg-accent/50",
                                                isSelected && "bg-accent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <UserAvatar
                                                    name={member.user.full_name || member.user.email}
                                                    className="h-8 w-8"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {member.user.full_name || member.user.email}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "flex items-center justify-center w-5 h-5 rounded-full",
                                                "transition-colors duration-150",
                                                isSelected ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formData.participant_ids.length} participants selected
                        </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Meeting"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}