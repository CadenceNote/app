import api from './api';
import { TimeEntry, TimeEstimate } from '@/lib/types/task';

export const timeTrackingService = {
    getTimeEntries: async (teamId: number, taskId: number): Promise<TimeEntry[]> => {
        const response = await api.get(`/teams/${teamId}/tasks/${taskId}/time-entries/`);
        return Array.isArray(response.data) ? response.data : [];
    },

    addTimeEntry: async (teamId: number, taskId: number, data: { duration: number, description?: string, started_at?: string, ended_at?: string }): Promise<TimeEntry> => {
        const response = await api.post(`/teams/${teamId}/tasks/${taskId}/time-entries/add/`, data);
        return response.data;
    },

    updateTimeEstimate: async (teamId: number, taskId: number, data: { original_estimate: number, remaining_estimate: number }): Promise<TimeEstimate> => {
        const response = await api.put(`/teams/${teamId}/tasks/${taskId}/time-estimates/update/`, data);
        return response.data;
    },

    getTimeEstimates: async (teamId: number, taskId: number): Promise<TimeEstimate[]> => {
        const response = await api.get(`/teams/${teamId}/tasks/${taskId}/time-estimates/`);
        return Array.isArray(response.data) ? response.data : [];
    }
}; 