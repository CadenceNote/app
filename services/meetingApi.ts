import api from './api';
import { TeamMember, TeamRole } from '@/lib/types/team';
import { TaskSuggestion, UserMention, MeetingNotes, MeetingNoteBlock } from '@/lib/types/meeting';

interface Meeting {
    id: number;
    title: string;
    date: string;
    type: 'daily' | 'planning' | 'review' | 'retrospective' | 'adhoc';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants: TeamMember[];
    notes: Record<string, MeetingNotes>;
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

export const meetingApi = {
    // Get a specific meeting
    getMeeting: async (teamId: number, meetingId: number): Promise<Meeting> => {
        const response = await api.get(`/teams/${teamId}/meetings/${meetingId}/`);
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
    searchUsers: async (teamId: number, query: string): Promise<UserMention[]> => {
        const response = await api.get(`/teams/${teamId}/users/search/`, {
            params: { query }
        });
        return response.data.users;
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
        // Try to get cached role
        const cacheKey = `team_${teamId}_role`;
        const cachedRole = sessionStorage.getItem(cacheKey);
        if (cachedRole) {
            return { role: cachedRole as TeamRole };
        }

        // If no cached data, fetch from API
        const response = await api.get(`/teams/${teamId}/members/me/role/`);
        const role = response.data.role;

        // Cache the role
        sessionStorage.setItem(cacheKey, role);

        return { role };
    }
}; 