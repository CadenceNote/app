import { useState, useEffect, useCallback } from 'react';
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
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Hash, User } from 'lucide-react';

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
    triggerPos: { top: number; left: number } | null;
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
        triggerPos: null,
        items: [],
        selectedIndex: 0,
        inputRef: null,
        participantId: 0,
        noteType: 'todo',
        noteIndex: 0
    });
    const { toast } = useToast();

    useEffect(() => {
        const loadNotes = async () => {
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

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addRow(participantId, type);
            // Focus the new input after a short delay to allow state update
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

        if ('example' in item) {
            // Handle task command suggestion
            handleNoteChange(
                suggestions.participantId,
                suggestions.noteType,
                suggestions.noteIndex,
                item.example
            );
        } else {
            // Handle task/user mention
            const textBeforeTrigger = content.substring(0, cursorPosition).replace(/[#@]\w*$/, '');
            const textAfterTrigger = content.substring(cursorPosition);
            const insertText = 'title' in item
                ? `#${item.id} `
                : `@${item.name} `;

            handleNoteChange(
                suggestions.participantId,
                suggestions.noteType,
                suggestions.noteIndex,
                textBeforeTrigger + insertText + textAfterTrigger
            );
        }

        setSuggestions(prev => ({ ...prev, isOpen: false }));
        suggestions.inputRef.focus();
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
            if (!query.trim()) return;
            try {
                const tasks = await meetingApi.searchTasks(teamId, query);
                setSuggestions(prev => ({ ...prev, items: tasks }));
            } catch (error) {
                console.error('Failed to search tasks:', error);
            }
        }, 300),
        [teamId]
    );

    const debouncedSearchUsers = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setSuggestions(prev => ({ ...prev, items: [] }));
                return;
            }
            try {
                const users = await meetingApi.searchUsers(teamId, query);
                if (users && users.length > 0) {
                    setSuggestions(prev => ({
                        ...prev,
                        items: users,
                        isOpen: true
                    }));
                }
            } catch (error) {
                console.error('Failed to search users:', error);
                setSuggestions(prev => ({ ...prev, items: [] }));
            }
        }, 300),
        [teamId]
    );

    // Task command regex without named groups
    const TASK_COMMAND_REGEX = /^\/task\s+([^@!]+)(?:\s+@(\w+))?(?:\s+!(\w+))?(?:\s+due\s+(\d{4}-\d{2}-\d{2}))?$/;

    // Debounced task command handler
    const debouncedHandleTaskCommand = useCallback(
        debounce(async (content: string, participantId: number, type: 'todo' | 'blocker' | 'done', index: number) => {
            const match = content.match(TASK_COMMAND_REGEX);
            if (!match) return false;

            const [, title, assignee, priority, dueDate] = match;

            try {
                // Find assignee ID if specified
                let assigneeId: number | undefined;
                if (assignee) {
                    const users = await meetingApi.searchUsers(teamId, assignee);
                    assigneeId = users[0]?.id;
                }

                const task = await meetingApi.createTaskFromNote(teamId, meetingId, {
                    title: title.trim(),
                    assignee_id: assigneeId,
                    priority: priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                    due_date: dueDate
                });

                // Clear the input and suggestions after successful task creation
                handleNoteChange(participantId, type, index, '');
                setSuggestions(prev => ({ ...prev, isOpen: false }));

                toast({
                    title: "Task Created",
                    description: `Task #${task.id} has been created successfully.`
                });

                return true;
            } catch (error) {
                if (error instanceof Error) {
                    console.error('Failed to create task:', error.message);
                } else {
                    console.error('Failed to create task:', error);
                }
                toast({
                    title: "Error",
                    description: "Failed to create task",
                    variant: "destructive"
                });
                return false;
            }
        }, 500),
        [teamId, meetingId]
    );

    const handleInputChange = async (
        participantId: number,
        type: 'todo' | 'blocker' | 'done',
        index: number,
        content: string,
        inputRef: HTMLInputElement
    ) => {
        handleNoteChange(participantId, type, index, content);

        const cursorPosition = inputRef.selectionStart || 0;
        const textBeforeCursor = content.substring(0, cursorPosition);

        // Handle task creation command suggestions
        if (textBeforeCursor.match(/^\/task\s*$/)) {
            const rect = inputRef.getBoundingClientRect();
            const lineHeight = parseInt(window.getComputedStyle(inputRef).lineHeight);

            setSuggestions({
                isOpen: true,
                type: 'task_command',
                query: '',
                triggerPos: {
                    top: rect.top + lineHeight,
                    left: rect.left
                },
                items: TASK_COMMANDS,
                selectedIndex: 0,
                inputRef,
                participantId,
                noteType: type,
                noteIndex: index
            });
            return;
        }

        // Handle task creation command - trigger on double space
        if (textBeforeCursor.match(/^\/task\s.+\s\s$/)) {
            // Remove the extra space that triggered the command
            const cleanContent = content.replace(/\s\s$/, ' ');
            handleNoteChange(participantId, type, index, cleanContent);

            // Trigger task creation
            debouncedHandleTaskCommand(cleanContent, participantId, type, index);
            return;
        }

        // Close suggestions if we're no longer in a task command
        if (!textBeforeCursor.match(/^\/task\s/)) {
            setSuggestions(prev => ({ ...prev, isOpen: false }));
        }

        // Handle task reference (#)
        const hashMatch = textBeforeCursor.match(/#(\w*)$/);
        if (hashMatch) {
            const query = hashMatch[1];
            const rect = inputRef.getBoundingClientRect();
            const position = inputRef.selectionStart || 0;
            const lineHeight = parseInt(window.getComputedStyle(inputRef).lineHeight);

            setSuggestions({
                isOpen: true,
                type: 'task',
                query,
                triggerPos: {
                    top: rect.top + lineHeight,
                    left: rect.left + position * 8
                },
                items: [],
                selectedIndex: 0,
                inputRef,
                participantId,
                noteType: type,
                noteIndex: index
            });

            debouncedSearchTasks(query);
        }

        // Handle user mention (@)
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
        if (mentionMatch) {
            const query = mentionMatch[1];
            const rect = inputRef.getBoundingClientRect();
            const position = inputRef.selectionStart || 0;
            const lineHeight = parseInt(window.getComputedStyle(inputRef).lineHeight);

            setSuggestions({
                isOpen: true,
                type: 'user',
                query,
                triggerPos: {
                    top: rect.top + lineHeight,
                    left: rect.left + position * 8
                },
                items: [], // Start with empty items, will be populated by debouncedSearchUsers
                selectedIndex: 0,
                inputRef,
                participantId,
                noteType: type,
                noteIndex: index
            });

            if (query) {
                debouncedSearchUsers(query);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border bg-muted text-left">Participant</th>
                            <th className="p-2 border bg-muted text-left">Todo</th>
                            <th className="p-2 border bg-muted text-left">Blockers</th>
                            <th className="p-2 border bg-muted text-left">Done</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((participant) => (
                            <tr key={participant.id} className="border-b">
                                <td className="p-2 border">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                                            <AvatarFallback>
                                                {participant.full_name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">
                                            {participant.full_name}
                                        </span>
                                        {!canEditNotes(participant.id, userRole, currentUserId) && (
                                            <span className="text-xs text-muted-foreground">(Read-only)</span>
                                        )}
                                    </div>
                                </td>
                                {(['todo', 'blocker', 'done'] as const).map((type) => (
                                    <td key={type} className="p-2 border align-top">
                                        <div className="space-y-2" data-participant={participant.id} data-type={type}>
                                            {notes[participant.id]?.[type]?.map((note, index) => (
                                                <Input
                                                    key={note.id}
                                                    value={note.content}
                                                    onChange={(e) => handleInputChange(
                                                        participant.id,
                                                        type,
                                                        index,
                                                        e.target.value,
                                                        e.target as HTMLInputElement
                                                    )}
                                                    onKeyDown={(e) => handleKeyDown(e, participant.id, type, index)}
                                                    placeholder={canEditNotes(participant.id, userRole, currentUserId) ? `Type your ${type}...` : 'Read-only'}
                                                    className={cn(
                                                        "text-sm",
                                                        !canEditNotes(participant.id, userRole, currentUserId) && "bg-muted cursor-not-allowed"
                                                    )}
                                                    disabled={!canEditNotes(participant.id, userRole, currentUserId)}
                                                />
                                            ))}
                                            {canEditNotes(participant.id, userRole, currentUserId) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-muted-foreground"
                                                    onClick={() => addRow(participant.id, type)}
                                                >
                                                    + Add {type}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {suggestions.isOpen && suggestions.triggerPos && (
                <div
                    className="absolute z-50 w-96 bg-popover text-popover-foreground shadow-md rounded-md border"
                    style={{
                        top: suggestions.triggerPos.top + 'px',
                        left: suggestions.triggerPos.left + 'px'
                    }}
                >
                    <Command>
                        <CommandInput
                            placeholder={
                                suggestions.type === 'task'
                                    ? "Search tasks..."
                                    : suggestions.type === 'user'
                                        ? "Search users..."
                                        : "Select a task command template..."
                            }
                            value={suggestions.query}
                            onValueChange={(value) => {
                                setSuggestions(prev => ({ ...prev, query: value }));
                                if (suggestions.type === 'task') {
                                    debouncedSearchTasks(value);
                                } else if (suggestions.type === 'user') {
                                    debouncedSearchUsers(value);
                                }
                            }}
                        />
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {suggestions.items.map((item) => (
                                <CommandItem
                                    key={'example' in item ? item.id : 'id' in item ? item.id : (item as UserMention).email}
                                    onSelect={() => handleSuggestionSelect(item)}
                                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                                >
                                    {'example' in item ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.title}</span>
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                            <code className="mt-1 text-xs bg-muted px-1 py-0.5 rounded">{item.example}</code>
                                        </div>
                                    ) : 'title' in item ? (
                                        <>
                                            <Hash className="h-4 w-4" />
                                            <span>{item.title}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{item.status}</span>
                                        </>
                                    ) : (
                                        <>
                                            <User className="h-4 w-4" />
                                            <span>{(item as UserMention).name}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{(item as UserMention).email}</span>
                                        </>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Notes</Button>
            </div>

            <div className="text-sm text-muted-foreground">
                <p>Tips:</p>
                <ul className="list-disc pl-4">
                    <li>Press <code>Enter</code> to quickly add a new item</li>
                    <li>Type <code>/task Title @user !priority due YYYY-MM-DD</code> to create a task</li>
                    <li>Type <code>#</code> to reference a task</li>
                    <li>Type <code>@</code> to mention a team member</li>
                </ul>
            </div>
        </div>
    );
}