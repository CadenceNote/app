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
import { debounce } from '@/lib/utils';

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

export function RealtimeNoteEditor({
    ydoc,
    provider,
    section,
    currentUserId,
    meetingId,
    participants,
    editable = true,
    sectionTitle,
}: {
    ydoc: Y.Doc | null;
    provider: WebsocketProvider | null;
    section: string;
    currentUserId: number;
    meetingId: number;
    participants: Participant[];
    editable?: boolean;
    sectionTitle: string;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [showSaving, setShowSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'hidden'>('hidden');
    const [isContentLoaded, setIsContentLoaded] = useState(false);
    const [isProviderConnected, setIsProviderConnected] = useState(false);

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
            console.log('[Editor] Loading content from DB:', section);
            const { data } = await supabase
                .from('meeting_note_blocks')
                .select('content')
                .eq('meeting_id', meetingId)
                .eq('type', section)
                .eq('participant_id', currentUserId)
                .order('version', { ascending: false })
                .limit(1);

            const content = data?.[0]?.content || EMPTY_DOC;
            console.log('[Editor] Content loaded:', {
                section,
                hasContent: !!data?.[0]?.content
            });

            isInitialLoad.current = true;
            editorRef.current.commands.setContent(content);
            setIsContentLoaded(true);
        } catch (error) {
            console.error('[Editor] Error loading content:', error);
            editorRef.current.commands.setContent(EMPTY_DOC);
            setIsContentLoaded(true);
        }
    };

    // Editor initialization with proper cleanup
    useEffect(() => {
        console.log('Editor initialization:', {
            currentUserId,
            participants,
            matchedUser: participants.find(p => p.id === currentUserId),
        });

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
                    })
                ] : []),
            ],
            content: EMPTY_DOC,
            editable: editable && provider?.wsconnected,
            onCreate: () => {
                console.log('[Editor] Initialized:', section);
                if (provider?.wsconnected && provider?.synced) {
                    loadContent();
                }
            },
            onUpdate: ({ editor }) => {
                if (!provider?.wsconnected || !isContentLoaded) return;

                isInitialLoad.current = false;

                console.log('[Editor] Content updated:', section);
                const content = editor.getJSON();
                if (content.content?.length > 0) {
                    console.log('[Editor] Saving content:', {
                        section,
                        contentLength: content.content.length,
                        connected: provider?.wsconnected,
                        synced: provider?.synced
                    });
                    debouncedSave(content);
                }
            },
        });

        editorRef.current = editor;

        return () => {
            editor.destroy();
        };
    }, [provider, ydoc, section, currentUserId, participants, editable]);

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
            const ytext = ydoc.get(section, Y.XmlFragment);

            const observer = () => {
                console.log('[YJS] Text updated:', {
                    section,
                    connected: provider.wsconnected,
                    synced: provider.synced
                });
            };

            ytext.observe(observer);

            const handleSync = (isSynced: boolean) => {
                console.log('[YJS] Provider sync changed:', {
                    section,
                    isSynced,
                    connected: provider.wsconnected
                });

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
                ytext.unobserve(observer);
                provider.off('sync', handleSync);
                hasLoadedFromDB.current = false;
            };
        } catch (error) {
            console.error('[YJS] Error setting up text sync:', error);
        }
    }, [editorRef.current, provider, ydoc, section]);

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
                <style jsx global>{`
                    .collaboration-cursor__caret {
                        border-left: 1px solid currentColor;
                        border-right: 1px solid currentColor;
                        margin-left: -1px;
                        margin-right: -1px;
                        pointer-events: none;
                        word-break: normal;
                        position: relative;
                        z-index: 20;
                    }

                    .collaboration-cursor__label {
                        position: absolute;
                        top: -1.4em;
                        left: -1px;
                        font-size: 12px;
                        font-style: normal;
                        font-weight: 600;
                        line-height: normal;
                        white-space: nowrap;
                        padding: 0.1rem 0.3rem;
                        color: white;
                        border-radius: 3px;
                        user-select: none;
                        pointer-events: none;
                        z-index: 50;
                    }

                    .ProseMirror {
                        min-height: 140px !important;
                        height: 100%;
                        padding: 0.5rem;
                        border-radius: 0.375rem;
                        background-color: transparent;
                        transition: all 0.15s ease;
                    }

                    .ProseMirror:hover {
                        background-color: hsl(var(--muted)/0.5);
                    }

                    .ProseMirror p {
                        margin: 0;
                        line-height: 1.6;
                    }

                    .ProseMirror p.is-empty::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: hsl(var(--muted-foreground));
                        pointer-events: none;
                        height: 0;
                    }

                    .ProseMirror:focus {
                        outline: none !important;
                        background-color: hsl(var(--muted)/0.7);
                    }

                    .ProseMirror > * + * {
                        margin-top: 0.5em;
                    }
                `}</style>
                <EditorContent
                    key={editorKey}
                    editor={editorRef.current}
                    className={`prose prose-sm max-w-none focus:outline-none ${!editable ? 'opacity-75 cursor-not-allowed' : ''}`}
                    data-placeholder={`Add your ${sectionTitle.toLowerCase()} notes here...`}
                />
            </div>
        </div>
    );
}