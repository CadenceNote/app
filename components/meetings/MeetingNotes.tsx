'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Users, Edit, AlertCircle, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import type { Meeting } from '@/lib/types/meeting';

// Mock data
const mockMeetingData: Meeting = {
    id: 1,
    date: new Date(),
    type: "Daily Standup",
    duration: "15 minutes",
    goal: "Daily sync and blockers discussion",
    participants: [
        { id: 1, name: "John Doe", role: "Frontend Dev" },
        { id: 2, name: "Jane Smith", role: "Backend Dev" },
        { id: 3, name: "Mike Johnson", role: "Designer" },
    ],
    notes: {
        "John Doe": {
            todo: ["Implement user dashboard", "Fix navigation bug"],
            blockers: ["Waiting for API endpoint"],
            done: ["Complete authentication flow"]
        },
        "Jane Smith": {
            todo: ["Setup database schema", "Create API docs"],
            blockers: [],
            done: ["Deploy backend service"]
        },
        "Mike Johnson": {
            todo: ["Design system updates"],
            blockers: ["Waiting for content"],
            done: ["Homepage mockups"]
        }
    }
};

interface MeetingNotesProps {
    teamId: string;
}

export function MeetingNotes({ teamId }: MeetingNotesProps) {
    const [meeting, setMeeting] = useState<Meeting>(mockMeetingData);
    const currentUser = "John Doe"; // This would come from auth context

    const handleUpdateNote = (userName: string, type: 'todo' | 'blockers' | 'done', index: number, value: string) => {
        setMeeting(prev => ({
            ...prev,
            notes: {
                ...prev.notes,
                [userName]: {
                    ...prev.notes[userName],
                    [type]: prev.notes[userName][type].map((item, i) => i === index ? value : item)
                }
            }
        }));
    };

    const handleAddNote = (userName: string, type: 'todo' | 'blockers' | 'done') => {
        setMeeting(prev => ({
            ...prev,
            notes: {
                ...prev.notes,
                [userName]: {
                    ...prev.notes[userName],
                    [type]: [...prev.notes[userName][type], ""]
                }
            }
        }));
    };

    const handleRemoveNote = (userName: string, type: 'todo' | 'blockers' | 'done', index: number) => {
        setMeeting(prev => ({
            ...prev,
            notes: {
                ...prev.notes,
                [userName]: {
                    ...prev.notes[userName],
                    [type]: prev.notes[userName][type].filter((_, i) => i !== index)
                }
            }
        }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Daily Standup Notes</CardTitle>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {meeting.date.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.duration}
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">End Meeting</Button>
                </CardHeader>

                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border-b py-2 px-4 text-left font-medium w-[200px]">Team Member</th>
                                    <th className="border-b py-2 px-4 text-left font-medium bg-red-50">
                                        <span className="text-red-600">TODO</span>
                                    </th>
                                    <th className="border-b py-2 px-4 text-left font-medium bg-yellow-50">
                                        <span className="text-yellow-600">BLOCKERS</span>
                                    </th>
                                    <th className="border-b py-2 px-4 text-left font-medium bg-green-50">
                                        <span className="text-green-600">DONE</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(meeting.notes).map(([userName, notes]) => (
                                    <tr key={userName} className="border-b last:border-b-0">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{userName}</div>
                                            <div className="text-sm text-gray-500">
                                                {meeting.participants.find(p => p.name === userName)?.role}
                                            </div>
                                        </td>
                                        {(['todo', 'blockers', 'done'] as const).map((type) => (
                                            <td key={type} className={`py-3 px-4 align-top ${type === 'todo' ? 'bg-red-50' :
                                                type === 'blockers' ? 'bg-yellow-50' : 'bg-green-50'
                                                }`}>
                                                <div className="space-y-2">
                                                    {notes[type].map((item, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <Input
                                                                value={item}
                                                                onChange={(e) => handleUpdateNote(userName, type, index, e.target.value)}
                                                                className="text-sm"
                                                                placeholder={`Add ${type}...`}
                                                                disabled={userName !== currentUser}
                                                            />
                                                            {userName === currentUser && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveNote(userName, type, index)}
                                                                >
                                                                    ×
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {userName === currentUser && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAddNote(userName, type)}
                                                            className="w-full justify-start"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add {type}
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
                </CardContent>
            </Card>

            <Alert className="bg-blue-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Changes are automatically saved and shared with the team in real-time.
                </AlertDescription>
            </Alert>
        </div>
    );
}