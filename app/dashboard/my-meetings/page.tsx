'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from 'lucide-react';
import { meetingApi } from '@/services/meetingApi';
import { format } from 'date-fns';

interface Meeting {
    id: number;
    title: string;
    start_time: string;
    duration_minutes: number;
    type: string;
}

export default function MyMeetingsPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                // For now, we'll just get meetings from the first team
                // TODO: Get meetings across all teams
                const teamMeetings = await meetingApi.listMeetings(1);
                setMeetings(teamMeetings);
            } catch (error) {
                console.error('Failed to fetch meetings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMeetings();
    }, []);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">My Meetings</h1>

            <div className="grid gap-4">
                {meetings.length === 0 ? (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-center">No meetings scheduled</p>
                        </CardContent>
                    </Card>
                ) : (
                    meetings.map((meeting) => (
                        <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>{meeting.title}</span>
                                    <span className="text-sm text-gray-500 font-normal">
                                        {meeting.type}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(meeting.start_time), 'MMM d, yyyy - h:mm a')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {meeting.duration_minutes} minutes
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
} 