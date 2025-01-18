'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    Users,
    ArrowRight,
} from 'lucide-react';
import { meetingApi } from '@/services/meetingApi';
import { Meeting, MeetingType } from '@/lib/types/meeting';
import { format, parseISO } from 'date-fns';

interface MeetingListProps {
    teamId: number;
}

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
    [MeetingType.STANDUP]: 'Daily Standup',
    [MeetingType.PLANNING]: 'Sprint Planning',
    [MeetingType.RETRO]: 'Sprint Retrospective',
    [MeetingType.OTHER]: 'Other Meeting'
};

export function MeetingList({ teamId }: MeetingListProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const fetchedMeetings = await meetingApi.listMeetings(parseInt(teamId));
                setMeetings(fetchedMeetings);
            } catch (error) {
                console.error('Failed to fetch meetings:', error);
                setError('Failed to load meetings');
            } finally {
                setLoading(false);
            }
        };

        fetchMeetings();
    }, [teamId]);

    if (loading) {
        return <div className="text-center">Loading meetings...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'PPP');
        } catch (error) {
            console.error('Date parsing error:', dateString, error);
            return 'Invalid date';
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes} minutes`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours} hour${hours > 1 ? 's' : ''}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
                <Card
                    key={meeting.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/${teamId}/meetings/${meeting.id}`)}
                >
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {meeting.title || MEETING_TYPE_LABELS[meeting.type]}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(meeting.start_time)}
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {formatDuration(meeting.duration_minutes)}
                            </div>
                            <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {meeting.participants?.length || 0} participants
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="mt-4 w-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/${teamId}/meetings/${meeting.id}`);
                            }}
                        >
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            ))}
            {meetings.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                    No meetings scheduled
                </div>
            )}
        </div>
    );
} 