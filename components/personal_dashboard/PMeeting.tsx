import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Button } from "../ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"
import { DroppableContainer, SortableItem } from "./Draggable"
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Meeting } from "@/types/dashboard"
import { pointerWithin } from "@dnd-kit/core"
import { verticalListSortingStrategy } from "@dnd-kit/sortable"
import { teamApi } from '@/services/teamApi'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { meetingApi } from '@/services/meetingApi'
import { UserAvatar } from "@/components/common/UserAvatar"

export default function PMeeting({ meetings, setMeetings, searchTerm }: { meetings: Meeting[], setMeetings: (meetings: Meeting[]) => void, searchTerm: string }) {
    const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
    const [teams, setTeams] = useState<{ id: number, name: string }[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

    // Fetch teams on component mount
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const userTeams = await teamApi.getUserTeams();
                setTeams(userTeams);
                if (userTeams.length > 0) {
                    setSelectedTeam(userTeams[0].id);
                }
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };

        fetchTeams();
    }, []);

    const deleteMeeting = (id: string) => {
        setMeetings(meetings.filter(meeting => meeting.id !== id));

    };

    const addMeeting = (newMeeting: Omit<Meeting, 'id' | 'isImportant'>) => {
        setMeetings([...meetings, {
            ...newMeeting,
            id: Math.random().toString(36).substr(2, 9),
            isImportant: false
        }]);
    };
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveMeeting(active.id);


        const meeting = meetings.find((m) => m.id === active.id);
        if (meeting) {
            setActiveMeeting(meeting);
        }


    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveMeeting(null);

        if (!over) return;

        const meetingId = active.id;
        const isTargetImportant = over.id === 'important';
        const meeting = meetings.find((item) => item.id === meetingId);

        if (!meeting || meeting.isImportant === isTargetImportant) return;

        // Update the UI immediately
        const updatedMeetings = meetings.map((item) =>
            item.id === meetingId
                ? { ...item, isImportant: isTargetImportant }
                : item
        );
        setMeetings(updatedMeetings);

        // Then update the server asynchronously
        meetingApi.updateMeeting(Number(meetingId), {
            is_important: isTargetImportant
        }).catch((error) => {
            console.error('Error updating meeting:', error);
            // Revert the UI on error
            setMeetings(meetings);
            alert('Failed to update meeting. Please try again.');
        });
    };

    const filteredMeetings = meetings.filter(
        (meeting) =>
            meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.date.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    return (
        <>
            <div className="flex items-center justify-between relative z-10">
                <h2 className="text-2xl font-bold">Meetings</h2>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Schedule New Meeting</SheetTitle>
                            <SheetDescription>Fill in the details to schedule a new meeting.</SheetDescription>
                        </SheetHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (!selectedTeam) {
                                    alert('Please select a team');
                                    return;
                                }
                                const formData = new FormData(e.currentTarget)
                                addMeeting({
                                    title: formData.get("title") as string,
                                    date: formData.get("date") as string,
                                    time: formData.get("time") as string,
                                    attendees: (formData.get("attendees") as string).split(",").map((a) => a.trim()),
                                    team_id: selectedTeam
                                })
                                e.currentTarget.reset()
                            }}
                            className="space-y-4 mt-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="team">Team</Label>
                                <Select
                                    name="team"
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
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" name="time" type="time" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                                <Input id="attendees" name="attendees" required />
                            </div>
                            <Button type="submit">Schedule Meeting</Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={(event) => handleDragStart(event)}
                    onDragEnd={(event) => handleDragEnd(event)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DroppableContainer id="important" title="Important Meetings">
                            <SortableContext
                                items={filteredMeetings.filter(meeting => meeting.isImportant)
                                    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="space-y-2">
                                    {filteredMeetings
                                        .filter(meeting => meeting.isImportant)
                                        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                                        .map((meeting) => (
                                            <SortableItem key={meeting.id} item={meeting} onDelete={deleteMeeting} type="meeting" />
                                        ))}
                                </ul>
                            </SortableContext>
                        </DroppableContainer>

                        <DroppableContainer id="other" title="Other Meetings">
                            <SortableContext
                                items={filteredMeetings.filter(meeting => !meeting.isImportant)
                                    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="space-y-2">
                                    {filteredMeetings
                                        .filter(meeting => !meeting.isImportant)
                                        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                                        .map((meeting) => (
                                            <SortableItem key={meeting.id} item={meeting} onDelete={deleteMeeting} type="meeting" />
                                        ))}
                                </ul>
                            </SortableContext>
                        </DroppableContainer>
                    </div>

                    <DragOverlay>
                        {activeMeeting ? <SortableItem item={activeMeeting} onDelete={deleteMeeting} type="meeting" /> : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </>
    )
}