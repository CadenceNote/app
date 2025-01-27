'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Team } from '@/lib/types/team';
import { Meeting } from '@/lib/types/meeting';
import { RealtimeNoteBoard } from '@/components/meetings/RealtimeNoteBoard';
import { meetingApi } from '@/services/meetingApi';
import { teamApi } from '@/services/teamApi';
import { useUser } from '@/hooks/useUser';

export default function RealtimeDemo() {
    const params = useParams();
    const teamId = parseInt(params.teamId as string);
    const meetingId = parseInt(params.meetingId as string);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [teamData, setTeamData] = useState<Team | null>(null);
    const [error, setError] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const { user, isLoading: userLoading } = useUser();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (userLoading) return;

                const [meetingRes, teamDataRes] = await Promise.all([
                    meetingApi.getMeeting(meetingId, teamId),
                    teamApi.getTeam(teamId)
                ]);

                setMeeting(meetingRes);
                setTeamData(teamDataRes);
                setCurrentUserId(user?.id ?? null);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load meeting data');
            }
        };

        fetchAllData();
    }, [teamId, meetingId, user, userLoading]);

    // Show loading state for any initial data loading
    if (userLoading || !meeting || !teamData || !user || !currentUserId) {
        if (error) {
            return (
                <div className="flex-1 flex items-center justify-center bg-[#F9FAFB]">
                    <div className="text-red-500">{error}</div>
                </div>
            );
        }
        return (
            <div className="flex-1 flex items-center justify-center bg-[#F9FAFB]">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    <div className="text-lg font-medium text-gray-900">Loading meeting data...</div>
                </div>
            </div>
        );
    }

    // Determine user role after we know teamData is not null
    const userRole = teamData.members?.find(m => m.user_id === currentUserId)?.role || 'member';

    return (
        <div className="flex-1 bg-[#F9FAFB]">
            <div className="max-w-[2000px] mx-auto">
                <div className="px-6 py-6 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
                    <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">Team: {teamData.name}</span>
                        <span className="mx-2">•</span>
                        <span>Participants: {meeting.participants.length}</span>
                    </div>
                </div>

                <div className="bg-white shadow-sm overflow-hidden">
                    <RealtimeNoteBoard
                        meetingId={meetingId}
                        currentUserId={currentUserId}
                        userRole={userRole}
                        participants={meeting.participants}
                    />
                </div>
            </div>
        </div>
    );
}
