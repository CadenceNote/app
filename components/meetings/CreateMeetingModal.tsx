'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { meetingApi } from '@/services/meetingApi';
import { MeetingType } from '@/lib/types/meeting';

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
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                start_time: `${formData.date}T${formData.time}:00Z`,
                duration_minutes: formData.duration_minutes,
                is_recurring: formData.is_recurring,
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
        } catch (error: any) {
            console.error('Meeting creation error:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create meeting",
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