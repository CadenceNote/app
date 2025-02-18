// File: components/meetings/RealtimeNoteEditor.tsx
'use client';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { supabase } from '@/lib/supabase';
import { WebsocketProvider } from 'y-websocket';
import { cn, debounce } from '@/lib/utils';
import { Mention } from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import { createRoot } from 'react-dom/client';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Task } from '@/lib/types/task';
import { EditorView } from '@tiptap/pm/view';
import { TaskDetail } from '../tasks/TaskDetail';
import { UserAvatar } from '../common/UserAvatar';
import { Suggestion } from '@tiptap/suggestion';
import { PlusCircle, Calendar } from 'lucide-react';
import { AvatarCacheProvider } from '@/contexts/AvatarCache';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import React from 'react';
import { QuickTaskModal } from '../tasks/QuickTaskModal';
import { useTask } from '@/hooks/useTask';
import { useToast } from '@/hooks/use-toast';

declare module '@tiptap/extension-mention' {
    interface MentionOptions {
        renderLabel?: (props: { node: { attrs: { id: string; label: string; type: 'user' | 'task' } } }) => string;
    }
}
interface NoteEditorProps {
    content: string;
    onChange: (content: string) => void;
    onDelete?: () => void;
    onEnterKey?: () => void;
    onMention?: (type: 'user' | 'task', id: number) => void;
    onMentionClick?: (type: 'user' | 'task', id: string) => void;
    participants: Array<{
        id: number;
        email: string;
        full_name: string;
    }>;
    tasks?: Array<{
        id: number;
        title: string;
        team_ref_number: string;
    }>;
    placeholder?: string;
    readOnly?: boolean;
    onTaskCreate?: (task: Task) => void;
    teamId: number;
}

interface MentionListProps {
    items: Array<{
        id: number;
        label: string;
        description?: string;
        icon?: string;
        type: 'user' | 'task';
    }>;
    command: (item: { id: string; label: string; type: 'user' | 'task' }) => void;
    selectedIndex?: number;
}

interface Participant {
    id: number;
    email: string;
    full_name: string;
    role?: string;
}

const COLORS = ['#f783ac', '#74b816', '#1098ad', '#d9480f', '#7048e8', '#e8590c'];

const EMPTY_DOC = {
    type: 'doc',
    content: [{
        type: 'paragraph',
    }]
};

// Add MentionList component from NoteEditor.tsx
const MentionList = ({ items = [], command, selectedIndex = 0 }: MentionListProps) => {
    // Filter items by type first to avoid index mismatches
    const userItems = items.filter(item => item.type === 'user');
    const taskItems = items.filter(item => item.type === 'task');

    // Calculate the actual selected item based on the combined list
    const selectedItem = items[selectedIndex];
    const isSelectedUser = selectedItem?.type === 'user';

    return (
        <div className="overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {items.length > 0 ? (
                <>
                    {userItems.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Users</div>
                            {userItems.map((item) => (
                                <button
                                    key={`user-${item.id}`}
                                    className={cn(
                                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                        selectedItem?.id === item.id && isSelectedUser
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent/50 hover:text-accent-foreground"
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        command({
                                            id: String(item.id),
                                            label: item.label,
                                            type: item.type
                                        });
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {item.type === 'user' ? (
                                            <UserAvatar
                                                userId={String(item.id)}
                                                name={item.label}
                                                className="h-6 w-6"
                                            />
                                        ) : (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                                #
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span>{item.label}</span>
                                            {item.description && (
                                                <span className="text-xs text-muted-foreground">{item.description}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                    {taskItems.length > 0 && (
                        <>
                            <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tasks</div>
                            {taskItems.map((item) => (
                                <button
                                    key={`task-${item.id}`}
                                    className={cn(
                                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                        selectedItem?.id === item.id && !isSelectedUser
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent/50 hover:text-accent-foreground"
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        command({
                                            id: String(item.id),
                                            label: item.label,
                                            type: item.type
                                        });
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                            #
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{item.label}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </>
            ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No matches found
                </div>
            )}
        </div>
    );
};
const userMentionPluginKey = new PluginKey('userMention');
const taskMentionPluginKey = new PluginKey('taskMention');


const UserMention = Mention.extend({
    name: 'userMention',
    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => {
                    return {
                        'data-id': attributes.id,
                        'data-type': 'user'
                    };
                }
            },
            label: {
                default: null,
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => {
                    return {
                        'data-label': attributes.label
                    };
                }
            },
            type: {
                default: 'user',
                parseHTML: element => element.getAttribute('data-type'),
                renderHTML: attributes => {
                    return {
                        'data-type': attributes.type
                    };
                }
            }
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span[data-type="user"]'
            }
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        return ['span', {
            class: 'mention mention-user cursor-pointer',
            ...HTMLAttributes
        }, `@${node.attrs.label}`];
    }
}).configure({
    HTMLAttributes: {
        class: 'mention mention-user cursor-pointer',
        'data-type': 'user'
    }
});

const TaskMention = Mention.extend({
    name: 'taskMention',
    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => {
                    return {
                        'data-id': attributes.id,
                        'data-type': 'task'
                    };
                }
            },
            label: {
                default: null,
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => {
                    return {
                        'data-label': attributes.label
                    };
                }
            },
            type: {
                default: 'task',
                parseHTML: element => element.getAttribute('data-type'),
                renderHTML: attributes => {
                    return {
                        'data-type': attributes.type
                    };
                }
            }
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span[data-type="task"]'
            }
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        return ['span', {
            class: 'mention mention-task cursor-pointer',
            ...HTMLAttributes
        }, `#${node.attrs.label}`];
    }
}).configure({
    HTMLAttributes: {
        class: 'mention mention-task cursor-pointer',
        'data-type': 'task'
    }
});

// Remove the old SlashCommands extension
// Add new command menu suggestion key
const commandSuggestionKey = new PluginKey('commandSuggestion');

// Add command types
type CommandItem = {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    command: (editor: Editor, range: Range) => void;
};

// Update the CommandMenu component
const CommandMenu = ({ items, command, selectedIndex = 0 }: {
    items: CommandItem[];
    command: (item: CommandItem) => void;
    selectedIndex: number;
}) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus the search input when the menu opens
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <Command className="w-[300px] rounded-lg border bg-background">
            <CommandInput
                ref={inputRef}
                placeholder="Type a command..."
                autoFocus={true}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                    {items.map((item, index) => (
                        <CommandItem
                            key={item.title}
                            onSelect={() => command(item)}
                            className={cn(
                                "cursor-default",
                                selectedIndex === index && "bg-accent text-accent-foreground"
                            )}
                        >
                            {item.icon && (
                                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                    {item.icon}
                                </div>
                            )}
                            <div>
                                <p>{item.title}</p>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
};

// Add commands extension
const SlashCommands = Extension.create({
    name: 'slashCommands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
                    // Call the command function with editor and range
                    if (props.command) {
                        props.command(editor, range);
                    }
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export function RealtimeNoteEditor({
    ydoc,
    provider,
    section,
    currentUserId,
    meetingId,
    participants,
    editable = true,
    sectionTitle,
    tasks,
    onMentionClick,
    teamId,
}: {
    ydoc: Y.Doc | null;
    provider: WebsocketProvider | null;
    section: string;
    currentUserId: number;
    meetingId: number;
    participants: Participant[];
    editable?: boolean;
    sectionTitle: string;
    tasks?: Array<{ id: number; title: string; team_ref_number: string; }>;
    onMentionClick?: (type: 'user' | 'task', id: string) => void;
    teamId: number;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [showSaving, setShowSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'hidden'>('hidden');
    const [isContentLoaded, setIsContentLoaded] = useState(false);
    const [isProviderConnected, setIsProviderConnected] = useState(false);

    const prevTasksRef = useRef(tasks);
    const editorRef = useRef<Editor | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const isInitialLoad = useRef(true);
    const hasLoadedFromDB = useRef(false);

    // Create a key that changes when important dependencies change
    const editorKey = `${section}-${currentUserId}-${participants.length}`;

    // Add state for quick task modal
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [taskInitialTitle, setTaskInitialTitle] = useState('');

    // Add useTask hook
    const { createTask } = useTask(teamId);

    // Move toast to component level
    const { toast } = useToast();

    // Create a stable reference for tasks to prevent unnecessary re-renders
    const tasksRef = useRef(tasks);
    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    // Handle saving status with fade out animation
    useEffect(() => {
        if (isInitialLoad.current) {
            return;
        }

        if (isSaving) {
            setShowSaving(true);
            setSaveStatus('saving');
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        } else if (showSaving) {
            setSaveStatus('saved');
            saveTimeoutRef.current = setTimeout(() => {
                setSaveStatus('hidden');
                setTimeout(() => {
                    setShowSaving(false);
                }, 500);
            }, 500);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [isSaving, showSaving]);
    const handleTaskDetailUpdate = (task: Task) => {
        handleTaskCreate(task);
    };
    const debouncedSave = useRef(
        debounce(async (content: Record<string, any>) => {
            if (isSaving) return;
            setIsSaving(true);

            try {
                // Ensure section ID is within varchar(20) limit
                const sectionId = section.length > 20 ? section.slice(0, 20) : section;

                await supabase
                    .from('meeting_note_blocks')
                    .upsert({
                        meeting_id: meetingId,
                        participant_id: currentUserId,
                        type: sectionId,
                        content: content,
                        version: Math.floor(Date.now() / 1000)
                    });
            } catch (error) {
                console.error('Error saving content:', error);
            } finally {
                setIsSaving(false);
            }
        }, 2000)
    ).current;

    const loadContent = async () => {
        if (!editorRef.current) return;

        try {
            // Ensure section ID is within varchar(20) limit
            const sectionId = section.length > 20 ? section.slice(0, 20) : section;

            const { data } = await supabase
                .from('meeting_note_blocks')
                .select('content')
                .eq('meeting_id', meetingId)
                .eq('type', sectionId)
                .eq('participant_id', currentUserId)
                .order('version', { ascending: false })
                .limit(1);

            const content = data?.[0]?.content || EMPTY_DOC;

            isInitialLoad.current = true;
            editorRef.current.commands.setContent(content);
            setIsContentLoaded(true);
        } catch (error) {
            console.error('[Editor] Error loading content:', error);
            editorRef.current.commands.setContent(EMPTY_DOC);
            setIsContentLoaded(true);
        }
    };

    // Update the getCommands callback
    const getCommands = useCallback((editor: Editor): CommandItem[] => {
        return [
            {
                title: 'Create Task',
                description: 'Create a new task and mention it',
                icon: <PlusCircle className="h-4 w-4" />,
                command: (editor, range) => {
                    // Delete the slash command
                    editor.chain().focus().deleteRange(range).run();

                    // Get the text from the current line as initial title
                    const { from, to } = editor.state.selection;
                    const text = editor.state.doc.textBetween(from, to, ' ');

                    // Show the task modal
                    setTaskInitialTitle(text);
                    setShowQuickTaskModal(true);
                },
            },
            {
                title: 'Insert Date',
                description: 'Insert today, tomorrow, or a specific date',
                icon: <Calendar className="h-4 w-4" />,
                command: (editor, range) => {
                    editor.chain().focus().deleteRange(range).run();
                    const today = new Date().toLocaleDateString();
                    editor.chain().focus().insertContent(today).run();
                },
            },
        ];
    }, []);

    // Memoize the editor configuration to prevent unnecessary re-renders
    const editorConfig = useMemo(() => ({
        extensions: [
            StarterKit.configure({
                history: false,
            }),
            Collaboration.configure({
                document: ydoc || new Y.Doc(),
                field: section,
                fragmentIdentifier: `${section}-${currentUserId}`,
            }),
            ...(provider ? [
                CollaborationCursor.configure({
                    provider: provider,
                    user: {
                        name: participants.find(p => p.id === currentUserId)?.full_name || 'Anonymous',
                        color: COLORS[currentUserId % COLORS.length],
                    },
                }),
            ] : []),
            UserMention.configure({
                HTMLAttributes: {
                    class: 'mention mention-user cursor-pointer',
                    'data-type': 'user'
                },
                suggestion: {
                    char: '@',
                    pluginKey: userMentionPluginKey,
                    items: ({ query }) => {
                        return participants
                            .filter(participant =>
                                participant.full_name.toLowerCase().includes(query.toLowerCase()) ||
                                participant.email.toLowerCase().includes(query.toLowerCase())
                            )
                            .map(participant => ({
                                id: participant.id,
                                label: participant.full_name,
                                description: participant.email,
                                icon: `https://avatar.vercel.sh/${participant.email}`,
                                type: 'user' as const
                            }));
                    },
                    render: () => {
                        let popup: any = null;
                        let element: HTMLElement | null = null;
                        let root: ReturnType<typeof createRoot> | null = null;
                        let selectedIndex = 0;
                        let currentItems: Array<{
                            id: number;
                            label: string;
                            description?: string;
                            icon?: string;
                            type: 'user' | 'task';
                        }> = [];
                        let currentCommand: ((item: { id: string; label: string; type: 'user' | 'task' }) => void) | null = null;

                        return {
                            onStart: (props) => {
                                element = document.createElement('div');
                                root = createRoot(element);
                                selectedIndex = 0;
                                currentItems = props.items;
                                currentCommand = props.command;

                                popup = tippy(document.body, {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });

                                root.render(
                                    <AvatarCacheProvider>
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    </AvatarCacheProvider>
                                );
                            },
                            onUpdate: (props) => {
                                if (!popup || !element || !root) return;
                                currentItems = props.items;
                                currentCommand = props.command;

                                popup.setProps({
                                    getReferenceClientRect: props.clientRect,
                                });

                                root.render(
                                    <AvatarCacheProvider>
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    </AvatarCacheProvider>
                                );
                            },
                            onKeyDown: (props) => {
                                if (props.event.key === 'ArrowUp') {
                                    props.event.preventDefault();
                                    props.event.stopPropagation();
                                    props.event.stopImmediatePropagation();
                                    selectedIndex = selectedIndex <= 0 ? currentItems.length - 1 : selectedIndex - 1;
                                    root?.render(
                                        <AvatarCacheProvider>
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
                                        </AvatarCacheProvider>
                                    );
                                    return true;
                                }

                                if (props.event.key === 'ArrowDown') {
                                    props.event.preventDefault();
                                    props.event.stopPropagation();
                                    props.event.stopImmediatePropagation();
                                    selectedIndex = selectedIndex >= currentItems.length - 1 ? 0 : selectedIndex + 1;
                                    root?.render(
                                        <AvatarCacheProvider>
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
                                        </AvatarCacheProvider>
                                    );
                                    return true;
                                }

                                if (props.event.key === 'Enter' || props.event.key === 'Tab') {
                                    props.event.preventDefault();
                                    props.event.stopPropagation();
                                    props.event.stopImmediatePropagation();
                                    if (currentItems[selectedIndex] && currentCommand) {
                                        currentCommand({
                                            id: String(currentItems[selectedIndex].id),
                                            label: currentItems[selectedIndex].label,
                                            type: currentItems[selectedIndex].type
                                        });
                                        popup?.destroy();
                                    }
                                    return true;
                                }

                                return false;
                            },
                            onExit: () => {
                                popup?.destroy();
                                root?.unmount();
                                element?.remove();
                            },
                        };
                    },
                }
            }),
            TaskMention.configure({
                HTMLAttributes: {
                    class: 'mention mention-task cursor-pointer',
                    'data-type': 'task'
                },
                suggestion: {
                    char: '#',
                    pluginKey: taskMentionPluginKey,
                    items: ({ query }) => {
                        const allTasks = tasksRef.current || [];
                        return allTasks
                            .filter(task =>
                                `${task.team_ref_number} ${task.title}`.toLowerCase().includes(query.toLowerCase())
                            )
                            .map(task => ({
                                id: task.id,
                                label: `${task.team_ref_number} ${task.title}`,
                                type: 'task' as const
                            }));
                    },
                    render: () => {
                        let popup: any = null;
                        let element: HTMLElement | null = null;
                        let root: ReturnType<typeof createRoot> | null = null;
                        let selectedIndex = 0;
                        let currentItems: Array<{
                            id: number;
                            label: string;
                            type: 'task';
                        }> = [];
                        let currentCommand: ((item: { id: string; label: string; type: 'task' }) => void) | null = null;

                        return {
                            onStart: (props) => {
                                element = document.createElement('div');
                                root = createRoot(element);
                                selectedIndex = 0;
                                currentItems = props.items;
                                currentCommand = props.command;

                                popup = tippy(document.body, {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });

                                root.render(
                                    <AvatarCacheProvider>
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    </AvatarCacheProvider>
                                );
                            },
                            onUpdate: (props) => {
                                if (!popup || !element || !root) return;
                                currentItems = props.items;
                                currentCommand = props.command;

                                popup.setProps({
                                    getReferenceClientRect: props.clientRect,
                                });

                                root.render(
                                    <AvatarCacheProvider>
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    </AvatarCacheProvider>
                                );
                            },
                            onKeyDown: (props) => {
                                if (props.event.key === 'ArrowUp') {
                                    props.event.preventDefault();
                                    props.event.stopPropagation();
                                    props.event.stopImmediatePropagation();
                                    selectedIndex = selectedIndex <= 0 ? currentItems.length - 1 : selectedIndex - 1;
                                    root?.render(
                                        <AvatarCacheProvider>
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
                                        </AvatarCacheProvider>
                                    );
                                    return true;
                                }

                                if (props.event.key === 'ArrowDown') {
                                    props.event.preventDefault();
                                    props.event.stopPropagation();
                                    props.event.stopImmediatePropagation();
                                    selectedIndex = selectedIndex >= currentItems.length - 1 ? 0 : selectedIndex + 1;
                                    root?.render(
                                        <AvatarCacheProvider>
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
                                        </AvatarCacheProvider>
                                    );
                                    return true;
                                }

                                if (props.event.key === 'Enter' || props.event.key === 'Tab') {
                                    props.event.preventDefault();
                                    props.event.stopPropagation();
                                    props.event.stopImmediatePropagation();
                                    if (currentItems[selectedIndex] && currentCommand) {
                                        currentCommand({
                                            id: String(currentItems[selectedIndex].id),
                                            label: currentItems[selectedIndex].label,
                                            type: currentItems[selectedIndex].type
                                        });
                                        popup?.destroy();
                                    }
                                    return true;
                                }

                                return false;
                            },
                            onExit: () => {
                                popup?.destroy();
                                root?.unmount();
                                element?.remove();
                            },
                        };
                    },
                }
            }),
            SlashCommands.configure({
                suggestion: {
                    items: ({ query }: { query: string }) => {
                        const commands = getCommands(editorRef.current!);
                        return commands.filter(item =>
                            item.title.toLowerCase().includes(query.toLowerCase())
                        );
                    },
                    render: () => {
                        let popup: any = null;
                        let element: HTMLElement | null = null;
                        let root: ReturnType<typeof createRoot> | null = null;
                        let selectedIndex = 0;

                        const updateList = (items: CommandItem[], command: (item: CommandItem) => void) => {
                            if (!root) return;

                            root.render(
                                <CommandMenu
                                    items={items}
                                    selectedIndex={selectedIndex}
                                    command={command}
                                />
                            );
                        };

                        return {
                            onStart: (props) => {
                                element = document.createElement('div');
                                root = createRoot(element);
                                selectedIndex = 0;

                                popup = tippy(document.body, {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                    maxWidth: 'none',
                                });

                                updateList(props.items, props.command);
                            },
                            onUpdate: (props) => {
                                selectedIndex = props.selectedIndex || 0;
                                updateList(props.items, props.command);

                                popup?.setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown: (props) => {
                                if (!props.items.length) return false;

                                if (props.event.key === 'ArrowUp') {
                                    selectedIndex = ((selectedIndex + props.items.length - 1) % props.items.length);
                                    updateList(props.items, props.command);
                                    return true;
                                }

                                if (props.event.key === 'ArrowDown') {
                                    selectedIndex = ((selectedIndex + 1) % props.items.length);
                                    updateList(props.items, props.command);
                                    return true;
                                }

                                if (props.event.key === 'Enter' || props.event.key === 'Tab') {
                                    const item = props.items[selectedIndex];
                                    if (item) {
                                        props.command(item);
                                    }
                                    return true;
                                }

                                if (props.event.key === 'Escape') {
                                    popup?.destroy();
                                    return true;
                                }

                                return false;
                            },
                            onExit: () => {
                                popup?.destroy();
                                root?.unmount();
                                element?.remove();
                            },
                        };
                    },
                },
            }),
        ],
        content: EMPTY_DOC,
        editable: editable && provider?.wsconnected,
        onCreate: () => {
            if (provider?.wsconnected && provider?.synced) {
                if (!isContentLoaded) {
                    loadContent();
                }
            }
        },
        onUpdate: ({ editor }) => {
            if (!provider?.wsconnected || !isContentLoaded) return;

            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }

            const content = editor.getJSON();
            if (content.content?.length > 0) {
                debouncedSave(content);
            }
        },
        editorProps: {
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                if (target.hasAttribute('data-type') && target.hasAttribute('data-id')) {
                    const type = target.getAttribute('data-type') as 'user' | 'task';
                    const id = target.getAttribute('data-id');
                    if (id && onMentionClick) {
                        onMentionClick(type, id);
                    }
                    return true;
                }
                return false;
            },
        },
    }), [ydoc, provider, section, currentUserId, editable, isContentLoaded, participants, onMentionClick]);

    // Initialize editor with memoized configuration
    useEffect(() => {
        const editor = new Editor(editorConfig);
        editorRef.current = editor;

        return () => {
            editor.destroy();
        };
    }, [editorConfig]);

    // Update editor state when provider connection changes
    useEffect(() => {
        if (editorRef.current && provider) {
            editorRef.current.setEditable(editable && provider.wsconnected);
        }
    }, [provider?.wsconnected, editable]);

    useEffect(() => {
        if (!provider) return;

        const handleStatus = ({ status }: { status: string }) => {
            setIsProviderConnected(status === 'connected');
            if (editorRef.current) {
                editorRef.current.setEditable(editable && status === 'connected');
            }
        };

        provider.on('status', handleStatus);
        return () => {
            provider.off('status', handleStatus);
        };
    }, [provider, editable]);

    // Monitor provider sync status
    useEffect(() => {
        if (!editorRef.current || !provider || !ydoc) return;

        try {
            const handleSync = (isSynced: boolean) => {
                if (isSynced && !hasLoadedFromDB.current) {
                    hasLoadedFromDB.current = true;
                    loadContent();
                }
            };

            provider.on('sync', handleSync);

            if (provider.synced && !hasLoadedFromDB.current) {
                hasLoadedFromDB.current = true;
                loadContent();
            }

            return () => {
                provider.off('sync', handleSync);
                hasLoadedFromDB.current = false;
            };
        } catch (error) {
            console.error('[YJS] Error setting up text sync:', error);
        }
    }, [editorRef.current, provider, ydoc, section]);

    // Memoize task creation handler
    const handleTaskCreate = useCallback(async (task: Task) => {
        if (!editorRef.current || !provider?.wsconnected) {
            console.error('[Task Creation] Editor not ready or provider not connected');
            return;
        }

        try {
            // Store the current editor state and view
            const { state, view } = editorRef.current;
            const { from } = state.selection;

            console.log('[Task Creation] Creating task:', task.title);

            // Create the task first and wait for it to complete
            const newTask = await createTask({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                type: task.type,
                team: { id: teamId, name: '' },
                start_date: null,
                due_date: null,
                assignee_id: null,
                labels: [],
                category: 'GENERAL'
            });

            console.log('[Task Creation] Task created:', newTask);

            if (!newTask || !newTask.id) {
                throw new Error('Task creation failed or returned invalid data');
            }

            // Update local tasks reference without triggering re-render
            if (tasksRef.current) {
                const updatedTasks = [...tasksRef.current];
                const existingIndex = updatedTasks.findIndex(t => t.id === Number(newTask.id));
                if (existingIndex >= 0) {
                    updatedTasks[existingIndex] = {
                        id: Number(newTask.id),
                        title: newTask.title,
                        team_ref_number: newTask.team_ref_number || ''
                    };
                } else {
                    updatedTasks.push({
                        id: Number(newTask.id),
                        title: newTask.title,
                        team_ref_number: newTask.team_ref_number || ''
                    });
                }
                tasksRef.current = updatedTasks;
            }

            // Ensure we're still connected and have the document
            if (!provider.doc) {
                throw new Error('Provider document not available');
            }

            console.log('[Task Creation] Inserting mention at position:', from);

            // Create the task mention node
            const mentionNode = state.schema.nodes.taskMention.create({
                id: String(newTask.id),
                label: `${newTask.team_ref_number} ${newTask.title}`,
                type: 'task'
            });

            // Use a Yjs transaction to ensure synchronization
            provider.doc.transact(() => {
                // Insert the mention node at the stored position
                const tr = view.state.tr.insert(from, mentionNode);

                // Preserve selection after insertion
                const newPos = from + 1;
                tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newPos)));

                view.dispatch(tr);
                view.focus();
            });

            console.log('[Task Creation] Mention inserted successfully');

            // Close the task modal
            setShowQuickTaskModal(false);

        } catch (error) {
            console.error('[Task Creation] Error:', error);
            toast({
                title: "Error creating task",
                description: "Failed to create task. Please try again.",
                variant: "destructive"
            });
        }
    }, [provider, teamId, createTask, toast]);

    return (
        <>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium tracking-tight">
                            {sectionTitle}
                        </h3>
                        {!editable && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                View only
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2 min-w-[60px] justify-end">
                        {showSaving && (
                            <span
                                className={`text-xs flex items-center transition-opacity duration-500
                                    ${saveStatus === 'saving' ? 'opacity-100' :
                                        saveStatus === 'saved' ? 'opacity-100' :
                                            'opacity-0'}`}
                            >
                                {saveStatus === 'saving' ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-muted-foreground">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-green-600">Saved</span>
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 p-3 relative min-h-[150px]">
                    <EditorContent
                        editor={editorRef.current}
                        className={`prose prose-sm max-w-none focus:outline-none ${!editable ? 'opacity-75 cursor-not-allowed' : ''}`}
                        data-placeholder={`Add your ${sectionTitle.toLowerCase()} notes here...`}
                    />
                </div>
            </div>

            <QuickTaskModal
                isOpen={showQuickTaskModal}
                onClose={() => setShowQuickTaskModal(false)}
                onTaskCreate={handleTaskCreate}
                teamId={teamId}
                initialTitle={taskInitialTitle}
            />
        </>
    );
}