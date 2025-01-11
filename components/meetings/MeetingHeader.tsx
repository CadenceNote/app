import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface MeetingHeaderProps {
    teamId: string;
    onCreateMeeting: () => void;
}

export function MeetingHeader({ teamId, onCreateMeeting }: MeetingHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold">Team Meetings</h1>
                <p className="text-gray-600">Manage and view team meeting notes</p>
            </div>
            <Button onClick={onCreateMeeting}>
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
            </Button>
        </div>
    );
}