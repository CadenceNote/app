// File: components/meetings/RealtimeNoteEditor.tsx
'use client';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';
import { useEffect, useRef, useState } from 'react';
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
    command: (item: { id: number; label: string; type: 'user' | 'task' }) => void;
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
                                        {item.icon ? (
                                            <img src={item.icon} alt="" className="h-6 w-6 rounded-full" />
                                        ) : (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                                {item.label.charAt(0)}
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



// Add SlashCommands extension
const SlashCommands = Extension.create<SlashCommandsOptions>({
    name: 'slashCommands',

    addProseMirrorPlugins() {
        const plugin = new Plugin({
            key: new PluginKey('slashCommands'),
            props: {
                handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
                    if (event.key === '/') {
                        const { state } = view;
                        const { selection } = state;
                        const { $from } = selection;

                        // Check if we're at the start of a line or after a space
                        const isStart = $from.parentOffset === 0;
                        const textBefore = $from.nodeBefore?.text;
                        const isAfterSpace = textBefore?.endsWith(' ') || textBefore?.endsWith('\n');

                        if (isStart || isAfterSpace) {
                            // Show command menu
                            let element = document.createElement('div');
                            let root = createRoot(element);
                            let popup: TippyInstance | null = null;
                            let selectedIndex = 0;
                            let isCleaningUp = false;
                            let isDestroyed = false;

                            const cleanup = () => {
                                if (isCleaningUp || isDestroyed) return;
                                isCleaningUp = true;

                                // Remove event listeners first
                                document.removeEventListener('keydown', handleKeyDown, { capture: true });
                                document.removeEventListener('click', handleClickOutside);

                                // Clean up tippy
                                if (popup) {
                                    popup.destroy();
                                    popup = null;
                                }

                                // Clean up React root
                                if (root) {
                                    root.unmount();
                                }

                                // Clean up DOM
                                if (element) {
                                    element.remove();
                                }

                                isDestroyed = true;
                                isCleaningUp = false;
                            };

                            const handleClickOutside = (e: MouseEvent) => {
                                if (!element?.contains(e.target as Node)) {
                                    cleanup();
                                }
                            };

                            const renderCommandMenu = () => {
                                if (isDestroyed) return;
                                root.render(
                                    <div className="overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                                        <button
                                            className={cn(
                                                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                                selectedIndex === 0
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-accent/50 hover:text-accent-foreground"
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                // Delete the slash character first
                                                view.dispatch(
                                                    view.state.tr.delete(
                                                        $from.pos - (isAfterSpace ? 0 : 1),
                                                        $from.pos
                                                    )
                                                );

                                                // Call the onCommand callback
                                                this.options.onCommand?.('createTask', {
                                                    range: { from: $from.pos, to: $from.pos }
                                                });

                                                // Clean up
                                                cleanup();
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span>Create Task</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Create a new task and mention it
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                );
                            };

                            const handleKeyDown = (event: KeyboardEvent) => {
                                if (isDestroyed) return false;

                                // Only prevent default for specific keys
                                if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(event.key)) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }

                                if (event.key === 'Escape' || event.key === 'Backspace') {
                                    // Delete the slash character on backspace
                                    if (event.key === 'Backspace') {
                                        view.dispatch(
                                            view.state.tr.delete(
                                                $from.pos - (isAfterSpace ? 0 : 1),
                                                $from.pos
                                            )
                                        );
                                    }
                                    cleanup();
                                    return true;
                                }

                                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                                    selectedIndex = 0; // Only one option for now
                                    renderCommandMenu();
                                    return true;
                                }

                                if (event.key === 'Enter' || event.key === 'Tab') {
                                    // Delete the slash character first
                                    view.dispatch(
                                        view.state.tr.delete(
                                            $from.pos - (isAfterSpace ? 0 : 1),
                                            $from.pos
                                        )
                                    );

                                    // Call the onCommand callback
                                    this.options.onCommand?.('createTask', {
                                        range: { from: $from.pos, to: $from.pos }
                                    });

                                    // Clean up
                                    cleanup();
                                    return true;
                                }

                                return false;
                            };

                            // Insert the slash character
                            // view.dispatch(
                            //     view.state.tr.insertText('/')
                            // );

                            renderCommandMenu();

                            const coords = view.coordsAtPos($from.pos);
                            popup = tippy(document.body, {
                                getReferenceClientRect: () => ({
                                    top: coords.top,
                                    bottom: coords.bottom,
                                    left: coords.left,
                                    right: coords.left,
                                    width: 0,
                                    height: coords.bottom - coords.top,
                                    x: coords.left,
                                    y: coords.top,
                                }),
                                appendTo: () => document.body,
                                content: element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                                onHide: () => {
                                    if (!isCleaningUp) {
                                        cleanup();
                                    }
                                }
                            });

                            // Add keyboard event listener with capture to prevent only specific keys
                            document.addEventListener('keydown', handleKeyDown, { capture: true });

                            // Add click outside handler after a small delay to prevent immediate trigger
                            setTimeout(() => {
                                if (!isDestroyed) {
                                    document.addEventListener('click', handleClickOutside);
                                }
                            }, 0);

                            return true;
                        }
                    }
                    return false;
                },
            },
        });

        return [plugin];
    },

    addOptions() {
        return {
            onCommand: undefined,
        };
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
    onTaskCreate,
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
    onTaskCreate?: (task: any) => void;
    teamId: number;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [showSaving, setShowSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'hidden'>('hidden');
    const [isContentLoaded, setIsContentLoaded] = useState(false);
    const [isProviderConnected, setIsProviderConnected] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [commandRange, setCommandRange] = useState<{ from: number; to: number } | null>(null);

    const prevTasksRef = useRef(tasks);
    const editorRef = useRef<Editor | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const isInitialLoad = useRef(true);
    const hasLoadedFromDB = useRef(false);

    // Create a key that changes when important dependencies change
    const editorKey = `${section}-${currentUserId}-${participants.length}`;

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
                await supabase
                    .from('meeting_note_blocks')
                    .upsert({
                        meeting_id: meetingId,
                        participant_id: currentUserId,
                        type: section,
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
            const { data } = await supabase
                .from('meeting_note_blocks')
                .select('content')
                .eq('meeting_id', meetingId)
                .eq('type', section)
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

    // Editor initialization with mentions and slash commands
    useEffect(() => {


        const editor = new Editor({
            extensions: [
                StarterKit.configure({
                    history: false,
                }),
                Collaboration.configure({
                    document: ydoc || new Y.Doc(),
                    field: section,
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
                // Add Mention extensions
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
                            let popup: TippyInstance | null = null;
                            let element: HTMLElement | null = null;
                            let root: ReturnType<typeof createRoot> | null = null;
                            let selectedIndex = 0;
                            let currentItems: any[] = [];
                            let currentCommand: ((item: any) => void) | null = null;

                            return {
                                onStart: (props) => {
                                    element = document.createElement('div');
                                    root = createRoot(element);
                                    selectedIndex = 0;
                                    currentItems = props.items || [];
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
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    );
                                },
                                onUpdate: (props) => {
                                    if (!popup || !element || !root) return;
                                    currentItems = props.items || [];
                                    currentCommand = props.command;

                                    popup.setProps({
                                        getReferenceClientRect: props.clientRect,
                                    });

                                    root.render(
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    );
                                },
                                onKeyDown: (props) => {
                                    if (props.event.key === 'ArrowUp') {
                                        props.event.preventDefault();
                                        props.event.stopPropagation();
                                        props.event.stopImmediatePropagation();
                                        selectedIndex = selectedIndex <= 0 ? currentItems.length - 1 : selectedIndex - 1;
                                        root?.render(
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
                                        );
                                        return true;
                                    }

                                    if (props.event.key === 'ArrowDown') {
                                        props.event.preventDefault();
                                        props.event.stopPropagation();
                                        props.event.stopImmediatePropagation();
                                        selectedIndex = selectedIndex >= currentItems.length - 1 ? 0 : selectedIndex + 1;
                                        root?.render(
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
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
                // Task mentions with #
                TaskMention.configure({
                    HTMLAttributes: {
                        class: 'mention mention-task cursor-pointer',
                        'data-type': 'task'
                    },
                    suggestion: {
                        char: '#',
                        pluginKey: taskMentionPluginKey,
                        items: ({ query }) => {
                            // Use both prevTasksRef.current and tasks to ensure we have the latest tasks
                            const allTasks = tasks ? [...tasks] : [];

                            // Add any tasks from prevTasksRef that aren't in tasks
                            if (prevTasksRef.current) {
                                prevTasksRef.current.forEach(prevTask => {
                                    if (!allTasks.some(t => t.id === prevTask.id)) {
                                        allTasks.push(prevTask);
                                    }
                                });
                            }

                            // Sort tasks by id descending to show newest first
                            allTasks.sort((a, b) => b.id - a.id);

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
                            let popup: TippyInstance | null = null;
                            let element: HTMLElement | null = null;
                            let root: ReturnType<typeof createRoot> | null = null;
                            let selectedIndex = 0;
                            let currentItems: any[] = [];
                            let currentCommand: ((item: any) => void) | null = null;

                            return {
                                onStart: (props) => {
                                    element = document.createElement('div');
                                    root = createRoot(element);
                                    selectedIndex = 0;
                                    currentItems = props.items || [];
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
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    );
                                },
                                onUpdate(props) {
                                    if (!popup || !element || !root) return;
                                    currentItems = props.items || [];
                                    currentCommand = props.command;

                                    root.render(
                                        <MentionList
                                            items={currentItems}
                                            command={currentCommand}
                                            selectedIndex={selectedIndex}
                                        />
                                    );
                                    popup.setProps({
                                        getReferenceClientRect: props.clientRect,
                                    });
                                },
                                onKeyDown: (props) => {
                                    if (props.event.key === 'ArrowUp') {
                                        props.event.preventDefault();
                                        props.event.stopPropagation();
                                        props.event.stopImmediatePropagation();
                                        selectedIndex = selectedIndex <= 0 ? currentItems.length - 1 : selectedIndex - 1;
                                        root?.render(
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
                                        );
                                        return true;
                                    }

                                    if (props.event.key === 'ArrowDown') {
                                        props.event.preventDefault();
                                        props.event.stopPropagation();
                                        props.event.stopImmediatePropagation();
                                        selectedIndex = selectedIndex >= currentItems.length - 1 ? 0 : selectedIndex + 1;
                                        root?.render(
                                            <MentionList
                                                items={currentItems}
                                                command={currentCommand}
                                                selectedIndex={selectedIndex}
                                            />
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
                                    if (popup) {
                                        popup.destroy();
                                        popup = null;
                                    }
                                    if (root) {
                                        root.unmount();
                                        root = null;
                                    }
                                    if (element) {
                                        element.remove();
                                        element = null;
                                    }
                                },
                            };
                        },
                    }
                }),
                SlashCommands.configure({
                    onCommand: (command: string, attrs: { range: { from: number; to: number } }) => {
                        if (command === 'createTask') {
                            // Store the range for later deletion
                            setCommandRange({
                                from: attrs.range.from - 1, // Include the slash
                                to: attrs.range.to
                            });
                            setShowTaskModal(true);
                        }
                    },
                }),

            ],
            content: EMPTY_DOC,
            editable: editable && provider?.wsconnected,
            onCreate: () => {
                if (provider?.wsconnected && provider?.synced) {
                    loadContent();
                }
            },
            onUpdate: ({ editor }) => {
                if (!provider?.wsconnected || !isContentLoaded) return;

                isInitialLoad.current = false;

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
                // handleKeyDown: (view, event) => {
                //     // Check if we have an active suggestion
                //     const userSuggestion = userMentionPluginKey.getState(view.state);
                //     const taskSuggestion = taskMentionPluginKey.getState(view.state);
                //     const slashCommandsState = view.state.plugins.find(plugin => plugin.key?.toString() === 'slashCommands')?.getState(view.state);

                //     // If any suggestion or command menu is active, let the suggestion handler deal with it
                //     if ((userSuggestion && userSuggestion.active) ||
                //         (taskSuggestion && taskSuggestion.active) ||
                //         slashCommandsState) {
                //         return false; // Return false to let the suggestion handler handle the event
                //     }

                //     return false;
                // },
            },

        });

        editorRef.current = editor;

        return () => {
            editor.destroy();
        };
    }, [provider, ydoc, section, currentUserId, participants, editable, tasks]);

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
            // const ytext = ydoc.get(section, Y.XmlFragment);

            // const observer = () => {
            //     console.log('[YJS] Text updated:', {
            //         section,
            //         connected: provider.wsconnected,
            //         synced: provider.synced
            //     });
            // };

            // ytext.observe(observer);

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
                // ytext.unobserve(observer);
                provider.off('sync', handleSync);
                hasLoadedFromDB.current = false;
            };
        } catch (error) {
            console.error('[YJS] Error setting up text sync:', error);
        }
    }, [editorRef.current, provider, ydoc, section]);

    // Handle task creation
    const handleTaskCreate = (task: Task) => {
        if (editorRef.current && commandRange) {
            // Delete the slash command text first
            editorRef.current.chain().focus().deleteRange({
                from: commandRange.from,
                to: commandRange.to
            }).run();

            // Insert task mention at the command range position
            editorRef.current.chain()
                .focus()
                .insertContentAt(commandRange.from, [{
                    type: 'taskMention',
                    attrs: {
                        id: String(task.id),
                        label: `${task.team_ref_number} ${task.title}`,
                        type: 'task'
                    }
                }])
                .run();

            // Clear command range
            setCommandRange(null);
        }

        // Close modal
        setShowTaskModal(false);

        // Update tasks list immediately
        if (tasks) {
            const updatedTasks = [...tasks];
            const existingIndex = updatedTasks.findIndex(t => t.id === task.id);
            if (existingIndex >= 0) {
                updatedTasks[existingIndex] = task;
            } else {
                updatedTasks.push(task);
            }
            prevTasksRef.current = updatedTasks;
        }

        // Call onTaskCreate to update parent's task list
        if (onTaskCreate) {
            onTaskCreate(task);
        }
    };

    return (
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
                    key={editorKey}
                    editor={editorRef.current}
                    className={`prose prose-sm max-w-none focus:outline-none ${!editable ? 'opacity-75 cursor-not-allowed' : ''}`}
                    data-placeholder={`Add your ${sectionTitle.toLowerCase()} notes here...`}
                />
            </div>

            {showTaskModal && (
                <TaskDetail
                    isOpen={showTaskModal}
                    onClose={() => {
                        setShowTaskModal(false);
                        setCommandRange(null); // Clear command range if modal is closed without creating task
                    }}
                    task={undefined}
                    teamId={teamId}
                    onTaskUpdate={handleTaskDetailUpdate}
                />
            )}
        </div>
    );
}