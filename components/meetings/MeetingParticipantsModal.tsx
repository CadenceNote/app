import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { meetingApi } from '@/services/meetingApi';
import { useToast } from '@/hooks/use-toast';

interface MeetingParticipant {
    id: number;
    email: string;
    full_name: string;
    role?: string;
}

interface MeetingParticipantsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: number;
    meetingId: number;
    currentParticipants: MeetingParticipant[];
    onParticipantsUpdate: () => void;
}

export function MeetingParticipantsModal({
    open,
    onOpenChange,
    teamId,
    meetingId,
    currentParticipants,
    onParticipantsUpdate
}: MeetingParticipantsModalProps) {
    const [selectedParticipants, setSelectedParticipants] = useState<MeetingParticipant[]>(currentParticipants);
    const { toast } = useToast();

    useEffect(() => {
        setSelectedParticipants(currentParticipants);
    }, [currentParticipants]);

    const handleSave = async () => {
        try {
            await meetingApi.updateParticipants(
                teamId,
                meetingId,
                selectedParticipants.map(p => p.id)
            );
            onParticipantsUpdate();
            onOpenChange(false);
            toast({
                title: "Success",
                description: "Meeting participants updated successfully"
            });
        } catch (error) {
            console.error('Failed to update participants:', error);
            toast({
                title: "Error",
                description: "Failed to update meeting participants",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Participants</DialogTitle>
                    <DialogDescription>
                        Add or remove participants from this meeting.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Add participant selection UI here */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 