import api from './api';
import { TeamMember } from '@/lib/types/team';

interface ParticipantNotes {
    todo: string[];
    blockers: string[];
    done: string[];
}

interface Meeting {
    id: number;
    title: string;
    date: string;
    type: 'daily' | 'planning' | 'review' | 'retrospective' | 'adhoc';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants: TeamMember[];
    notes: Record<string, ParticipantNotes>;
}

interface CreateMeetingInput {
    title: string;
    description?: string;
    type: Meeting['type'];
    start_time: string;
    duration_minutes: number;
    participant_ids: number[];
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

    // Update meeting participants
    updateParticipants: async (teamId: number, meetingId: number, data: { participant_ids: number[] }): Promise<Meeting> => {
        const response = await api.post(
            `/teams/${teamId}/meetings/${meetingId}/update-participants/`,
            data
        );
        return response.data;
    },

    // Update participant notes
    updateNotes: async (
        teamId: number,
        meetingId: number,
        userId: number,
        notes: ParticipantNotes
    ): Promise<void> => {
        await api.post(
            `/teams/${teamId}/meetings/${meetingId}/participants/${userId}/notes/`,
            notes
        );
    },

    // Create task from note
    createTaskFromNote: async (
        teamId: number,
        meetingId: number,
        data: {
            title: string;
            assignee_id?: number;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
            due_date?: string;
            description?: string;
        }
    ): Promise<Task> => {
        const response = await api.post(
            `/teams/${teamId}/meetings/${meetingId}/create-task/`,
            data
        );
        return response.data.task;
    },

    // Get meeting templates
    getTemplates: async (teamId: number): Promise<MeetingTemplate[]> => {
        const response = await api.get(`/teams/${teamId}/meeting-templates/`);
        return response.data.templates;
    },

    // Create meeting template
    createTemplate: async (teamId: number, data: CreateMeetingTemplateInput): Promise<MeetingTemplate> => {
        const response = await api.post(`/teams/${teamId}/meeting-templates/create/`, data);
        return response.data.template;
    }
}; 