import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';

interface CreateMeetingModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreateMeetingModal({ open, onClose }: CreateMeetingModalProps) {
    const [meetingData, setMeetingData] = useState({
        type: '',
        duration: '',
        goal: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle meeting creation
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Meeting</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="type">Meeting Type</Label>
                        <Input
                            id="type"
                            value={meetingData.type}
                            onChange={(e) => setMeetingData(prev => ({ ...prev, type: e.target.value }))}
                            placeholder="Daily Standup"
                        />
                    </div>
                    <div>
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                            id="duration"
                            value={meetingData.duration}
                            onChange={(e) => setMeetingData(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="15 minutes"
                        />
                    </div>
                    <div>
                        <Label htmlFor="goal">Meeting Goal</Label>
                        <Input
                            id="goal"
                            value={meetingData.goal}
                            onChange={(e) => setMeetingData(prev => ({ ...prev, goal: e.target.value }))}
                            placeholder="Daily sync and blockers discussion"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Create Meeting</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}