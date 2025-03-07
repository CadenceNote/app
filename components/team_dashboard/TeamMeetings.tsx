import { useState } from "react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"
import { Plus, Calendar as CalendarIcon, Clock, Users, ArrowRight, MoreVertical, Trash2, UserPlus } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Meeting, MeetingType } from "@/lib/types/meeting"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { UserAvatar } from "@/components/common/UserAvatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { format, isToday, isTomorrow, isThisWeek, isAfter, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { UserCombobox } from "@/components/common/UserCombobox"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { EmptyState } from "../common/EmptyState"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { MeetingParticipantsModal } from "../meetings/MeetingParticipantsModal"
import { MeetingDetail } from "../meetings/MeetingDetail"
import { useTeams } from "@/hooks/useTeams"
import { useMeeting } from "@/hooks/useMeeting"
import { Skeleton } from "../ui/skeleton"
import { ExpandableEventCard } from "../card/expandable-event-card"

// Update the calendar popover style
const calendarPopoverStyle: React.CSSProperties = {
    zIndex: 99999999,
    position: 'relative'
};

interface TeamMeetingsProps {
    teamId: number;
}

export default function TeamMeetings({ teamId }: TeamMeetingsProps) {
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>("09:00");
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [selectedMeetingForDetail, setSelectedMeetingForDetail] = useState<Meeting | null>(null);
    const { toast } = useToast();

    // Use our hooks
    const { teams } = useTeams();
    const {
        meetings,
        createMeeting,
        deleteMeeting,
        isLoadingMeetings
    } = useMeeting(teamId);

    // Show loading state while meetings are being fetched
    if (isLoadingMeetings) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Filter meetings based on time
    const now = new Date();
    const groupedMeetings = {
        current: meetings?.filter(m => {
            const meetingStart = parseISO(m.start_time);
            const meetingEnd = new Date(meetingStart.getTime() + m.duration_minutes * 60000);
            return isAfter(meetingEnd, now) && !isAfter(meetingStart, now);
        }) || [],
        today: meetings?.filter(m => isToday(parseISO(m.start_time)) && isAfter(parseISO(m.start_time), now)) || [],
        tomorrow: meetings?.filter(m => isTomorrow(parseISO(m.start_time))) || [],
        thisWeek: meetings?.filter(m => isThisWeek(parseISO(m.start_time)) && !isToday(parseISO(m.start_time)) && !isTomorrow(parseISO(m.start_time))) || [],
        upcoming: meetings?.filter(m => {
            const meetingDate = parseISO(m.start_time);
            return isAfter(meetingDate, now) && !isToday(meetingDate) && !isTomorrow(meetingDate) && !isThisWeek(meetingDate);
        }) || []
    };

    const handleCreateModalOpen = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setSelectedDate(undefined);
        setSelectedTime("09:00");
        setSelectedParticipants([]);
    };

    const addMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedDate) return;

        const formData = new FormData(e.currentTarget);
        const startTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`;

        try {
            const createdMeeting = await createMeeting({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                start_time: startTime,
                duration_minutes: parseInt(formData.get("duration") as string),
                participant_ids: selectedParticipants,
                type: MeetingType.OTHER
            });

            handleCreateModalClose();
            toast({
                title: "Success",
                description: "Meeting scheduled successfully"
            });

            // Navigate to the newly created meeting
            router.push(`/dashboard/${teamId}/meetings/${createdMeeting.id}`);
        } catch (error) {
            console.error('Error creating meeting:', error);
            toast({
                title: "Error",
                description: "Failed to schedule meeting",
                variant: "destructive"
            });
        }
    };

    const handleDeleteMeeting = async (meetingId: number) => {
        try {
            await deleteMeeting(meetingId);
            toast({
                title: "Success",
                description: "Meeting cancelled successfully"
            });
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            toast({
                title: "Error",
                description: "Failed to cancel meeting",
                variant: "destructive"
            });
        }
    };

    const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
        const team = teams?.find(t => t.id === meeting.team_id);
        const meetingTime = format(parseISO(meeting.start_time), 'h:mm a');
        const meetingDate = format(parseISO(meeting.start_time), 'MMM d, yyyy');

        return (
            <div
                className="relative group rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedMeetingForDetail(meeting)}
            >
                <div className="p-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400 transition-colors">
                                {meeting.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-gray-400">
                                    <CalendarIcon className="h-4 w-4" />
                                    {meetingDate},
                                    <span className="dark:text-gray-300">
                                        {meetingTime}
                                    </span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent dark:hover:bg-gray-700">
                                            <MoreVertical className="h-4 w-4 dark:text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMeeting(meeting);
                                                setIsParticipantsModalOpen(true);
                                            }}
                                            className="dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Manage Participants
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive dark:text-red-400 dark:hover:bg-gray-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMeeting(meeting.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Cancel Meeting
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {team && (
                                <span className="text-sm text-muted-foreground dark:text-gray-400">
                                    {team.name}
                                </span>
                            )}
                            <span className="text-sm text-muted-foreground dark:text-gray-400">
                                • {meeting.duration_minutes} min
                            </span>
                        </div>
                        {meeting.description && (
                            <p className="text-sm text-muted-foreground dark:text-gray-400 line-clamp-2">
                                {meeting.description}
                            </p>
                        )}
                        <div className="pt-3 border-t dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                <div className="flex -space-x-2">
                                    {meeting.participants.slice(0, 3).map((participant, i) => (
                                        <UserAvatar
                                            key={i}
                                            userId={participant.id.toString()}
                                            name={participant.full_name || 'Unknown'}
                                            className="h-6 w-6 border-2 border-background dark:border-gray-800"
                                        />
                                    ))}
                                    {meeting.participants.length > 3 && (
                                        <div className="h-6 w-6 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center text-xs border-2 border-background dark:border-gray-800 dark:text-gray-300">
                                            +{meeting.participants.length - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground dark:text-gray-400 ml-1">
                                    {meeting.participants.length} {meeting.participants.length === 1 ? 'participant' : 'participants'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground dark:text-gray-400">
                                Click to view details
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const TimelineSection = ({ title, meetings }: { title: string, meetings: Meeting[] }) => (
        meetings.length > 0 ? (
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h3>
                <div className="space-y-3">
                    {meetings.map(meeting => (
                        <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                </div>
            </div>
        ) : null
    );

    // Show empty state if no teams are available
    if (!teams?.length) {
        return (
            <EmptyState
                title="Welcome to Meetings"
                description="Join or create your first team to start scheduling meetings"
                action={
                    <Button onClick={() => window.location.href = "/teams"}>
                        Join or Create Team
                    </Button>
                }
            />
        );
    }

    return (
        <Card className="space-y-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle >Team Meetings</CardTitle>
                        <CardDescription className="">
                            Schedule and manage team meetings
                        </CardDescription>
                    </div>
                    <Button onClick={handleCreateModalOpen} className="">
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Meeting
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Current Meetings */}
                <TimelineSection title="In Progress" meetings={groupedMeetings.current} />

                {/* Today's Meetings */}
                <TimelineSection title="Today" meetings={groupedMeetings.today} />

                {/* Tomorrow's Meetings */}
                <TimelineSection title="Tomorrow" meetings={groupedMeetings.tomorrow} />

                {/* This Week's Meetings */}
                <TimelineSection title="This Week" meetings={groupedMeetings.thisWeek} />

                {/* Upcoming Meetings */}
                <TimelineSection title="Upcoming" meetings={groupedMeetings.upcoming} />

                {/* Create Meeting Modal */}
                <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <SheetContent className="sm:max-w-[600px]">
                        <SheetHeader>
                            <SheetTitle>Schedule New Meeting</SheetTitle>
                            <SheetDescription>
                                Fill in the details below to schedule a new team meeting.
                            </SheetDescription>
                        </SheetHeader>
                        <form onSubmit={addMeeting} className="space-y-6 pt-8">
                            <div className="space-y-2">
                                <Label htmlFor="title">Meeting Title</Label>
                                <Input id="title" name="title" placeholder="Enter meeting title" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input id="description" name="description" placeholder="Enter meeting description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !selectedDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                            side="bottom"
                                            sideOffset={4}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    setIsDatePopoverOpen(false);
                                                }}
                                                initialFocus

                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <SelectItem key={i} value={`${String(i).padStart(2, '0')}:00`}>
                                                    {format(new Date().setHours(i, 0), 'h:mm a')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Select name="duration" defaultValue="30">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="90">1.5 hours</SelectItem>
                                        <SelectItem value="120">2 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Participants</Label>
                                <UserCombobox
                                    teamId={teamId}
                                    selectedUsers={selectedParticipants}
                                    onSelectionChange={setSelectedParticipants}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={handleCreateModalClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="">
                                    Schedule Meeting
                                </Button>
                            </div>
                        </form>
                    </SheetContent>
                </Sheet>

                {/* Meeting Detail Modal */}
                {selectedMeetingForDetail && (
                    <MeetingDetail
                        isOpen={!!selectedMeetingForDetail}
                        onClose={() => setSelectedMeetingForDetail(null)}
                        meeting={selectedMeetingForDetail}
                        teamId={teamId}
                    />
                )}

                {/* Participants Management Modal */}
                {selectedMeeting && (
                    <MeetingParticipantsModal
                        isOpen={isParticipantsModalOpen}
                        onClose={() => {
                            setIsParticipantsModalOpen(false);
                            setSelectedMeeting(null);
                        }}
                        meeting={selectedMeeting}
                        teamId={teamId}
                    />
                )}

                {/* Empty State */}
                {groupedMeetings.current.length === 0 &&
                    groupedMeetings.today.length === 0 &&
                    groupedMeetings.tomorrow.length === 0 &&
                    groupedMeetings.thisWeek.length === 0 &&
                    groupedMeetings.upcoming.length === 0 && (
                        <EmptyState
                            title="No upcoming meetings"
                            description="Schedule a meeting to collaborate with your team"
                            action={
                                <Button onClick={handleCreateModalOpen} >
                                    <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                                </Button>
                            }
                        />
                    )}
            </CardContent>
        </Card>
    );
}