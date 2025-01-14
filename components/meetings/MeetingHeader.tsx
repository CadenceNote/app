import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import Link from 'next/link';
interface MeetingHeaderProps {
    teamId: string;
    meetingId: string;
    onCreateMeeting: () => void;
}

export function MeetingHeader({ teamId, meetingId, onCreateMeeting }: MeetingHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold"> <Link className="text-blue-500 hover:text-blue-600 " href={`/dashboard/${teamId}`}>Team {teamId}</Link> {'>'} Meeting {meetingId ? `#${meetingId}` : ''}  </h1>
                <p className="text-gray-600">Manage and view team meeting notes</p>
            </div>
            <Button onClick={onCreateMeeting}>
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
            </Button>
        </div>
    );
}