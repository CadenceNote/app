/** 
 * ParticipantNoteBoard Component
 * 
 * Manages notes for all participants in a standup meeting:
 * - Auto-saves notes periodically
 * - Handles data synchronization when switching tabs
 * - Manages editing permissions based on user roles
 * - Renders participant cards with their notes
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { meetingApi } from '@/services/meetingApi';
import { TeamRole } from '@/lib/types/team';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Edit } from 'lucide-react';
import { NoteEditor } from '@/components/meetings/NoteEditor';
import { NoteRow } from '@/lib/types/note';
import { MeetingNoteBlock } from '@/lib/types/meeting';
import { taskApi } from '@/services/taskApi';
import { Task } from '@/lib/types/task';
import { debounce } from '@/lib/utils';
import { UserDetailModal } from './UserDetailModal';
import { TaskDetail } from '../tasks/TaskDetail';

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

interface ParticipantNoteBoardProps {
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

// Helper function to check if a user can edit notes
const canEditNotes = (participantId: number, userRole: TeamRole, currentUserId: number): boolean => {
    // Admin and meeting manager can edit all notes
    if (userRole === 'admin' || userRole === 'meeting_manager') {
        return true;
    }
    // Others can only edit their own notes
    return currentUserId === participantId;
};

export function ParticipantNoteBoard({
    teamId,
    meetingId,
    currentUserId,
    userRole,
    participants,
    onSave
}: ParticipantNoteBoardProps) {
    const { toast } = useToast();
    const [notes, setNotes] = useState<Record<string, { todo: NoteRow[]; blocker: NoteRow[]; done: NoteRow[]; }>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const notesRef = useRef(notes);

    // Add state for modals
    const [selectedUser, setSelectedUser] = useState<{
        id: number;
        email: string;
        full_name: string;
    } | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Keep notesRef in sync with notes state
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    // Create a debounced save function
    const debouncedSave = useRef(
        debounce(async () => {
            if (isSaving) return;

            try {
                setIsSaving(true);
                for (const [participantId, participantNotes] of Object.entries(notesRef.current)) {
                    const blocks: MeetingNoteBlock[] = [];

                    for (const type of ['todo', 'blocker', 'done'] as const) {
                        participantNotes[type].forEach(note => {
                            if (!note.content.trim()) return;

                            blocks.push({
                                id: note.id,
                                type,
                                content: {
                                    text: note.content,
                                    ...(note.taskId ? {
                                        task: {
                                            id: note.taskId
                                        }
                                    } : {})
                                },
                                created_by: Number(participantId),
                                created_at: new Date().toISOString()
                            });
                        });
                    }

                    if (blocks.length > 0) {
                        await meetingApi.updateNotes(teamId, meetingId, Number(participantId), blocks);
                    }
                }
            } catch {
                toast({
                    title: "Error",
                    description: "Failed to auto-save notes",
                    variant: "destructive"
                });
            } finally {
                setIsSaving(false);
            }
        }, 2000)
    ).current;

    // Remove the old auto-save effect
    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    const loadParticipantNotes = async () => {
        try {
            const data = await meetingApi.getMeeting(teamId, meetingId);
            const participantNotes: Record<string, { todo: NoteRow[]; blocker: NoteRow[]; done: NoteRow[]; }> = {};

            participants.forEach(participant => {
                const userNotes = data.notes[participant.id.toString()]?.blocks || [];
                participantNotes[participant.id.toString()] = {
                    todo: [],
                    blocker: [],
                    done: []
                };

                userNotes.forEach((block: MeetingNoteBlock) => {
                    if (participantNotes[participant.id.toString()][block.type]) {
                        participantNotes[participant.id.toString()][block.type].push({
                            id: block.id,
                            type: block.type,
                            content: block.content.text || '',
                            taskId: block.content.task?.id,
                            badges: []
                        });
                    }
                });
            });

            const notesChanged = JSON.stringify(notesRef.current) !== JSON.stringify(participantNotes);
            if (notesChanged) {
                setNotes(participantNotes);
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to load meeting notes",
                variant: "destructive"
            });
        }
    };

    const loadTeamTasks = async () => {
        try {
            const taskList = await taskApi.listTasks(teamId);
            setTasks(taskList);
        } catch {
            toast({
                title: "Error",
                description: "Failed to load tasks",
                variant: "destructive"
            });
        }
    };

    // Initial data fetch
    useEffect(() => {
        loadParticipantNotes();
        loadTeamTasks();
    }, [teamId, meetingId, participants]);

    const updateParticipantNote = (participantId: number, type: 'todo' | 'blocker' | 'done', index: number, content: string) => {
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

        // Trigger debounced save on content change
        debouncedSave();
    };

    const addParticipantNote = (participantId: number, type: 'todo' | 'blocker' | 'done') => {
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
            const newNote = {
                id: crypto.randomUUID(),
                type,
                content: '',
                badges: []
            };

            participantNotes[type] = [...participantNotes[type], newNote];
            return { ...prev, [participantId]: participantNotes };
        });

        // Use setTimeout to ensure the new note is rendered before focusing
        setTimeout(() => {
            // Find all note editors in the specific section
            const participantCard = document.querySelector(`[data-participant-id="${participantId}"]`);
            if (participantCard) {
                const sectionDiv = participantCard.querySelector(`[data-note-section="${type}"]`);
                if (sectionDiv) {
                    const noteElements = sectionDiv.querySelectorAll('.ProseMirror');
                    const lastNote = noteElements[noteElements.length - 1];
                    if (lastNote) {
                        (lastNote as HTMLElement).focus();
                    }
                }
            }
        }, 0);
    };

    const deleteParticipantNote = (participantId: number, type: 'todo' | 'blocker' | 'done', index: number) => {
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
            participantNotes[type] = participantNotes[type].filter((_, i) => i !== index);
            return { ...prev, [participantId]: participantNotes };
        });
    };

    const saveAllNotes = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            for (const [participantId, participantNotes] of Object.entries(notes)) {
                const blocks: MeetingNoteBlock[] = [];

                for (const type of ['todo', 'blocker', 'done'] as const) {
                    participantNotes[type].forEach(note => {
                        if (!note.content.trim()) return;

                        blocks.push({
                            id: note.id,
                            type,
                            content: {
                                text: note.content,
                                ...(note.taskId ? {
                                    task: {
                                        id: note.taskId
                                    }
                                } : {})
                            },
                            created_by: Number(participantId),
                            created_at: new Date().toISOString()
                        });
                    });
                }

                if (blocks.length > 0) {
                    await meetingApi.updateNotes(teamId, meetingId, Number(participantId), blocks);
                }
            }

            toast({
                title: "Success",
                description: "Notes saved successfully"
            });

            onSave();
        } catch {
            toast({
                title: "Error",
                description: "Failed to save notes",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleMentionClick = (type: 'user' | 'task', id: string) => {
        if (type === 'user') {
            const user = participants.find(p => p.id === Number(id));
            if (user) {
                setSelectedUser(user);
            }
        } else if (type === 'task') {
            const task = tasks.find(t => t.id === Number(id));
            if (task) {
                setSelectedTask(task);
            }
        }
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const renderNoteEditor = (note: NoteRow, participantId: string, type: 'todo' | 'blocker' | 'done', index: number) => {
        return (
            <div key={note.id} className="relative w-full [&_.ProseMirror:focus]:ring-0 [&_.ProseMirror:focus]:border-none">
                <NoteEditor
                    content={note.content}
                    onChange={(content: string) => updateParticipantNote(Number(participantId), type, index, content)}
                    onDelete={() => deleteParticipantNote(Number(participantId), type, index)}
                    onEnterKey={() => {
                        const note = notes[participantId][type][index];
                        if (note.content.trim()) {
                            addParticipantNote(Number(participantId), type);
                        }
                    }}
                    onMention={() => {
                        // Handle mentions if needed
                    }}
                    onMentionClick={handleMentionClick}
                    participants={participants}
                    tasks={tasks}
                    placeholder={canEditNotes(Number(participantId), userRole, currentUserId)
                        ? `Type your ${type === 'done' ? 'completed tasks' : type === 'todo' ? 'planned tasks' : 'blockers'}...`
                        : 'Read-only'}
                    readOnly={!canEditNotes(Number(participantId), userRole, currentUserId)}
                    teamId={teamId}
                />
            </div>
        );
    };

    const renderNoteSection = (participant: typeof participants[0], type: 'todo' | 'blocker' | 'done') => {
        const participantNotes = notes[participant.id]?.[type] || [];
        return (
            <div data-note-section={type} className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                        {type === 'todo' ? 'To Do' : type === 'done' ? 'Done' : 'Blockers'}
                    </h3>
                    {canEditNotes(participant.id, userRole, currentUserId) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addParticipantNote(participant.id, type)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                    {participantNotes.map((note, index) =>
                        renderNoteEditor(note, String(participant.id), type, index)
                    )}
                </div>
            </div>
        );
    };

    const renderParticipantCard = (participant: typeof participants[0]) => (
        <Card key={participant.id} data-participant-id={participant.id} className="w-full">
            <div className="grid grid-cols-[200px_1fr] divide-x">
                <div className="p-4 space-y-4">
                    <div className="flex flex-col items-center text-center gap-3">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                            <AvatarFallback>{participant.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <CardTitle className="text-base">{participant.full_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                            {participant.role && (
                                <Badge variant="outline" className={cn("text-xs", getRoleBadgeStyles(participant.role))}>
                                    {ROLE_DISPLAY[participant.role]}
                                </Badge>
                            )}
                        </div>
                        {canEditNotes(participant.id, userRole, currentUserId) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={saveAllNotes}
                                disabled={isSaving}
                                className="w-full"
                            >
                                {isSaving ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    {renderNoteSection(participant, 'todo')}
                    {renderNoteSection(participant, 'blocker')}
                    {renderNoteSection(participant, 'done')}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-4">
            {participants.map(renderParticipantCard)}

            {/* Add modals */}
            {selectedUser && (
                <UserDetailModal
                    open={!!selectedUser}
                    onOpenChange={(open) => !open && setSelectedUser(null)}
                    user={selectedUser}
                />
            )}

            {selectedTask && (
                <TaskDetail
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={selectedTask}
                    teamId={teamId}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}
        </div>
    );
}