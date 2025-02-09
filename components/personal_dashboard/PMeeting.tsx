import { useState } from "react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"
import { Plus, Calendar as CalendarIcon, Clock, Users, ArrowRight, MoreVertical, Trash2, UserPlus } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Meeting as APIMeeting, MeetingType } from "@/lib/types/meeting"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { meetingApi } from '@/services/meetingApi'
import { UserAvatar } from "@/components/common/UserAvatar"
import { Card } from "../ui/card"
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

// Use the API Meeting type directly
type Meeting = APIMeeting;

interface Team {
    id: number;
    name: string;
}

interface PMeetingProps {
    meetings: Meeting[];
    teams: Team[];
    onMeetingUpdate: (meetings: Meeting[]) => void;
}

// Update the calendar popover style
const calendarPopoverStyle: React.CSSProperties = {
    zIndex: 99999999,
    position: 'relative'
};

export default function PMeeting({ meetings, teams, onMeetingUpdate }: PMeetingProps) {
    const router = useRouter();
    const [selectedDisplayTeam, setSelectedDisplayTeam] = useState<string>("all");
    const [selectedCreateTeam, setSelectedCreateTeam] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>("09:00");
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [selectedMeetingForDetail, setSelectedMeetingForDetail] = useState<Meeting | null>(null);
    const { toast } = useToast();

    // Filter meetings based on selected team
    const filteredMeetings = selectedDisplayTeam === "all"
        ? meetings
        : meetings.filter(meeting => meeting.team_id === Number(selectedDisplayTeam));

    // Group meetings by time
    const now = new Date();
    const groupedMeetings = {
        current: filteredMeetings.filter(m => {
            const meetingStart = parseISO(m.start_time);
            const meetingEnd = new Date(meetingStart.getTime() + m.duration_minutes * 60000);
            return isAfter(meetingEnd, now) && !isAfter(meetingStart, now);
        }),
        today: filteredMeetings.filter(m => isToday(parseISO(m.start_time)) && isAfter(parseISO(m.start_time), now)),
        tomorrow: filteredMeetings.filter(m => isTomorrow(parseISO(m.start_time))),
        thisWeek: filteredMeetings.filter(m => isThisWeek(parseISO(m.start_time)) && !isToday(parseISO(m.start_time)) && !isTomorrow(parseISO(m.start_time))),
        upcoming: filteredMeetings.filter(m => {
            const meetingDate = parseISO(m.start_time);
            return isAfter(meetingDate, now) && !isToday(meetingDate) && !isTomorrow(meetingDate) && !isThisWeek(meetingDate);
        })
    };

    const handleCreateModalOpen = () => {
        if (selectedDisplayTeam === "all") {
            // If "All Teams" is selected, use the first team as default
            setSelectedCreateTeam(teams[0]?.id || null);
        } else {
            setSelectedCreateTeam(Number(selectedDisplayTeam));
        }
        setIsCreateModalOpen(true);
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setSelectedCreateTeam(null);
        setSelectedDate(undefined);
        setSelectedTime("09:00");
        setSelectedParticipants([]);
    };

    const addMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedCreateTeam || !selectedDate) return;

        const formData = new FormData(e.currentTarget);
        const startTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`;

        try {
            const createdMeeting = await meetingApi.createMeeting(selectedCreateTeam, {
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                start_time: startTime,
                duration_minutes: parseInt(formData.get("duration") as string),
                participant_ids: selectedParticipants,
                type: MeetingType.OTHER
            });

            // Update meetings through the parent component
            onMeetingUpdate([...meetings, createdMeeting]);
            handleCreateModalClose();
            toast({
                title: "Success",
                description: "Meeting scheduled successfully"
            });

            // Navigate to the newly created meeting
            router.push(`/dashboard/${selectedCreateTeam}/meetings/${createdMeeting.id}`);
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
        const teamId = Number(selectedDisplayTeam);
        if (!teamId) return;

        try {
            await meetingApi.updateMeeting(teamId, meetingId, {
                status: 'CANCELLED'
            });

            // Update through parent component
            const updatedMeetings = meetings.filter(m => m.id !== meetingId);
            onMeetingUpdate(updatedMeetings);

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

    const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
        <Card
            className="p-4 mb-3 hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-l-4 border-l-indigo-500 group"
            onClick={() => setSelectedMeetingForDetail(meeting)}
        >
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg group flex items-center">
                            {meeting.title}
                            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMeeting(meeting);
                                        setIsParticipantsModalOpen(true);
                                    }}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Manage Participants
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-600"
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(parseISO(meeting.start_time), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(parseISO(meeting.start_time), 'h:mm a')}
                            <span className="ml-1">({meeting.duration_minutes} min)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="flex -space-x-2">
                            {meeting.participants.slice(0, 3).map((participant, i) => (
                                <UserAvatar
                                    key={i}
                                    userId={participant.id}
                                    name={participant.full_name}
                                    className="h-6 w-6 border-2 border-background"
                                />
                            ))}
                            {meeting.participants.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                    +{meeting.participants.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {meeting.description && (
                    <div className="text-sm text-muted-foreground max-w-[30%] truncate">
                        {meeting.description}
                    </div>
                )}
            </div>
        </Card>
    );

    const TimelineSection = ({ title, meetings }: { title: string, meetings: Meeting[] }) => (
        meetings.length > 0 ? (
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
                <div className="space-y-3">
                    {meetings.map(meeting => (
                        <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                </div>
            </div>
        ) : null
    );

    if (teams.length === 0) {
        return (
            <EmptyState
                title="Welcome to Meetings"
                description="Join or create your first team to start scheduling meetings"
                action={
                    <Button onClick={() => router.push("/teams")}>
                        Join or Create Team
                    </Button>
                }
            />
        );
    }

    return (
        <div className="relative min-h-[200px]">
            <div className="relative">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Meetings</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {filteredMeetings.length} upcoming meetings
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select
                            value={selectedDisplayTeam}
                            onValueChange={setSelectedDisplayTeam}
                        >
                            <SelectTrigger className="w-[200px] hover:cursor-pointer">
                                <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Teams</SelectItem>
                                {teams.map((team) => (
                                    <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleCreateModalOpen}
                            disabled={teams.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                        </Button>
                    </div>
                </div>

                <Sheet open={isCreateModalOpen} onOpenChange={handleCreateModalClose}>
                    <SheetContent className="sm:max-w-[540px]">
                        <SheetHeader>
                            <SheetTitle>Schedule New Meeting</SheetTitle>
                            <SheetDescription>Fill in the details to schedule a new meeting.</SheetDescription>
                        </SheetHeader>
                        <form onSubmit={addMeeting} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="team">Team</Label>
                                <Select
                                    value={selectedCreateTeam?.toString() || ''}
                                    onValueChange={(value) => setSelectedCreateTeam(Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.map((team) => (
                                            <SelectItem key={team.id} value={team.id.toString()}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" />
                            </div>
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
                                            {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                        side="bottom"
                                        sideOffset={4}
                                        style={calendarPopoverStyle}
                                    >
                                        <div className="bg-white rounded-md shadow-lg">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    setIsDatePopoverOpen(false);
                                                }}
                                                initialFocus
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    name="time"
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input id="duration" name="duration" type="number" min="15" step="15" defaultValue="30" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Participants</Label>
                                {selectedCreateTeam ? (
                                    <UserCombobox
                                        teamId={selectedCreateTeam}
                                        selectedUsers={selectedParticipants}
                                        onSelectionChange={setSelectedParticipants}
                                        placeholder="Select participants"
                                    />
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        Please select a team first
                                    </div>
                                )}
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!selectedCreateTeam || !selectedDate}>
                                Schedule Meeting
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>

                <div className="space-y-6">
                    {/* Currently Happening */}
                    {groupedMeetings.current.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center">
                                <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
                                Happening Now
                            </h3>
                            <div className="space-y-3">
                                {groupedMeetings.current.map(meeting => (
                                    <MeetingCard key={meeting.id} meeting={meeting} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline Sections */}
                    <TimelineSection title="Today" meetings={groupedMeetings.today} />
                    <TimelineSection title="Tomorrow" meetings={groupedMeetings.tomorrow} />
                    <TimelineSection title="This Week" meetings={groupedMeetings.thisWeek} />
                    <TimelineSection title="Later" meetings={groupedMeetings.upcoming} />

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
                                    <Button onClick={handleCreateModalOpen} disabled={selectedDisplayTeam === "all"}>
                                        <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                                    </Button>
                                }
                            />
                        )}
                </div>
            </div>

            {selectedMeeting && (
                <MeetingParticipantsModal
                    open={isParticipantsModalOpen}
                    onOpenChange={setIsParticipantsModalOpen}
                    teamId={Number(selectedDisplayTeam)}
                    meetingId={selectedMeeting.id}
                    currentParticipants={selectedMeeting.participants}
                    onParticipantsUpdate={async () => {
                        if (selectedDisplayTeam) {
                            const updatedMeetings = await meetingApi.listMeetings(Number(selectedDisplayTeam));
                            onMeetingUpdate(updatedMeetings);
                        }
                    }}
                />
            )}

            <MeetingDetail
                isOpen={!!selectedMeetingForDetail}
                onClose={() => setSelectedMeetingForDetail(null)}
                meeting={selectedMeetingForDetail || undefined}
                teamId={selectedMeetingForDetail?.team_id || 0}
                onMeetingUpdate={async () => {
                    // Refresh meetings for the specific team or all teams
                    if (selectedDisplayTeam === "all") {
                        // If viewing all teams, refresh all meetings
                        const allMeetings = await Promise.all(
                            teams.map(team => meetingApi.listMeetings(team.id))
                        );
                        onMeetingUpdate(allMeetings.flat());
                    } else {
                        // If viewing a specific team, only refresh that team's meetings
                        const updatedMeetings = await meetingApi.listMeetings(Number(selectedDisplayTeam));
                        onMeetingUpdate(updatedMeetings);
                    }
                }}
            />
        </div>
    );
}