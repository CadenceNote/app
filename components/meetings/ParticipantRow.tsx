'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';
import { Input } from "@/components/ui/input";
import type { MeetingNotes } from '@/lib/types/meeting';

interface ParticipantRowProps {
    userName: string;
    notes: MeetingNotes;
    canEdit: boolean;
    onNotesUpdate: (notes: MeetingNotes) => void;
}

export function ParticipantRow({ userName, notes, canEdit, onNotesUpdate }: ParticipantRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedNotes, setEditedNotes] = useState(notes);

    const handleSave = () => {
        onNotesUpdate(editedNotes);
        setIsEditing(false);
    };

    const renderNoteList = (items: string[], type: 'todo' | 'blockers' | 'done') => {
        if (!isEditing) {
            return items.length > 0 ? (
                <ul className="space-y-1">
                    {items.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No items</p>
            );
        }

        return (
            <div className="space-y-2">
                {editedNotes[type].map((item, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            value={item}
                            onChange={(e) => {
                                const newItems = [...editedNotes[type]];
                                newItems[index] = e.target.value;
                                setEditedNotes({ ...editedNotes, [type]: newItems });
                            }}
                            className="text-sm"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const newItems = editedNotes[type].filter((_, i) => i !== index);
                                setEditedNotes({ ...editedNotes, [type]: newItems });
                            }}
                        >
                            ×
                        </Button>
                    </div>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setEditedNotes({
                            ...editedNotes,
                            [type]: [...editedNotes[type], ""]
                        });
                    }}
                >
                    + Add Item
                </Button>
            </div>
        );
    };

    return (
        <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{userName}</h3>
                {canEdit && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                    Save
                                </Button>
                            </>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h4 className="font-medium text-red-600 mb-2">TODO</h4>
                    {renderNoteList(notes.todo, 'todo')}
                </div>

                <div>
                    <h4 className="font-medium text-yellow-600 mb-2">BLOCKERS</h4>
                    {renderNoteList(notes.blockers, 'blockers')}
                </div>

                <div>
                    <h4 className="font-medium text-green-600 mb-2">DONE</h4>
                    {renderNoteList(notes.done, 'done')}
                </div>
            </div>
        </div>
    );
}