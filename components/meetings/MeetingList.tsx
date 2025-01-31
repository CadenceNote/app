'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    Users,
    MoreVertical,
    Edit,
    Trash2,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    Eye,
} from 'lucide-react';
import { meetingApi } from '@/services/meetingApi';
import { Meeting, MeetingType, MeetingStatus } from '@/lib/types/meeting';
import { format, parseISO, isAfter, formatDistanceToNow, endOfDay, addDays, isBefore } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MeetingListProps {
    teamId: number;
    emptyState?: ReactNode;
}

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
    [MeetingType.STANDUP]: 'Daily Standup',
    [MeetingType.PLANNING]: 'Sprint Planning',
    [MeetingType.RETRO]: 'Sprint Retrospective',
    [MeetingType.OTHER]: 'Other Meeting'
};

const STATUS_COLORS: Record<MeetingStatus, string> = {
    [MeetingStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [MeetingStatus.IN_PROGRESS]: 'bg-green-100 text-green-800',
    [MeetingStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
    [MeetingStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

interface ApiMeeting extends Omit<Meeting, 'participants'> {
    participants: Array<{
        id: number;
        email: string;
        full_name: string;
    }>;
}

export function MeetingList({ teamId, emptyState }: MeetingListProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
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

    const { upcomingMeetings, pastMeetings } = useMemo(() => {
        const now = new Date();
        const upcoming: Meeting[] = [];
        const past: Meeting[] = [];

        meetings.forEach(meeting => {
            const meetingDate = parseISO(meeting.start_time);
            const meetingEndTime = new Date(meetingDate.getTime() + meeting.duration_minutes * 60000);

            if (isAfter(meetingEndTime, now)) {
                // Meeting hasn't ended yet - show in upcoming
                if (meeting.status === MeetingStatus.CANCELLED) {
                    upcoming.push(meeting);
                } else if (isAfter(meetingDate, now)) {
                    // Future meeting
                    upcoming.push({
                        ...meeting,
                        status: MeetingStatus.SCHEDULED
                    });
                } else {
                    // Currently happening
                    upcoming.push({
                        ...meeting,
                        status: MeetingStatus.IN_PROGRESS
                    });
                }
            } else {
                // Meeting has ended
                if (meeting.status === MeetingStatus.CANCELLED) {
                    past.push(meeting);
                } else {
                    past.push({
                        ...meeting,
                        status: MeetingStatus.COMPLETED
                    });
                }
            }
        });

        // Sort upcoming meetings by start time (ascending)
        upcoming.sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
        // Sort past meetings by start time (descending)
        past.sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime());

        return { upcomingMeetings: upcoming, pastMeetings: past };
    }, [meetings]);

    const groupedUpcomingMeetings = useMemo(() => {
        const now = new Date();
        const endOfToday = endOfDay(now);
        const endOfWeek = endOfDay(addDays(now, 7));

        return {
            today: upcomingMeetings.filter(meeting =>
                isBefore(parseISO(meeting.start_time), endOfToday)
            ),
            thisWeek: upcomingMeetings.filter(meeting => {
                const meetingDate = parseISO(meeting.start_time);
                return isAfter(meetingDate, endOfToday) && isBefore(meetingDate, endOfWeek);
            }),
            later: upcomingMeetings.filter(meeting =>
                isAfter(parseISO(meeting.start_time), endOfWeek)
            )
        };
    }, [upcomingMeetings]);

    const handleCancel = async (meeting: Meeting) => {
        try {
            await meetingApi.updateMeeting(teamId, meeting.id, { status: MeetingStatus.CANCELLED });
            setMeetings(prevMeetings =>
                prevMeetings.map(m =>
                    m.id === meeting.id ? { ...m, status: MeetingStatus.CANCELLED } : m
                )
            );
        } catch (error) {
            console.error('Failed to cancel meeting:', error);
            setError('Failed to cancel meeting');
        }
        setDeleteDialogOpen(false);
        setSelectedMeeting(null);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'PPP');
        } catch (error) {
            console.error('Date parsing error:', dateString, error);
            return 'Invalid date';
        }
    };

    const formatDayOfWeek = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'EEEE'); // Monday, Tuesday, etc.
        } catch (error) {
            console.error('Day parsing error:', dateString, error);
            return 'Invalid day';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'p');
        } catch (error) {
            console.error('Time parsing error:', dateString, error);
            return 'Invalid time';
        }
    };

    const formatTimeFromNow = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            console.error('Time from now parsing error:', dateString, error);
            return 'Invalid time';
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours}h`;
    };

    const getStatusColor = (status: MeetingStatus) => {
        const colors = {
            [MeetingStatus.SCHEDULED]: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
            [MeetingStatus.IN_PROGRESS]: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
            [MeetingStatus.COMPLETED]: 'bg-secondary text-secondary-foreground',
            [MeetingStatus.CANCELLED]: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
        };
        return colors[status] || colors[MeetingStatus.SCHEDULED];
    };

    const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
        <Card
            className={`mb-4 hover:shadow-md transition-all duration-200 border-l-4 cursor-pointer
                ${meeting.status === MeetingStatus.CANCELLED ? 'border-l-red-500' :
                    meeting.status === MeetingStatus.COMPLETED ? 'border-l-gray-500' :
                        meeting.status === MeetingStatus.IN_PROGRESS ? 'border-l-green-500' : 'border-l-blue-500'
                }`}
            onClick={() => router.push(`/dashboard/${teamId}/meetings/${meeting.id}`)}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                                {meeting.title}
                            </h3>
                            <Badge variant="outline" className="ml-2">
                                {MEETING_TYPE_LABELS[meeting.type]}
                            </Badge>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(meeting.status)}`}>
                                {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <div className="flex flex-col">
                                    <span>{formatDate(meeting.start_time)}</span>
                                    <span className="text-xs text-gray-500">{formatDayOfWeek(meeting.start_time)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <div className="flex flex-col">
                                    <span>{formatTime(meeting.start_time)} ({formatDuration(meeting.duration_minutes)})</span>
                                    {isAfter(parseISO(meeting.start_time), new Date()) && (
                                        <span className="text-xs text-gray-500">{formatTimeFromNow(meeting.start_time)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent"
                                            onClick={(e) => e.stopPropagation()}>
                                            <Users className="h-4 w-4 mr-2" />
                                            {meeting.participants?.length || 0} participants
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64" align="start">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Participants</h4>
                                            <div className="max-h-48 overflow-y-auto">
                                                {meeting.participants?.map((participant) => (
                                                    <div
                                                        key={participant.id}
                                                        className={cn(
                                                            "flex items-center justify-between py-1",
                                                            participant.id === 6 && "font-medium text-primary" // Replace 6 with actual current user ID
                                                        )}
                                                    >
                                                        <span>{participant.name}</span>
                                                        {participant.id === 6 && <span className="text-xs">(You)</span>} {/* Replace 6 with actual current user ID */}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {meeting.description && (
                                <div className="col-span-2 text-gray-500 mt-2">
                                    {meeting.description}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {meeting.status !== MeetingStatus.CANCELLED && meeting.status !== MeetingStatus.COMPLETED && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/${teamId}/meetings/${meeting.id}/edit`);
                                            }}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMeeting(meeting);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Cancel Meeting
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {(meeting.status === MeetingStatus.CANCELLED || meeting.status === MeetingStatus.COMPLETED) && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/${teamId}/meetings/${meeting.id}`);
                                        }}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 p-4 text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upcoming" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Upcoming ({upcomingMeetings.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Past ({pastMeetings.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                    <div className="space-y-6">
                        {upcomingMeetings.length === 0 ? (
                            emptyState || (
                                <div className="text-center text-gray-500 py-8">
                                    No upcoming meetings scheduled
                                </div>
                            )
                        ) : (
                            <>
                                {groupedUpcomingMeetings.today.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Today</h3>
                                        <div className="space-y-4">
                                            {groupedUpcomingMeetings.today.map((meeting) => (
                                                <MeetingCard key={meeting.id} meeting={meeting} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {groupedUpcomingMeetings.thisWeek.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">This Week</h3>
                                        <div className="space-y-4">
                                            {groupedUpcomingMeetings.thisWeek.map((meeting) => (
                                                <MeetingCard key={meeting.id} meeting={meeting} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {groupedUpcomingMeetings.later.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Later</h3>
                                        <div className="space-y-4">
                                            {groupedUpcomingMeetings.later.map((meeting) => (
                                                <MeetingCard key={meeting.id} meeting={meeting} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="past">
                    <div className="space-y-4">
                        {pastMeetings.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No past meetings
                            </div>
                        ) : (
                            pastMeetings.map((meeting) => (
                                <MeetingCard key={meeting.id} meeting={meeting} />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this meeting? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => selectedMeeting && handleCancel(selectedMeeting)}
                        >
                            Cancel Meeting
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 