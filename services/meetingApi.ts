import api from './api';
import { TeamRole } from '@/lib/types/team';
import { MeetingType, MeetingStatus, MeetingNotes, MeetingNoteBlock, TaskSuggestion } from '@/lib/types/meeting';

interface Meeting {
    id: number;
    title: string;
    description?: string;
    type: MeetingType;
    status: MeetingStatus;
    duration_minutes: number;
    start_time: string;
    participants: {
        id: number;
        email: string;
        full_name: string;
        role?: TeamRole;
    }[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
    settings?: {
        goals: string[];
        agenda: string[];
    };
}

interface CreateMeetingInput {
    title: string;
    description?: string;
    type: Meeting['type'];
    start_time: string;
    duration_minutes: number;
    participant_ids: number[];
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    assignee_id?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    due_date?: string;
}

interface Task {
    id: number;
    title: string;
    status: string;
}

interface UserSearchResponse {
    users: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

export const meetingApi = {
    // Get a specific meeting
    getMeeting: async (teamId: number, meetingId: number): Promise<Meeting> => {
        const response = await api.get(`/teams/${teamId}/meetings/${meetingId}`);
        return response.data;
    },

    updateMeeting: async (teamId: number, meetingId: number, data: Partial<Meeting>): Promise<Meeting> => {
        // Ensure status is uppercase if it's being updated
        const formattedData = {
            ...data,
            status: data.status?.toUpperCase()
        };
        console.log(formattedData);
        const response = await api.put(`/teams/${teamId}/meetings/${meetingId}/update/`, formattedData);
        return response.data;
    },

    // List meetings
    listMeetings: async (teamId: number): Promise<Meeting[]> => {
        const response = await api.get(`/teams/${teamId}/meetings/`);
        return response.data.meetings;
    },

    // Create meeting
    createMeeting: async (teamId: number, data: CreateMeetingInput): Promise<Meeting> => {
        const response = await api.post(`/teams/${teamId}/meetings/create/`, data);
        return response.data;
    },

    // Search tasks
    searchTasks: async (teamId: number, query: string): Promise<TaskSuggestion[]> => {
        const response = await api.get(`/teams/${teamId}/tasks/search/`, {
            params: { query }
        });
        return response.data.tasks;
    },

    // Search users
    searchUsers: async (teamId: number, query: string): Promise<UserSearchResponse> => {
        const response = await api.get(`/teams/${teamId}/users/search/`, {
            params: { query }
        });
        return response.data;
    },

    // Create task from note
    createTaskFromNote: async (teamId: number, meetingId: number, data: CreateTaskInput): Promise<Task> => {
        const response = await api.post(`/teams/${teamId}/meetings/${meetingId}/tasks/`, data);
        return {
            id: response.data.id,
            title: response.data.title,
            status: response.data.status
        };
    },

    // Update notes
    updateNotes: async (teamId: number, meetingId: number, userId: number, blocks: MeetingNoteBlock[]): Promise<void> => {
        await api.post(
            `/teams/${teamId}/meetings/${meetingId}/participants/${userId}/notes/`,
            { blocks }
        );
    },

    // Update meeting participants
    updateParticipants: async (teamId: number, meetingId: number, participantIds: number[]): Promise<void> => {
        await api.post(`/teams/${teamId}/meetings/${meetingId}/update-participants/`, {
            participant_ids: participantIds
        });
    },

    // Get user's role in a team
    getTeamRole: async (teamId: number): Promise<{ role: TeamRole }> => {
        const response = await api.get(`/teams/${teamId}/members/me/role/`);
        return { role: response.data.role };
    }
}; 