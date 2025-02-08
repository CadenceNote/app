import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"
import { Plus, Calendar as CalendarIcon, Clock, Users } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Meeting as APIMeeting, MeetingType, MeetingStatus } from "@/lib/types/meeting"
import { teamApi } from '@/services/teamApi'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { meetingApi } from '@/services/meetingApi'
import { UserAvatar } from "@/components/common/UserAvatar"
import { Card } from "../ui/card"
import { format, isToday, isTomorrow, isThisWeek, isAfter, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Use the API Meeting type directly
type Meeting = APIMeeting;

export default function PMeeting() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [teams, setTeams] = useState<{ id: number, name: string }[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Fetch teams and meetings on component mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const userTeams = await teamApi.getUserTeams();
                console.log('Fetched teams:', userTeams);
                setTeams(userTeams);
                if (userTeams.length > 0) {
                    setSelectedTeam(userTeams[0].id);
                    const teamMeetings = await meetingApi.listMeetings(userTeams[0].id);
                    console.log('Fetched meetings:', teamMeetings);
                    setMeetings(teamMeetings);
                } else {
                    console.log('No teams found');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load meetings",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update meetings when team changes
    useEffect(() => {
        const fetchMeetings = async () => {
            if (selectedTeam) {
                setIsLoading(true);
                try {
                    const teamMeetings = await meetingApi.listMeetings(selectedTeam);
                    console.log('Team changed, fetched meetings:', teamMeetings);
                    setMeetings(teamMeetings);
                } catch (error) {
                    console.error('Error fetching meetings:', error);
                    toast({
                        title: "Error",
                        description: "Failed to load meetings",
                        variant: "destructive"
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchMeetings();
    }, [selectedTeam]);

    const addMeeting = async (data: {
        title: string,
        description?: string,
        start_time: string,
        duration_minutes: number,
        participant_ids: string[]
    }) => {
        if (!selectedTeam) return;

        try {
            const createdMeeting = await meetingApi.createMeeting(selectedTeam, {
                ...data,
                type: MeetingType.OTHER
            });
            setMeetings(prev => [...prev, createdMeeting]);
            toast({
                title: "Success",
                description: "Meeting scheduled successfully"
            });
        } catch (error) {
            console.error('Error creating meeting:', error);
            toast({
                title: "Error",
                description: "Failed to schedule meeting",
                variant: "destructive"
            });
        }
    };

    // Group meetings by time
    const now = new Date();
    const groupedMeetings = {
        today: meetings.filter(m => isToday(parseISO(m.start_time))),
        tomorrow: meetings.filter(m => isTomorrow(parseISO(m.start_time))),
        thisWeek: meetings.filter(m => isThisWeek(parseISO(m.start_time)) && !isToday(parseISO(m.start_time)) && !isTomorrow(parseISO(m.start_time))),
        upcoming: meetings.filter(m => {
            const meetingDate = parseISO(m.start_time);
            return isAfter(meetingDate, now);
        }),
        past: meetings.filter(m => {
            const meetingDate = parseISO(m.start_time);
            return !isAfter(meetingDate, now) && !isToday(meetingDate);
        })
    };

    console.log('Current date:', now.toISOString());
    console.log('Meeting dates:', meetings.map(m => ({
        date: m.start_time,
        isAfter: isAfter(parseISO(m.start_time), now),
        isToday: isToday(parseISO(m.start_time)),
        isTomorrow: isTomorrow(parseISO(m.start_time)),
        isThisWeek: isThisWeek(parseISO(m.start_time)),
        isPast: !isAfter(parseISO(m.start_time), now) && !isToday(parseISO(m.start_time))
    })));
    console.log('Grouped meetings:', {
        today: groupedMeetings.today.length,
        tomorrow: groupedMeetings.tomorrow.length,
        thisWeek: groupedMeetings.thisWeek.length,
        upcoming: groupedMeetings.upcoming.length,
        past: groupedMeetings.past.length
    });

    const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
        <Card className="p-4 mb-3 hover:shadow-md transition-shadow relative z-10">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <h3 className="font-medium">TITLE: {meeting.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    <div className="text-sm text-muted-foreground mt-2">
                        {meeting.description}
                    </div>
                )}
            </div>
        </Card>
    );

    const TimelineSection = ({ title, meetings }: { title: string, meetings: Meeting[] }) => (
        meetings.length > 0 ? (
            <div className="mb-8 relative z-10">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <div className="space-y-3">
                    {meetings.map(meeting => (
                        <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                </div>
            </div>
        ) : null
    );
    console.log("Meetings", meetings)
    return (
        <div className="relative min-h-[200px]">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-40 z-0" />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Meetings ({meetings.length} total)</h2>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="z-50">
                            <SheetHeader>
                                <SheetTitle>Schedule New Meeting</SheetTitle>
                                <SheetDescription>Fill in the details to schedule a new meeting.</SheetDescription>
                            </SheetHeader>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!selectedTeam) {
                                        toast({
                                            title: "Error",
                                            description: "Please select a team",
                                            variant: "destructive"
                                        });
                                        return;
                                    }
                                    const formData = new FormData(e.currentTarget);
                                    const startTime = `${formData.get("date")}T${formData.get("time")}:00`;
                                    addMeeting({
                                        title: formData.get("title") as string,
                                        description: formData.get("description") as string,
                                        start_time: startTime,
                                        duration_minutes: parseInt(formData.get("duration") as string),
                                        participant_ids: (formData.get("participants") as string).split(",").map(p => p.trim())
                                    });
                                    e.currentTarget.reset();
                                }}
                                className="space-y-4 mt-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="team">Team</Label>
                                    <Select
                                        value={selectedTeam?.toString() || ''}
                                        onValueChange={(value) => setSelectedTeam(Number(value))}
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
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" name="date" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Time</Label>
                                    <Input id="time" name="time" type="time" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input id="duration" name="duration" type="number" min="15" step="15" defaultValue="30" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="participants">Participant IDs (comma-separated)</Label>
                                    <Input id="participants" name="participants" required />
                                </div>
                                <Button type="submit" className="w-full">Schedule Meeting</Button>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No meetings scheduled
                    </div>
                ) : (
                    <div className="space-y-6">
                        <TimelineSection title="Today" meetings={groupedMeetings.today} />
                        <TimelineSection title="Tomorrow" meetings={groupedMeetings.tomorrow} />
                        <TimelineSection title="This Week" meetings={groupedMeetings.thisWeek} />
                        <TimelineSection title="Upcoming" meetings={groupedMeetings.upcoming} />
                        <TimelineSection title="Past Meetings" meetings={groupedMeetings.past} />
                        {groupedMeetings.today.length === 0 &&
                            groupedMeetings.tomorrow.length === 0 &&
                            groupedMeetings.thisWeek.length === 0 &&
                            groupedMeetings.upcoming.length === 0 &&
                            groupedMeetings.past.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No meetings in any category
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}