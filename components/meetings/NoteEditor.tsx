"use client";
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { Mention } from '@tiptap/extension-mention';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { createRoot } from 'react-dom/client';
import { PluginKey } from 'prosemirror-state';
import { Editor, Range } from '@tiptap/core';
import { TaskDetail } from '../tasks/TaskDetail';
import { Task } from '@/lib/types/task';
import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { cn } from '@/lib/utils';

declare module '@tiptap/extension-mention' {
    interface MentionOptions {
        renderLabel?: (props: { node: { attrs: { id: string; label: string; type: 'user' | 'task' } } }) => string;
    }
}

interface MentionNodeAttrs {
    id: string;
    label: string;
    type: 'user' | 'task';
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

// Create unique plugin keys for each mention type
const userMentionPluginKey = new PluginKey('userMention');
const taskMentionPluginKey = new PluginKey('taskMention');

// Create custom mention extensions
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

interface SlashCommandsOptions {
    onCommand?: (command: string, attrs: { range: { from: number; to: number } }) => void;
}

// Create a custom slash commands extension
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

export function NoteEditor({
    content,
    onChange,
    onDelete,
    onEnterKey,
    onMention,
    onMentionClick,
    participants,
    tasks,
    placeholder,
    readOnly,
    onTaskCreate,
    teamId
}: NoteEditorProps) {
    const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
    const contentRef = useRef(content);
    const prevTasksRef = useRef(tasks);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [commandRange, setCommandRange] = useState<{ from: number; to: number } | null>(null);
    const [editor, setEditor] = useState<ReturnType<typeof useEditor> | null>(null);

    // Create editor instance
    const editorInstance = useEditor({
        extensions: [
            StarterKit.configure({
                history: {},
                bulletList: {},
                orderedList: {},
                listItem: {},
                bold: {},
                italic: {},
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Type your note here...',
            }),
            // User mentions with @
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

                        console.log('Task mention suggestion - allTasks:', allTasks);
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
                                console.log('Task mention suggestion started', props);
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
        content,
        onUpdate: ({ editor }) => {
            const newContent = editor.getHTML();
            if (newContent !== contentRef.current) {
                onChange(newContent);
            }
        },
        editable: !readOnly,
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
            handleKeyDown: (view, event) => {
                // Check if we have an active suggestion
                const userSuggestion = userMentionPluginKey.getState(view.state);
                const taskSuggestion = taskMentionPluginKey.getState(view.state);
                const slashCommandsState = view.state.plugins.find(plugin => plugin.key?.toString() === 'slashCommands')?.getState(view.state);

                // If any suggestion or command menu is active, let the suggestion handler deal with it
                if ((userSuggestion && userSuggestion.active) ||
                    (taskSuggestion && taskSuggestion.active) ||
                    slashCommandsState) {
                    return false; // Return false to let the suggestion handler handle the event
                }

                // Handle Enter key for new note creation when no suggestions are active
                if (event.key === 'Enter' && !event.shiftKey && onEnterKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    onEnterKey();
                    return true;
                }

                return false;
            },
            handleDOMEvents: {
                focus: () => {
                    // Ensure content is up to date when editor gains focus
                    if (editor && contentRef.current !== editor.getHTML()) {
                        editor.commands.setContent(contentRef.current, false);
                    }
                    return false;
                },
                blur: () => {
                    // Save current content when editor loses focus
                    if (editor) {
                        contentRef.current = editor.getHTML();
                    }
                    return false;
                }
            }
        },
        enableInputRules: false,
        enablePasteRules: false,
        immediatelyRender: false,
        autofocus: false
    });

    // Keep contentRef in sync
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Update task mentions when tasks change
    useEffect(() => {
        if (!editor || tasks === prevTasksRef.current) return;

        const updatedTasks = tasks.filter(task => {
            const prevTask = prevTasksRef.current.find(t => t.id === task.id);
            return prevTask && (prevTask.title !== task.title || prevTask.team_ref_number !== task.team_ref_number);
        });

        if (updatedTasks.length > 0) {
            // Update task mentions in the editor
            const content = editor.getHTML();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;

            let hasChanges = false;
            tempDiv.querySelectorAll('span[data-type="task"]').forEach(element => {
                const taskId = element.getAttribute('data-id');
                const updatedTask = updatedTasks.find(t => String(t.id) === taskId);
                if (updatedTask) {
                    const newLabel = `${updatedTask.team_ref_number} ${updatedTask.title}`;
                    if (element.textContent !== `#${newLabel}`) {
                        element.textContent = `#${newLabel}`;
                        element.setAttribute('data-label', newLabel);
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                editor.commands.setContent(tempDiv.innerHTML);
                onChange(tempDiv.innerHTML);
            }
        }

        prevTasksRef.current = tasks;
    }, [tasks, editor, onChange]);

    // Store editor reference
    useEffect(() => {
        editorRef.current = editorInstance;
        setEditor(editorInstance);
        return () => {
            editorRef.current?.destroy();
        };
    }, [editorInstance]);

    // Handle content updates
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            const currentContent = editor.getHTML();

            if (content !== currentContent) {
                editor.commands.setContent(content, false);
            }
        }
    }, [content, editor]);

    // Handle focus/blur
    useEffect(() => {
        const handleVisibilityChange = () => {

            if (document.visibilityState === 'visible' && editor) {
                const currentContent = editor.getHTML();
                if (content !== currentContent) {
                    editor.commands.setContent(content, false);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [editor, content]);

    // Handle task creation and mention insertion
    const handleTaskCreate = (task: Task) => {
        console.log("handleTaskCreate called with task:", task);
        if (editor && commandRange) {
            // Delete the slash command text first
            editor.chain().focus().deleteRange({
                from: commandRange.from,
                to: commandRange.to
            }).run();

            // Insert task mention at the command range position
            editor.chain()
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

    // Create a wrapper for TaskDetail's onTaskUpdate
    const handleTaskDetailUpdate = (task: Task) => {
        console.log("handleTaskDetailUpdate called with task:", task);
        handleTaskCreate(task);
    };

    if (!editor) {
        return null;
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div className="relative w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                        <style jsx global>{`
                            .ProseMirror {
                                outline: none !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            .ProseMirror:focus {
                                outline: none !important;
                                border: none !important;
                                box-shadow: none !important;
                                ring: 0 !important;
                            }
                            .mention {
                                display: inline-flex;
                                align-items: center;
                                border-radius: 9999px;
                                padding: 0.125rem 0.5rem;
                                font-weight: 500;
                                white-space: nowrap;
                                font-size: 0.875rem;
                                line-height: 1.25rem;
                                border: 1px solid transparent;
                                cursor: pointer;
                                transition: all 150ms ease;
                                margin: 0 0.125rem;
                            }
                            .mention:hover {
                                opacity: 0.8;
                            }
                            .mention-user {
                                background: rgb(var(--primary) / 0.1);
                                color: rgb(var(--primary));
                                border-color: rgb(var(--primary) / 0.2);
                            }
                            .mention-task {
                                background: rgb(var(--secondary) / 0.1);
                                color: rgb(var(--secondary));
                                border-color: rgb(var(--secondary) / 0.2);
                                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                            }
                        `}</style>
                        <EditorContent editor={editor} />
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {onDelete && (
                        <ContextMenuItem
                            onSelect={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            Delete Note
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>

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
        </>
    );
} 