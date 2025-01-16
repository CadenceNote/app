'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { meetingApi } from '@/services/meetingApi';
import { TeamRole } from '@/lib/types/team';
import { TaskSuggestion, UserMention } from '@/lib/types/meeting';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandList,
} from "@/components/ui/command";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, AlertCircle, CheckCircle2, Timer } from 'lucide-react';

interface StandupNotesProps {
    teamId: number;
    meetingId: number;
    currentUserId: number;
    userRole: TeamRole;
    participants: {
        id: number;
        email: string;
        full_name: string;
    }[];
    onSave: () => void;
}

interface NoteRow {
    id: string;
    type: 'todo' | 'blocker' | 'done';
    content: string;
    taskId?: number;
}

interface ParticipantNotes {
    [participantId: number]: {
        [type in 'todo' | 'blocker' | 'done']: NoteRow[];
    };
}

interface SuggestionState {
    isOpen: boolean;
    type: 'task' | 'user' | 'task_command' | null;
    query: string;
    position: {
        top: string | number;
        bottom: string | number;
        left: number;
        maxHeight: number;
    } | null;
    items: Array<TaskSuggestion | UserMention | TaskCommandSuggestion>;
    selectedIndex: number;
    inputRef: HTMLInputElement | null;
    participantId: number;
    noteType: 'todo' | 'blocker' | 'done';
    noteIndex: number;
}

interface TaskCommandSuggestion {
    id: string;
    title: string;
    description: string;
    example: string;
}

const TASK_COMMANDS: TaskCommandSuggestion[] = [
    {
        id: 'basic',
        title: 'Create Basic Task',
        description: 'Create a task with just a title',
        example: '/task Your task title'
    },
    {
        id: 'with-assignee',
        title: 'Assign Task',
        description: 'Create a task and assign it to someone',
        example: '/task Your task title @username'
    },
    {
        id: 'with-priority',
        title: 'Set Priority',
        description: 'Create a task with priority',
        example: '/task Your task title !high'
    },
    {
        id: 'with-due-date',
        title: 'Set Due Date',
        description: 'Create a task with due date',
        example: '/task Your task title due 2024-01-20'
    },
    {
        id: 'full',
        title: 'Full Task',
        description: 'Create a task with all options',
        example: '/task Your task title @username !high due 2024-01-20'
    }
];

// Helper function to check if a user can edit notes
const canEditNotes = (participantId: number, userRole: TeamRole, currentUserId: number): boolean => {
    return currentUserId === participantId || userRole === 'admin' || userRole === 'meeting_manager';
};

// Add debounce utility
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Update the Meeting type in the meetingApi module
declare module '@/services/meetingApi' {
    interface Meeting {
        duration_minutes: number;
        start_time: string;
        id: number;
        title: string;
        description?: string;
        status: string;
        notes: Record<string, { blocks: any[] }>;
    }
}

export function StandupNotes({
    teamId,
    meetingId,
    currentUserId,
    userRole,
    participants,
    onSave
}: StandupNotesProps) {
    const [notes, setNotes] = useState<ParticipantNotes>({});
    const [suggestions, setSuggestions] = useState<SuggestionState>({
        isOpen: false,
        type: null,
        query: '',
        position: null,
        items: [],
        selectedIndex: 0,
        inputRef: null,
        participantId: 0,
        noteType: 'todo',
        noteIndex: 0
    });
    const [meetingDuration, setMeetingDuration] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const { toast } = useToast();

    // Add a ref to track if notes are loaded
    const notesLoadedRef = useRef(false);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => Math.min(prev + 1, meetingDuration * 60));
        }, 1000);

        return () => clearInterval(timer);
    }, [meetingDuration]);

    // Load meeting details
    useEffect(() => {
        const loadMeeting = async () => {
            try {
                const meeting = await meetingApi.getMeeting(teamId, meetingId);
                setMeetingDuration(meeting.duration_minutes);
            } catch (error) {
                console.error('Failed to load meeting:', error);
            }
        };
        loadMeeting();
    }, [teamId, meetingId]);

    useEffect(() => {
        const loadNotes = async () => {
            // Skip if notes are already loaded
            if (notesLoadedRef.current) return;

            try {
                const data = await meetingApi.getMeeting(teamId, meetingId);
                const participantNotes: ParticipantNotes = {};

                participants.forEach(participant => {
                    const userNotes = data.notes[participant.id.toString()]?.blocks || [];
                    participantNotes[participant.id] = {
                        todo: [],
                        blocker: [],
                        done: []
                    };

                    userNotes.forEach(block => {
                        if (participantNotes[participant.id][block.type]) {
                            participantNotes[participant.id][block.type].push({
                                id: block.id,
                                type: block.type,
                                content: block.content.text || '',
                                taskId: block.content.task?.id
                            });
                        }
                    });
                });

                setNotes(participantNotes);
                notesLoadedRef.current = true;
            } catch (error) {
                console.error('Failed to load notes:', error);
                toast({
                    title: "Error",
                    description: "Failed to load meeting notes",
                    variant: "destructive"
                });
            }
        };

        loadNotes();
    }, [teamId, meetingId, participants, toast]);

    // Add cleanup for notesLoadedRef when component unmounts
    useEffect(() => {
        return () => {
            notesLoadedRef.current = false;
        };
    }, []);

    const handleNoteChange = async (participantId: number, type: 'todo' | 'blocker' | 'done', index: number, content: string) => {
        if (!canEditNotes(participantId, userRole, currentUserId)) {
            toast({
                title: "Permission Denied",
                description: "You can only edit your own notes unless you're an admin or manager.",
                variant: "destructive"
            });
            return;
        }

        setNotes(prev => {
            const participantNotes = { ...prev[participantId] };
            if (participantNotes[type][index]) {
                participantNotes[type][index] = { ...participantNotes[type][index], content };
            }
            return { ...prev, [participantId]: participantNotes };
        });
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        participantId: number,
        type: 'todo' | 'blocker' | 'done',
        index: number
    ) => {
        if (!canEditNotes(participantId, userRole, currentUserId)) return;

        if (suggestions.isOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestions(prev => ({
                    ...prev,
                    selectedIndex: Math.min(prev.selectedIndex + 1, prev.items.length - 1)
                }));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestions(prev => ({
                    ...prev,
                    selectedIndex: Math.max(prev.selectedIndex - 1, 0)
                }));
                return;
            }
            if (e.key === 'Enter' && suggestions.items.length > 0) {
                e.preventDefault();
                const selectedItem = suggestions.items[suggestions.selectedIndex];
                if (selectedItem) {
                    handleSuggestionSelect(selectedItem);
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setSuggestions(prev => ({ ...prev, isOpen: false }));
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                const selectedItem = suggestions.items[suggestions.selectedIndex];
                if (selectedItem) {
                    handleSuggestionSelect(selectedItem);
                }
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addRow(participantId, type);
            setTimeout(() => {
                const inputs = document.querySelectorAll(`[data-participant="${participantId}"][data-type="${type}"] input`);
                const nextInput = inputs[index + 1] as HTMLInputElement;
                if (nextInput) {
                    nextInput.focus();
                }
            }, 0);
        }
    };

    const addRow = (participantId: number, type: 'todo' | 'blocker' | 'done') => {
        if (!canEditNotes(participantId, userRole, currentUserId)) {
            toast({
                title: "Permission Denied",
                description: "You can only add notes to your own section unless you're an admin or manager.",
                variant: "destructive"
            });
            return;
        }

        setNotes(prev => {
            const participantNotes = { ...prev[participantId] };
            participantNotes[type] = [
                ...participantNotes[type],
                {
                    id: crypto.randomUUID(),
                    type,
                    content: ''
                }
            ];
            return { ...prev, [participantId]: participantNotes };
        });
    };

    const handleSuggestionSelect = (item: TaskSuggestion | UserMention | TaskCommandSuggestion) => {
        if (!suggestions.inputRef) return;

        const content = suggestions.inputRef.value;
        const cursorPosition = suggestions.inputRef.selectionStart || 0;

        let newContent = '';
        let newCursorPosition = cursorPosition;

        if ('email' in item) { // UserMention
            const textBeforeCursor = content.substring(0, cursorPosition);
            const mentionStart = textBeforeCursor.lastIndexOf('@');
            const textBeforeMention = content.substring(0, mentionStart);
            const textAfterCursor = content.substring(cursorPosition);

            newContent = `${textBeforeMention}@${item.name}${textAfterCursor}`;
            newCursorPosition = mentionStart + item.name.length + 1;
        } else if ('title' in item && !('example' in item)) { // TaskSuggestion
            const textBeforeCursor = content.substring(0, cursorPosition);
            const hashStart = textBeforeCursor.lastIndexOf('#');
            const textBeforeMention = content.substring(0, hashStart);
            const textAfterCursor = content.substring(cursorPosition);

            newContent = `${textBeforeMention}[Task-${item.id}]${textAfterCursor}`;
            newCursorPosition = hashStart + `[Task-${item.id}]`.length;
        } else if ('example' in item) { // TaskCommandSuggestion
            const textBeforeCursor = content.substring(0, cursorPosition);
            const commandStart = textBeforeCursor.lastIndexOf('/task');
            const textBeforeMention = content.substring(0, commandStart);
            const textAfterCursor = content.substring(cursorPosition);

            newContent = `${textBeforeMention}${item.example}${textAfterCursor}`;
            newCursorPosition = commandStart + item.example.length;
        }

        if (newContent) {
            handleNoteChange(
                suggestions.participantId,
                suggestions.noteType,
                suggestions.noteIndex,
                newContent
            );

            // Reset suggestions
            setSuggestions(prev => ({ ...prev, isOpen: false }));

            // Restore focus and cursor position
            setTimeout(() => {
                if (suggestions.inputRef) {
                    suggestions.inputRef.focus();
                    suggestions.inputRef.setSelectionRange(newCursorPosition, newCursorPosition);
                }
            }, 0);
        }
    };

    const handleSave = async () => {
        try {
            await Promise.all(
                Object.entries(notes).map(([participantId, participantNotes]) => {
                    const blocks = Object.entries(participantNotes as Record<'todo' | 'blocker' | 'done', NoteRow[]>)
                        .flatMap(([type, rows]) =>
                            rows.map(row => ({
                                id: row.id,
                                type: type as 'todo' | 'blocker' | 'done',
                                content: {
                                    text: row.content,
                                    task: row.taskId ? { id: row.taskId } : undefined
                                },
                                created_by: parseInt(participantId),
                                created_at: new Date().toISOString()
                            }))
                        );

                    return meetingApi.updateNotes(
                        teamId,
                        meetingId,
                        parseInt(participantId),
                        blocks
                    );
                })
            );

            toast({
                title: "Success",
                description: "Notes saved successfully"
            });

            onSave();
        } catch (error) {
            console.error('Failed to save notes:', error);
            toast({
                title: "Error",
                description: "Failed to save notes",
                variant: "destructive"
            });
        }
    };

    // Debounced search functions
    const debouncedSearchTasks = useCallback(
        debounce(async (query: string) => {
            try {
                const tasks = await meetingApi.searchTasks(teamId, query);
                setSuggestions(prev => ({
                    ...prev,
                    items: tasks.map(task => ({
                        id: task.id,
                        team_ref_number: task.team_ref_number,
                        title: task.title,
                        status: task.status
                    })),
                    isOpen: true
                }));
            } catch (error) {
                console.error('Failed to search tasks:', error);
                setSuggestions(prev => ({ ...prev, items: [], isOpen: true }));
            }
        }, 300),
        [teamId]
    );

    const debouncedSearchUsers = useCallback(
        debounce(async (query: string) => {
            try {
                const response = await meetingApi.searchUsers(teamId, query);
                const mappedUsers: UserMention[] = response.users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: `https://avatar.vercel.sh/${user.email}`
                }));

                setSuggestions(prev => ({
                    ...prev,
                    items: mappedUsers,
                    isOpen: true,
                    type: 'user'
                }));
            } catch (error) {
                console.error('Failed to search users:', error);
                setSuggestions(prev => ({ ...prev, items: [], isOpen: false }));
            }
        }, 300),
        [teamId]
    );

    const handleInputChange = (
        participantId: number,
        type: 'todo' | 'blocker' | 'done',
        index: number,
        value: string,
        inputRef: HTMLInputElement
    ) => {
        // Update the note content
        handleNoteChange(participantId, type, index, value);

        // Auto-delete empty notes (except the last one)
        if (value === '' && notes[participantId][type].length > 1) {
            const isLastNote = index === notes[participantId][type].length - 1;
            if (!isLastNote) {
                setNotes(prev => {
                    const updatedNotes = { ...prev };
                    updatedNotes[participantId][type] = [
                        ...updatedNotes[participantId][type].slice(0, index),
                        ...updatedNotes[participantId][type].slice(index + 1)
                    ];
                    return updatedNotes;
                });
                return;
            }
        }

        const cursorPosition = inputRef.selectionStart || 0;
        const textBeforeCursor = value.substring(0, cursorPosition);

        // Check for triggers
        const atMatch = textBeforeCursor.match(/@(\w*)$/);
        const hashMatch = textBeforeCursor.match(/#([\w-]*)$/);
        const taskCommandMatch = textBeforeCursor.match(/\/task\s*$/);

        if (atMatch || hashMatch || taskCommandMatch) {
            const rect = inputRef.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;
            const suggestionsHeight = 300; // max height of suggestions box

            // Determine if suggestions should appear above or below
            const showAbove = spaceBelow < suggestionsHeight && spaceAbove > spaceBelow;

            if (atMatch) {
                setSuggestions({
                    isOpen: true,
                    type: 'user',
                    query: atMatch[1],
                    position: null,
                    items: [],
                    selectedIndex: 0,
                    inputRef,
                    participantId,
                    noteType: type,
                    noteIndex: index
                });
                debouncedSearchUsers(atMatch[1]);
            } else if (hashMatch) {
                setSuggestions({
                    isOpen: true,
                    type: 'task',
                    query: hashMatch[1],
                    position: null,
                    items: [],
                    selectedIndex: 0,
                    inputRef,
                    participantId,
                    noteType: type,
                    noteIndex: index
                });
                debouncedSearchTasks(hashMatch[1]);
            } else if (taskCommandMatch) {
                setSuggestions({
                    isOpen: true,
                    type: 'task_command',
                    query: '',
                    position: null,
                    items: TASK_COMMANDS,
                    selectedIndex: 0,
                    inputRef,
                    participantId,
                    noteType: type,
                    noteIndex: index
                });
            }
        } else {
            setSuggestions(prev => ({ ...prev, isOpen: false }));
        }
    };

    const getProgressStats = () => {
        let total = 0;
        let completed = 0;
        let blockers = 0;

        Object.values(notes).forEach(participantNotes => {
            total += participantNotes.todo.length + participantNotes.done.length;
            completed += participantNotes.done.length;
            blockers += participantNotes.blocker.length;
        });

        return { total, completed, blockers };
    };

    const stats = getProgressStats();
    const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return (
        <div className="space-y-6 relative">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Daily Standup</CardTitle>
                            <CardDescription>Track your team&apos;s progress and blockers</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} / {meetingDuration}:00
                                </span>
                            </div>
                            <Progress value={progress} className="w-[100px]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {participants.length} Participants
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {stats.completed} Updates
                        </Badge>
                        {stats.blockers > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {stats.blockers} Blockers
                            </Badge>
                        )}
                    </div>

                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All Updates</TabsTrigger>
                            <TabsTrigger value="blockers">Blockers</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left py-2 px-4 bg-muted font-medium text-muted-foreground rounded-l-lg w-48">Participant</th>
                                        <th className="text-left py-2 px-4 bg-muted font-medium text-muted-foreground rounded-r-lg">Updates</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {participants.map((participant) => (
                                        <tr key={participant.id} className="group align-top">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                                                        <AvatarFallback>
                                                            {participant.full_name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {participant.full_name}
                                                        </span>
                                                        {!canEditNotes(participant.id, userRole, currentUserId) && (
                                                            <span className="text-xs text-muted-foreground">Read-only</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="space-y-6">
                                                    {(['done', 'todo', 'blocker'] as const).map((type) => (
                                                        <div key={type} className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="capitalize">
                                                                    {type === 'done' ? 'Yesterday' : type === 'todo' ? 'Today' : 'Blockers'}
                                                                </Badge>
                                                                {canEditNotes(participant.id, userRole, currentUserId) && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 px-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => addRow(participant.id, type)}
                                                                    >
                                                                        + Add note
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2 pl-4" data-participant={participant.id} data-type={type}>
                                                                {notes[participant.id]?.[type]?.map((note, index) => (
                                                                    <div key={note.id} className="flex flex-col gap-1">
                                                                        <Input
                                                                            value={note.content}
                                                                            onChange={(e) => handleInputChange(
                                                                                participant.id,
                                                                                type,
                                                                                index,
                                                                                e.target.value,
                                                                                e.target as HTMLInputElement
                                                                            )}
                                                                            onKeyDown={(e) => handleKeyDown(e, participant.id, type, index)}
                                                                            placeholder={canEditNotes(participant.id, userRole, currentUserId) ? `Type your update...` : 'Read-only'}
                                                                            className={cn(
                                                                                "text-sm bg-transparent border-transparent hover:border-input focus:border-input transition-colors",
                                                                                !canEditNotes(participant.id, userRole, currentUserId) && "bg-muted cursor-not-allowed",
                                                                                type === 'blocker' && "border-l-2 border-l-destructive"
                                                                            )}
                                                                            disabled={!canEditNotes(participant.id, userRole, currentUserId)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TabsContent>

                        <TabsContent value="blockers">
                            <div className="space-y-4">
                                {participants.map((participant) => (
                                    notes[participant.id]?.blocker?.length > 0 && (
                                        <Card key={participant.id}>
                                            <CardHeader className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                                                        <AvatarFallback>
                                                            {participant.full_name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <CardTitle className="text-sm">{participant.full_name}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {notes[participant.id].blocker.map((note) => (
                                                        <div key={note.id} className="flex items-start gap-2">
                                                            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />
                                                            <p className="text-sm">{note.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="tasks">
                            {/* Task summary view - to be implemented */}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    <p>Tips:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to quickly add a new item</li>
                        <li>Type <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/task</kbd> to create a task</li>
                        <li>Type <kbd className="px-1 py-0.5 bg-muted rounded text-xs">#</kbd> to reference a task</li>
                        <li>Type <kbd className="px-1 py-0.5 bg-muted rounded text-xs">@</kbd> to mention a team member</li>
                    </ul>
                </div>
                <Button onClick={handleSave} size="lg">Save Notes</Button>
            </div>

            {/* Render suggestions with adjusted positioning */}
            {suggestions.isOpen && (
                <div
                    className="fixed z-[100] w-[400px] bg-popover text-popover-foreground shadow-md rounded-md border animate-in fade-in-0 zoom-in-95"
                    style={{
                        position: 'fixed',
                        top: (suggestions.inputRef?.getBoundingClientRect().bottom ?? 0) - 20, // Reduced gap
                        left: suggestions.inputRef?.getBoundingClientRect().left ?? 0,
                    }}
                >
                    <Command className="border-none">
                        <CommandList className="max-h-[300px] overflow-y-auto">
                            {suggestions.items.length === 0 && suggestions.type === 'user' ? (
                                <CommandEmpty>Searching users...</CommandEmpty>
                            ) : suggestions.items.length === 0 ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {suggestions.items.map((item, index) => (
                                        <div
                                            key={'example' in item ? item.id : 'id' in item ? item.id : (item as UserMention).email}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 cursor-pointer",
                                                "hover:bg-accent hover:text-accent-foreground",
                                                index === suggestions.selectedIndex && "bg-accent text-accent-foreground"
                                            )}
                                            onClick={() => handleSuggestionSelect(item)}
                                            onMouseEnter={() => setSuggestions(prev => ({ ...prev, selectedIndex: index }))}
                                        >
                                            {'example' in item ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.title}</span>
                                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                                    <code className="mt-1 text-xs bg-muted px-1 py-0.5 rounded">{item.example}</code>
                                                </div>
                                            ) : 'title' in item ? (
                                                <>
                                                    <Hash className="h-4 w-4 shrink-0" />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                                                                TASK-{(item.team_ref_number || 0).toString().padStart(3, '0')}
                                                            </span>
                                                            <span className="font-medium truncate">{item.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={cn(
                                                                "text-xs px-1.5 py-0.5 rounded-full",
                                                                item.status === 'TODO' && "bg-yellow-100 text-yellow-700",
                                                                item.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-700",
                                                                item.status === 'DONE' && "bg-green-100 text-green-700"
                                                            )}>
                                                                {(item.status || 'TODO').replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 w-full">
                                                    <Avatar className="h-5 w-5 shrink-0">
                                                        <AvatarImage src={(item as UserMention).avatar} />
                                                        <AvatarFallback>
                                                            {(item as UserMention).name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate">{(item as UserMention).name}</span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {(item as UserMention).email}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}