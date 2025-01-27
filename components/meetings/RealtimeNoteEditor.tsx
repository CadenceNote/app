// File: components/meetings/RealtimeNoteEditor.tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
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
    const editorRef = useRef<any>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const isInitialLoad = useRef(true);
    const hasLoadedFromDB = useRef(false);

    // Handle saving status with fade out animation
    useEffect(() => {
        // Don't show save status during initial load
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
            // Keep "Saved" visible for 2 seconds before starting fade
            saveTimeoutRef.current = setTimeout(() => {
                setSaveStatus('hidden');
                // Wait for fade animation to complete before hiding
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
        }, 1000)
    ).current;

    // Only initialize editor when we have both ydoc and provider
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false,
            }),
            Collaboration.configure({
                document: ydoc || new Y.Doc(),
                field: section,
                fragmentContent: false
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: {
                    name: participants.find(p => p.id === currentUserId)?.full_name || 'Anonymous',
                    color: COLORS[currentUserId % COLORS.length],
                },
            }),
        ],
        content: EMPTY_DOC,
        editable: editable && !!provider?.wsconnected,
        onCreate: () => {
            console.log('[Editor] Initialized:', section);
            if (provider?.wsconnected && provider?.synced) {
                loadContent();
            }
        },
        onUpdate: ({ editor }) => {
            if (!provider?.wsconnected || !isContentLoaded) return;

            // Mark that we're past initial load
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
        immediatelyRender: false,
    });

    // Monitor Y.js text updates and sync status
    useEffect(() => {
        if (!editor || !provider || !ydoc) return;

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

            // Monitor provider sync status
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

            // Initial load if already synced
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
    }, [editor, provider, ydoc, section]);

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

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

            // Set content without triggering save status
            isInitialLoad.current = true;
            editorRef.current.commands.setContent(content);
            setIsContentLoaded(true);
        } catch (error) {
            console.error('[Editor] Error loading content:', error);
            editorRef.current.commands.setContent(EMPTY_DOC);
            setIsContentLoaded(true);
        }
    };

    return (
        <div className={`border rounded-lg ${editable ? 'bg-white hover:border-gray-300 transition-colors' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-900">
                    {sectionTitle}
                </h3>
                <div className="flex items-center space-x-2 min-w-[60px] justify-end">
                    {showSaving && (
                        <span
                            className={`text-xs text-gray-500 flex items-center transition-opacity duration-500
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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Saved
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>
            <div className="p-4">
                <EditorContent
                    editor={editor}
                    className={`prose prose-sm max-w-none min-h-[120px] focus:outline-none ${!editable ? 'opacity-75 cursor-not-allowed' : ''}`}
                />
                {!editable && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        View only
                    </div>
                )}
            </div>
        </div>
    );
}