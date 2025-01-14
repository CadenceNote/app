import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Participant } from "@/lib/types/meeting";
import { TeamMember } from "@/lib/types/team";
import { meetingApi } from '@/services/meetingApi';
import { teamApi } from '@/services/teamApi';
import { useToast } from '@/hooks/use-toast';

interface MeetingParticipantsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: number;
    meetingId: number;
    currentParticipants: Participant[];
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
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<Set<number>>(
        new Set(currentParticipants.map(p => p.id))
    );
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            fetchTeamMembers();
        }
    }, [open, teamId]);

    const fetchTeamMembers = async () => {
        try {
            const team = await teamApi.getTeam(teamId);
            const members = team.members?.map(member => ({
                id: member.user_id,
                name: member.user.full_name,
                role: member.role
            })) || [];
            setTeamMembers(members);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
            toast({
                title: "Error",
                description: "Failed to load team members",
                variant: "destructive"
            });
        }
    };

    const handleSave = async () => {
        try {
            await meetingApi.updateParticipants(
                teamId,
                meetingId,
                { participant_ids: Array.from(selectedMembers) }
            );
            onParticipantsUpdate();
            onOpenChange(false);
            toast({
                title: "Success",
                description: "Participants updated successfully"
            });
        } catch (error) {
            console.error('Failed to update participants:', error);
            toast({
                title: "Error",
                description: "Failed to update participants",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Participants</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`member-${member.id}`}
                                checked={selectedMembers.has(member.id)}
                                onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedMembers);
                                    if (checked) {
                                        newSelected.add(member.id);
                                    } else {
                                        newSelected.delete(member.id);
                                    }
                                    setSelectedMembers(newSelected);
                                }}
                            />
                            <label
                                htmlFor={`member-${member.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {member.name}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 