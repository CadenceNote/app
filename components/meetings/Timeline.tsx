'use client';

import { useState, useEffect } from 'react';
import { Meeting, MeetingStatus } from '@/lib/types/meeting';
import { meetingApi } from '@/services/meetingApi';
import { parseISO, format, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TimelineProps {
    teamId: number;
}

interface ApiMeeting extends Omit<Meeting, 'participants'> {
    participants: Array<{
        id: number;
        email: string;
        full_name: string;
    }>;
}

export function Timeline({ teamId }: TimelineProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(startOfDay(new Date()));
    const router = useRouter();

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const fetchedMeetings = await meetingApi.listMeetings(teamId);
                // Map the API response to match our Meeting type
                const mappedMeetings: Meeting[] = (fetchedMeetings as ApiMeeting[]).map(meeting => ({
                    ...meeting,
                    participants: meeting.participants.map(p => ({
                        id: p.id,
                        name: p.full_name,
                        role: 'member' // Default role since it's not provided by the API
                    }))
                }));
                setMeetings(mappedMeetings);
            } catch (error) {
                console.error('Failed to fetch meetings:', error);
                setError('Failed to load meetings');
            } finally {
                setLoading(false);
            }
        };

        fetchMeetings();
    }, [teamId]);

    const timeSlots = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    const getMeetingsForTimeSlot = (day: Date, hour: number) => {
        return meetings.filter(meeting => {
            const meetingDate = parseISO(meeting.start_time);
            const meetingEnd = new Date(meetingDate.getTime() + meeting.duration_minutes * 60000);

            return (
                isAfter(meetingDate, startOfDay(day)) &&
                isBefore(meetingDate, endOfDay(day)) &&
                meetingDate.getHours() <= hour &&
                meetingEnd.getHours() >= hour
            );
        });
    };

    const getStatusColor = (status: MeetingStatus) => {
        switch (status) {
            case MeetingStatus.SCHEDULED:
                return 'bg-blue-100 border-blue-200';
            case MeetingStatus.IN_PROGRESS:
                return 'bg-green-100 border-green-200';
            case MeetingStatus.COMPLETED:
                return 'bg-gray-100 border-gray-200';
            case MeetingStatus.CANCELLED:
                return 'bg-red-100 border-red-200';
            default:
                return 'bg-gray-100 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStartDate(addDays(startDate, -7))}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Week
                </Button>
                <h3 className="text-lg font-semibold">
                    {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStartDate(addDays(startDate, 7))}
                >
                    Next Week
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1">
                        {/* Header */}
                        <div className="sticky left-0 bg-background"></div>
                        {days.map((day, i) => (
                            <div
                                key={i}
                                className="text-center py-2 font-medium"
                            >
                                <div>{format(day, 'EEE')}</div>
                                <div className="text-sm text-muted-foreground">
                                    {format(day, 'MMM d')}
                                </div>
                            </div>
                        ))}

                        {/* Time slots */}
                        {timeSlots.map((hour) => (
                            <>
                                <div
                                    key={`time-${hour}`}
                                    className="sticky left-0 bg-background text-sm py-2 text-right pr-4 text-muted-foreground"
                                >
                                    {format(new Date().setHours(hour, 0), 'ha')}
                                </div>
                                {days.map((day, dayIndex) => (
                                    <div
                                        key={`${hour}-${dayIndex}`}
                                        className="border min-h-[60px] relative group"
                                    >
                                        {getMeetingsForTimeSlot(day, hour).map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                className={`absolute inset-1 p-1 rounded text-xs cursor-pointer
                                                    border ${getStatusColor(meeting.status)}`}
                                                onClick={() => router.push(`/dashboard/${teamId}/meetings/${meeting.id}`)}
                                            >
                                                <div className="font-medium truncate">{meeting.title}</div>
                                                <div className="text-muted-foreground truncate">
                                                    {format(parseISO(meeting.start_time), 'h:mm a')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 