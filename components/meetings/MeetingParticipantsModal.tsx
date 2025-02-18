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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { TeamRole } from '@/lib/types/team';

interface MeetingParticipant {
    id: string;
    email: string;
    full_name: string;
    role?: TeamRole;
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
    const [searchQuery, setSearchQuery] = useState('');
    const [teamMembers, setTeamMembers] = useState<MeetingParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Load team members when modal opens
    useEffect(() => {
        if (open) {
            loadTeamMembers();
        }
    }, [open, teamId]);

    // Reset selected participants when currentParticipants changes
    useEffect(() => {
        setSelectedParticipants(currentParticipants);
    }, [currentParticipants]);

    const loadTeamMembers = async () => {
        try {
            setIsLoading(true);
            const response = await meetingApi.searchUsers(teamId, '');
            setTeamMembers(response.users.map(user => ({
                id: user.id,
                email: user.email,
                full_name: user.name,
                role: 'member' as TeamRole
            })));
        } catch (error) {
            console.error('Failed to load team members:', error);
            toast({
                title: "Error",
                description: "Failed to load team members",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleParticipantToggle = (participant: MeetingParticipant) => {
        setSelectedParticipants(prev => {
            const isSelected = prev.some(p => p.id === participant.id);
            if (isSelected) {
                return prev.filter(p => p.id !== participant.id);
            } else {
                return [...prev, participant];
            }
        });
    };

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

    const filteredMembers = teamMembers.filter(member =>
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Participants</DialogTitle>
                    <DialogDescription>
                        Add or remove participants from this meeting.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search team members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Team members list */}
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                                Loading team members...
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                                No team members found
                            </div>
                        ) : (
                            filteredMembers.map((member) => {
                                const isSelected = selectedParticipants.some(p => p.id === member.id);
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => handleParticipantToggle(member)}
                                            id={`member-${member.id}`}
                                        />
                                        <label
                                            htmlFor={`member-${member.id}`}
                                            className="flex items-center space-x-3 flex-1 cursor-pointer"
                                        >
                                            <UserAvatar
                                                name={member.full_name}
                                                className="h-8 w-8"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {member.full_name}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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