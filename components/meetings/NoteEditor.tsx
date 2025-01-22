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
}

const MentionList = ({ items, command }: MentionListProps) => {
    return (
        <div className="overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {items.length > 0 ? (
                <>
                    {items.some(item => item.type === 'user') && (
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Users</div>
                    )}
                    {items.filter(item => item.type === 'user').map(item => (
                        <button
                            key={`user-${item.id}`}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => command(item)}
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
                    {items.some(item => item.type === 'task') && (
                        <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tasks</div>
                    )}
                    {items.filter(item => item.type === 'task').map(item => (
                        <button
                            key={`task-${item.id}`}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => command(item)}
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
                            const element = document.createElement('div');
                            const root = createRoot(element);
                            let popup: TippyInstance | null = null;

                            root.render(
                                <div className="overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                                    <button
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                        onClick={() => {
                                            // Remove the slash character
                                            view.dispatch(
                                                view.state.tr.delete(
                                                    $from.pos - (isAfterSpace ? 0 : 1),
                                                    $from.pos + 1
                                                )
                                            );

                                            // Call the onCommand callback
                                            this.options.onCommand?.('createTask', {
                                                range: { from: $from.pos, to: $from.pos }
                                            });

                                            // Clean up
                                            popup?.destroy();
                                            root.unmount();
                                            element.remove();
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
                            });

                            const handleClickOutside = (e: MouseEvent) => {
                                if (!element.contains(e.target as Node)) {
                                    popup?.destroy();
                                    root.unmount();
                                    element.remove();
                                    document.removeEventListener('click', handleClickOutside);
                                }
                            };

                            // Add click outside handler after a small delay to prevent immediate trigger
                            setTimeout(() => {
                                document.addEventListener('click', handleClickOutside);
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
    tasks = [],
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

    // Create editor instance
    const editor = useEditor({
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

                        const cleanup = () => {
                            if (popup) {
                                popup.destroy();
                                popup = null;
                            }
                            if (root) {
                                setTimeout(() => {
                                    root?.unmount();
                                    root = null;
                                }, 0);
                            }
                            if (element) {
                                element.remove();
                                element = null;
                            }
                        };

                        return {
                            onStart: (props) => {
                                element = document.createElement('div');
                                root = createRoot(element);
                                root.render(
                                    <MentionList
                                        items={props.items}
                                        command={item => {
                                            props.command({
                                                id: String(item.id),
                                                label: item.label,
                                                type: 'user'
                                            });
                                        }}
                                    />
                                );

                                popup = tippy(document.body, {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },
                            onUpdate(props) {
                                if (!popup || !element || !root) return;

                                root.render(
                                    <MentionList
                                        items={props.items}
                                        command={item => {
                                            props.command({
                                                id: String(item.id),
                                                label: item.label,
                                                type: 'user'
                                            });
                                        }}
                                    />
                                );

                                popup.setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown: handleMentionKeyDown,
                            onExit: cleanup,
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
                        console.log('Task mention query:', query);
                        console.log('Available tasks:', tasks);
                        const filteredTasks = tasks
                            .filter(task =>
                                `${task.team_ref_number} ${task.title}`.toLowerCase().includes(query.toLowerCase())
                            )
                            .map(task => ({
                                id: task.id,
                                label: `${task.team_ref_number} ${task.title}`,
                                type: 'task' as const
                            }));
                        console.log('Filtered tasks:', filteredTasks);
                        return filteredTasks;
                    },
                    render: () => {
                        let popup: TippyInstance | null = null;
                        let element: HTMLElement | null = null;
                        let root: ReturnType<typeof createRoot> | null = null;

                        const cleanup = () => {
                            console.log('Cleaning up task mention popup');
                            if (popup) {
                                popup.destroy();
                                popup = null;
                            }
                            if (root) {
                                setTimeout(() => {
                                    root?.unmount();
                                    root = null;
                                }, 0);
                            }
                            if (element) {
                                element.remove();
                                element = null;
                            }
                        };

                        return {
                            onStart: (props) => {
                                console.log('Task mention suggestion started', props);
                                element = document.createElement('div');
                                root = createRoot(element);

                                root.render(
                                    <MentionList
                                        items={props.items}
                                        command={item => {
                                            console.log('Task mention selected:', item);
                                            props.command({
                                                id: String(item.id),
                                                label: item.label,
                                                type: 'task'
                                            });
                                        }}
                                    />
                                );

                                popup = tippy(document.body, {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },
                            onUpdate(props) {
                                if (!popup || !element || !root) return;

                                root.render(
                                    <MentionList
                                        items={props.items}
                                        command={item => {
                                            console.log('Task mention selected:', item);
                                            props.command({
                                                id: String(item.id),
                                                label: item.label,
                                                type: 'task'
                                            });
                                        }}
                                    />
                                );

                                popup.setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown: handleMentionKeyDown,
                            onExit: cleanup,
                        };
                    },
                }
            }),
            SlashCommands.configure({
                onCommand: (command: string, attrs: { range: { from: number; to: number } }) => {
                    if (command === 'createTask') {
                        setCommandRange(attrs.range);
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
                if (event.key === 'Enter' && !event.shiftKey) {
                    if (onEnterKey) {
                        event.preventDefault();
                        onEnterKey();
                        return true;
                    }
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
        console.log('Tasks changed:', {
            newTasks: tasks,
            prevTasks: prevTasksRef.current
        });

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
        editorRef.current = editor;
        return () => {
            editorRef.current?.destroy();
        };
    }, [editor]);

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

    // Fix keyboard navigation in mention suggestions
    const handleMentionKeyDown = (props: { event: KeyboardEvent; items: any[]; command: (attrs: any) => void; selectedIndex: number }) => {
        console.log('handleMentionKeyDown called', {
            key: props.event.key,
            items: props.items,
            selectedIndex: props.selectedIndex
        });

        if (props.event.key === 'Escape') {
            console.log('Escape pressed, closing suggestion');
            return true;
        }

        // Handle keyboard navigation
        if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(props.event.key)) {
            console.log('Navigation key pressed:', props.event.key);
            props.event.preventDefault();
            const items = props.items || [];
            console.log('Available items:', items);

            if ((props.event.key === 'Enter' || props.event.key === 'Tab') && items.length > 0) {
                console.log('Selection attempted with index:', props.selectedIndex);
                const selectedItem = items[props.selectedIndex];
                if (selectedItem) {
                    console.log('Selected item:', selectedItem);
                    props.command(selectedItem);
                }
                return true;
            }

            if (items.length > 0) {
                const direction = props.event.key === 'ArrowUp' ? -1 : 1;
                const newIndex = (props.selectedIndex + direction + items.length) % items.length;
                console.log('New selected index:', newIndex);
                props.command({ selectedIndex: newIndex });
                return true;
            }
        }
        return false;
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
                    onClose={() => setShowTaskModal(false)}
                    task={undefined}
                    teamId={teamId}
                    onTaskUpdate={onTaskCreate}
                />
            )}
        </>
    );
} 