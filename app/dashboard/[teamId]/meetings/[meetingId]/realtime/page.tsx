'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NoteBlockContent {
    text?: string;
    html?: string;
    delta?: Record<string, unknown>;
}

interface NoteBlock {
    id: string;
    content: NoteBlockContent;
    type: string;
    participant_id: number;
    created_at: string;
    meeting_id: string;
}

interface RealtimeInsert {
    eventType: 'INSERT';
    new: NoteBlock;
    old: null;
}

interface RealtimeUpdate {
    eventType: 'UPDATE';
    new: NoteBlock;
    old: { id: string };
}

interface RealtimeDelete {
    eventType: 'DELETE';
    new: null;
    old: { id: string };
}

type RealtimePayload = RealtimeInsert | RealtimeUpdate | RealtimeDelete;

export default function RealtimeNotesDemo() {
    const [blocks, setBlocks] = useState<NoteBlock[]>([]);
    const [error, setError] = useState<string>('');
    const [status, setStatus] = useState<string>('Initializing...');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
    const { teamId, meetingId } = useParams();

    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        async function setupRealtime() {
            try {
                const { data: { session }, error: authError } = await supabase.auth.getSession();

                if (!session || authError) {
                    throw new Error(authError?.message || 'Not authenticated');
                }

                // Force token refresh
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                console.log("USER", user);
                // Direct table access test
                const { data: testData } = await supabase
                    .from('meeting_note_blocks')
                    .select('*');

                console.log('Direct access test:', testData);

                console.log("EXISTING NOTES", testData);
                setBlocks(testData as NoteBlock[]);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'Error fetching notes');
                setStatus('Error occurred');
            }

            try {
                // Realtime setup with meeting_id filter
                channel = supabase
                    .channel(`meeting_notes:${meetingId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'meeting_note_blocks',
                            filter: `meeting_id=eq.${meetingId}`
                        },
                        handleRealtimeUpdate
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'meeting_note_blocks',
                            filter: `meeting_id=eq.${meetingId}`
                        },
                        handleRealtimeUpdate
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'DELETE',
                            schema: 'public',
                            table: 'meeting_note_blocks',
                            filter: `meeting_id=eq.${meetingId}`
                        },
                        handleRealtimeUpdate
                    )
                    .subscribe(status => {
                        console.log('Subscription status:', status);
                        setStatus(status === 'SUBSCRIBED' ? 'Connected!' : status);
                    });

                setRealtimeChannel(channel);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'Realtime error');
                setStatus('Error occurred');
            }
        }

        setupRealtime();

        return () => {
            channel?.unsubscribe();
        };
    }, [meetingId]);

    const handleRealtimeUpdate = (payload: RealtimePayload) => {
        console.log('Handling realtime update:', payload);

        if (payload.eventType === 'INSERT') {
            setBlocks(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'DELETE' && payload.old) {
            console.log('Deleting block:', payload.old.id);
            setBlocks(prev => prev.filter(block => block.id !== payload.old!.id));
        } else if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            setBlocks(prev => prev.map(block =>
                block.id === payload.old!.id ? payload.new : block
            ));
        }
    };

    const createNewNote = async () => {
        if (!newNoteContent.trim()) return;

        try {
            const { data, error } = await supabase
                .from('meeting_note_blocks')
                .insert([
                    {
                        meeting_id: meetingId,
                        content: { text: newNoteContent },
                        type: 'text',
                        participant_id: 1, // In a real app, this would be the current user's ID
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            setNewNoteContent('');
        } catch (err) {
            console.error('Error creating note:', err);
            setError(err instanceof Error ? err.message : 'Error creating note');
        }
    };

    const updateNote = async (blockId: string, newContent: string) => {
        try {
            const { error } = await supabase
                .from('meeting_note_blocks')
                .update({
                    content: { text: newContent }
                })
                .eq('id', blockId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating note:', err);
            setError(err instanceof Error ? err.message : 'Error updating note');
        }
    };

    const deleteNote = async (blockId: string) => {
        try {
            const { error } = await supabase
                .from('meeting_note_blocks')
                .delete()
                .eq('id', blockId);

            if (error) throw error;
        } catch (err) {
            console.error('Error deleting note:', err);
            setError(err instanceof Error ? err.message : 'Error deleting note');
        }
    };

    return (
        <div className="p-4">
            <div className="mb-4">
                <h2 className="text-xl font-bold">Realtime Notes</h2>
                <p className="text-sm text-gray-600">Status: {status}</p>
                {error && <p className="text-red-500">{error}</p>}
            </div>

            <div className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && createNewNote()}
                        placeholder="Type a new note and press Enter..."
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        onClick={createNewNote}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Note
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {blocks?.map(block => (
                    <div
                        key={block.id}
                        className="p-4 border rounded-lg shadow-sm"
                    >
                        <div className="text-sm text-gray-500">ID: {block.id}</div>
                        <div className="mt-2 flex gap-2">
                            <input
                                type="text"
                                value={block.content.text || ''}
                                onChange={(e) => updateNote(block.id, e.target.value)}
                                className="flex-1 p-2 border rounded"
                            />
                            <button
                                onClick={() => deleteNote(block.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            Created: {new Date(block.created_at).toLocaleString()}
                        </div>
                    </div>
                ))}

                {blocks?.length === 0 && status === 'Connected!' && (
                    <p className="text-gray-500 italic">No notes yet. Updates will appear here in real-time.</p>
                )}
            </div>
        </div>
    );
}