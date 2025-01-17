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
import { Badge } from "@/components/ui/badge";
import { Hash, Users, CheckCircle2, Trash2, Save, Edit } from 'lucide-react';
import { TASK_STATUS, TASK_STATUS_DISPLAY } from '@/lib/config/taskConfig';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TeamMember } from '@/lib/types/team';
import { MeetingNotes } from '@/lib/types/meeting';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface StandupNotesProps {
    teamId: number;
    meetingId: number;
    currentUserId: number;
    userRole: TeamRole;
    participants: {
        id: number;
        email: string;
        full_name: string;
        role?: TeamRole;
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
        top: number | null;
        bottom: number | null;
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
    // Admin and meeting manager can edit all notes
    if (userRole === 'admin' || userRole === 'meeting_manager') {
        return true;
    }
    // Others can only edit their own notes
    return currentUserId === participantId;
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
        id: number;
        title: string;
        description?: string;
        type: 'daily' | 'planning' | 'review' | 'retrospective' | 'adhoc';
        status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
        participants: TeamMember[];
        notes: Record<string, MeetingNotes>;
        settings?: {
            goals: string[];
            agenda: string[];
        };
        duration_minutes?: number;
        start_time: string;
    }
}

// Add role badge color mapping
const getRoleBadgeStyles = (role: TeamRole) => {
    switch (role) {
        case 'admin':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'meeting_manager':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

// Add role display mapping
const ROLE_DISPLAY = {
    admin: 'Admin',
    meeting_manager: 'Meeting Manager',
    member: 'Member'
} as const;

export function StandupNotes({
    teamId,
    meetingId,
    currentUserId,
    userRole,
    participants,
    onSave
}: StandupNotesProps) {
    const [notes, setNotes] = useState<ParticipantNotes>({});
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
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
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        participantId: number;
        type: 'todo' | 'blocker' | 'done';
        index: number;
        content: string;
    }>({
        isOpen: false,
        participantId: 0,
        type: 'todo',
        index: 0,
        content: ''
    });
    const { toast } = useToast();

    // Add a ref to track if notes are loaded
    const notesLoadedRef = useRef<boolean>(false);
    // Add a ref for auto-save debounce
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Load meeting details
    useEffect(() => {
        const loadMeeting = async () => {
            try {
                await meetingApi.getMeeting(teamId, meetingId);
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
        const cleanup = () => {
            notesLoadedRef.current = false;
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
        cleanup(); // Call cleanup on mount to ensure clean state
        return cleanup;
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

        // Trigger auto-save
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, 1000); // Auto-save after 1 second of no changes
    };

    const handleDeleteNote = (participantId: number, type: 'todo' | 'blocker' | 'done', index: number) => {
        const note = notes[participantId][type][index];
        if (note.content.trim()) {
            // If note has content, show confirmation dialog
            setDeleteDialog({
                isOpen: true,
                participantId,
                type,
                index,
                content: note.content
            });
        } else {
            // If note is empty, delete immediately
            deleteNote(participantId, type, index);
        }
    };

    const deleteNote = (participantId: number, type: 'todo' | 'blocker' | 'done', index: number) => {
        if (!canEditNotes(participantId, userRole, currentUserId)) {
            toast({
                title: "Permission Denied",
                description: "You can only delete your own notes unless you're an admin or manager.",
                variant: "destructive"
            });
            return;
        }

        setNotes(prev => {
            const participantNotes = { ...prev[participantId] };
            participantNotes[type] = [
                ...participantNotes[type].slice(0, index),
                ...participantNotes[type].slice(index + 1)
            ];
            return { ...prev, [participantId]: participantNotes };
        });

        // Trigger auto-save after deletion
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, 1000);
    };

    const handleBlur = (participantId: number, type: 'todo' | 'blocker' | 'done', index: number) => {
        const note = notes[participantId][type][index];
        if (!note.content.trim()) {
            // Delete empty note on blur, but ensure at least one empty note exists
            deleteNote(participantId, type, index);
            if (notes[participantId][type].length === 0) {
                // If we deleted the last note, add a new empty one
                addRow(participantId, type);
            }
        }
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
            setIsSaving(true);
            // Save notes for each participant separately
            await Promise.all(Object.entries(notes).map(async ([participantId, participantNotes]) => {
                const blocks = Object.entries(participantNotes as Record<'todo' | 'blocker' | 'done', NoteRow[]>).flatMap(([type, rows]) =>
                    rows.map((note: NoteRow) => ({
                        id: note.id,
                        type: type as 'todo' | 'blocker' | 'done',
                        content: {
                            text: note.content,
                            task: note.taskId ? { id: note.taskId } : undefined
                        },
                        created_by: parseInt(participantId),
                        created_at: new Date().toISOString()
                    }))
                );

                await meetingApi.updateNotes(teamId, meetingId, parseInt(participantId), blocks);
            }));
            setLastSaveTime(new Date());
            onSave();
        } catch (error) {
            console.error('Failed to save notes:', error);
            toast({
                title: "Error",
                description: "Failed to save notes. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
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
                deleteNote(participantId, type, index);
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

            // Position suggestions based on available space
            const position = {
                top: spaceBelow >= suggestionsHeight ? rect.bottom : null,
                bottom: spaceBelow < suggestionsHeight ? windowHeight - rect.top : null,
                left: rect.left,
                maxHeight: Math.min(suggestionsHeight, Math.max(spaceBelow, spaceAbove))
            };

            if (atMatch) {
                setSuggestions({
                    isOpen: true,
                    type: 'user',
                    query: atMatch[1],
                    position,
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
                    position,
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
                    position,
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
        const stats = {
            total: 0,
            completed: 0
        };

        Object.values(notes).forEach(participantNotes => {
            stats.total += participantNotes.todo.length + participantNotes.blocker.length + participantNotes.done.length;
            stats.completed += participantNotes.done.length;
        });

        return stats;
    };

    const stats = getProgressStats();

    return (
        <div className="space-y-6 relative">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Daily Standup</CardTitle>
                            <CardDescription>Track your team&apos;s progress and blockers</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {isSaving ? (
                                <div className="flex items-center gap-1">
                                    <Save className="h-4 w-4 animate-spin" />
                                    Saving...
                                </div>
                            ) : lastSaveTime ? (
                                <div className="flex items-center gap-1">
                                    <Save className="h-4 w-4" />
                                    Last saved {lastSaveTime.toLocaleTimeString()}
                                </div>
                            ) : null}
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
                                        <tr key={participant.id} className={cn(
                                            "group align-top transition-colors",
                                            canEditNotes(participant.id, userRole, currentUserId) && "bg-blue-50/5 hover:bg-blue-50/10"
                                        )}>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                                                            <AvatarFallback>
                                                                {participant.full_name.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate">
                                                                {participant.full_name}
                                                                {participant.id === currentUserId && (
                                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {participant.email}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Role badges */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {participant.role && (
                                                            <span className={cn(
                                                                "text-xs px-2 py-1 rounded-full border",
                                                                getRoleBadgeStyles(participant.role)
                                                            )}>
                                                                {ROLE_DISPLAY[participant.role]}
                                                            </span>
                                                        )}
                                                        {canEditNotes(participant.id, userRole, currentUserId) && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                                                <Edit className="h-3 w-3" />
                                                                {userRole === 'admin' ? 'Admin Access' : userRole === 'meeting_manager' ? 'Manager Access' : 'Can Edit'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="space-y-6">
                                                    {(['done', 'todo', 'blocker'] as const).map((type) => (
                                                        <div key={type} className={cn(
                                                            "space-y-2 rounded-lg",
                                                            canEditNotes(participant.id, userRole, currentUserId) && "p-3 hover:bg-muted/5 transition-colors"
                                                        )}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className={cn(
                                                                        "capitalize font-medium",
                                                                        type === 'done' && "border-green-200 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700",
                                                                        type === 'todo' && "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700",
                                                                        type === 'blocker' && "border-red-200 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700"
                                                                    )}>
                                                                        {type === 'done' ? 'Yesterday' : type === 'todo' ? 'Today' : 'Blockers'}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {notes[participant.id]?.[type]?.length || 0} items
                                                                    </span>
                                                                </div>
                                                                {canEditNotes(participant.id, userRole, currentUserId) && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className={cn(
                                                                            "h-6 px-2 text-xs",
                                                                            type === 'done' && "text-green-700 hover:text-green-800 hover:bg-green-50",
                                                                            type === 'todo' && "text-blue-700 hover:text-blue-800 hover:bg-blue-50",
                                                                            type === 'blocker' && "text-red-700 hover:text-red-800 hover:bg-red-50"
                                                                        )}
                                                                        onClick={() => addRow(participant.id, type)}
                                                                    >
                                                                        + Add Note
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2" data-participant={participant.id} data-type={type}>
                                                                {notes[participant.id]?.[type]?.map((note, index) => (
                                                                    <div key={note.id} className="flex flex-col gap-1">
                                                                        <ContextMenu>
                                                                            <ContextMenuTrigger>
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
                                                                                    onBlur={() => handleBlur(participant.id, type, index)}
                                                                                    placeholder={canEditNotes(participant.id, userRole, currentUserId)
                                                                                        ? `Type your ${type === 'done' ? 'completed tasks' : type === 'todo' ? 'planned tasks' : 'blockers'}...`
                                                                                        : 'Read-only'}
                                                                                    className={cn(
                                                                                        "text-sm bg-transparent transition-colors",
                                                                                        "hover:border-input focus:border-input",
                                                                                        "ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                                                        // !canEditNotes(participant.id, userRole, currentUserId) && "bg-muted cursor-not-allowed",
                                                                                        type === 'blocker' && "border-l-2 border-l-red-500",
                                                                                        type === 'todo' && "border-l-2 border-l-blue-500",
                                                                                        type === 'done' && "border-l-2 border-l-green-500",
                                                                                        note.content === '' && "border-dashed"
                                                                                    )}
                                                                                // disabled={!canEditNotes(participant.id, userRole, currentUserId)}
                                                                                />
                                                                            </ContextMenuTrigger>
                                                                            {canEditNotes(participant.id, userRole, currentUserId) && (
                                                                                <ContextMenuContent>
                                                                                    <ContextMenuItem
                                                                                        onClick={() => handleDeleteNote(participant.id, type, index)}
                                                                                        className="text-destructive focus:text-destructive"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                                        Delete Note
                                                                                    </ContextMenuItem>
                                                                                </ContextMenuContent>
                                                                            )}
                                                                        </ContextMenu>
                                                                    </div>
                                                                ))}
                                                                {notes[participant.id]?.[type]?.length === 0 && (
                                                                    <div className="text-sm text-muted-foreground italic px-3 py-2">
                                                                        No {type === 'done' ? 'completed tasks' : type === 'todo' ? 'planned tasks' : 'blockers'} yet
                                                                    </div>
                                                                )}
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
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                                                        <AvatarFallback>{participant.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                    </Avatar>
                                                    {participant.full_name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {notes[participant.id]?.blocker?.map((note, index) => (
                                                        <div key={note.id} className="flex flex-col gap-1">
                                                            <ContextMenu>
                                                                <ContextMenuTrigger>
                                                                    <Input
                                                                        value={note.content}
                                                                        onChange={(e) => handleInputChange(
                                                                            participant.id,
                                                                            'blocker',
                                                                            index,
                                                                            e.target.value,
                                                                            e.target as HTMLInputElement
                                                                        )}
                                                                        onKeyDown={(e) => handleKeyDown(e, participant.id, 'blocker', index)}
                                                                        onBlur={() => handleBlur(participant.id, 'blocker', index)}
                                                                        placeholder={canEditNotes(participant.id, userRole, currentUserId) ? `Type your update...` : 'Read-only'}
                                                                        className={cn(
                                                                            "text-sm bg-transparent hover:border-input transition-colors ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                                            // !canEditNotes(participant.id, userRole, currentUserId) && "bg-muted cursor-not-allowed",
                                                                            "border-l-2 border-l-destructive"
                                                                        )}
                                                                    // disabled={!canEditNotes(participant.id, userRole, currentUserId)}
                                                                    />
                                                                </ContextMenuTrigger>
                                                                {canEditNotes(participant.id, userRole, currentUserId) && (
                                                                    <ContextMenuContent>
                                                                        <ContextMenuItem
                                                                            onClick={() => handleDeleteNote(participant.id, 'blocker', index)}
                                                                            className="text-destructive focus:text-destructive"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Delete Note
                                                                        </ContextMenuItem>
                                                                    </ContextMenuContent>
                                                                )}
                                                            </ContextMenu>
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
                        <li>Changes are automatically saved as you type</li>
                        <li>Right-click on a note to delete it</li>
                    </ul>
                </div>
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
                                                                item.status === TASK_STATUS.TODO && "bg-yellow-100 text-yellow-700",
                                                                item.status === TASK_STATUS.IN_PROGRESS && "bg-blue-100 text-blue-700",
                                                                item.status === TASK_STATUS.DONE && "bg-green-100 text-green-700"
                                                            )}>
                                                                {TASK_STATUS_DISPLAY[item.status] || TASK_STATUS_DISPLAY[TASK_STATUS.TODO]}
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Note</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this note? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm">{deleteDialog.content}</p>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                deleteNote(deleteDialog.participantId, deleteDialog.type, deleteDialog.index);
                                setDeleteDialog(prev => ({ ...prev, isOpen: false }));
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}