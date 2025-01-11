// app/dashboard/[teamId]/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Clock,
    Users,
    ChevronLeft,
    ChevronRight,
    Plus,
} from 'lucide-react';
import { TaskList } from '@/components/tasks/TaskList';

// Mock data for meetings
const mockMeetings = [
    {
        id: 1,
        type: "Daily Standup",
        date: "2025-01-15",
        time: "10:00 AM",
        duration: "15 minutes",
        participants: 5,
        status: "upcoming"
    },
    {
        id: 2,
        type: "Sprint Planning",
        date: "2025-01-14",
        time: "2:00 PM",
        duration: "1 hour",
        participants: 8,
        status: "upcoming"
    },
    {
        id: 3,
        type: "Daily Standup",
        date: "2025-01-11",
        time: "10:00 AM",
        duration: "15 minutes",
        participants: 5,
        status: "past"
    },
    {
        id: 4,
        type: "Sprint Review",
        date: "2025-01-10",
        time: "3:00 PM",
        duration: "45 minutes",
        participants: 7,
        status: "past"
    },
    {
        id: 5,
        type: "Daily Standup",
        date: "2025-01-09",
        time: "10:00 AM",
        duration: "15 minutes",
        participants: 6,
        status: "past"
    }
];

export default function TeamDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.teamId as string;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollMeetings = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            const targetScroll = scrollContainerRef.current.scrollLeft +
                (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Frontend Team</h1>
                <p className="text-gray-600">Team dashboard and overview</p>
            </div>

            {/* Meetings Timeline Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Team Meetings</h2>
                    <Button onClick={() => router.push(`/dashboard/${teamId}/meetings/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Meeting
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scrollMeetings('left')}
                            className="rounded-full bg-white shadow-lg"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scrollMeetings('right')}
                            className="rounded-full bg-white shadow-lg"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto flex gap-4 px-12 pb-4 scrollbar-hide"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {mockMeetings.map((meeting) => (
                            <Card
                                key={meeting.id}
                                className={`flex-shrink-0 w-[300px] cursor-pointer hover:shadow-md transition-shadow
                  ${meeting.status === 'upcoming' ? 'border-blue-200 bg-blue-50' : ''}`}
                                onClick={() => router.push(`/dashboard/${teamId}/meetings/${meeting.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-medium">{meeting.type}</h3>
                                            <div className="text-sm text-gray-600">{meeting.time}</div>
                                        </div>
                                        {meeting.status === 'upcoming' && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                Upcoming
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {meeting.date}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2" />
                                            {meeting.duration}
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-2" />
                                            {meeting.participants} participants
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Team Tasks</h2>
                    <Button onClick={() => router.push(`/dashboard/${teamId}/tasks/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                </div>
                <TaskList teamId={teamId} />
            </div>
        </div>
    );
}