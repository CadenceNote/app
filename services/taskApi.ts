import api from './api';
import { Task, TaskPriority, TaskStatus, TaskType } from '@/lib/types/task';

export interface CreateTaskInput {
    title: string;
    description?: string;
    assignee_id?: number;
    priority?: TaskPriority;
    type?: TaskType;
    status?: TaskStatus;
    start_date?: string;
    due_date?: string;
    created_by_id?: number;
    source_meeting_id?: number;
    team_ref_number?: number;
}

export interface TaskFilters {
    status?: TaskStatus[];
    assignee_id?: number;
    search?: string;
    parent_id?: number;
    skip?: number;
    limit?: number;
}

export const taskApi = {
    // List tasks with filters
    listTasks: async (teamId: number, filters?: TaskFilters): Promise<Task[]> => {
        const params = new URLSearchParams();
        if (filters?.status) {
            filters.status.forEach(s => params.append('status', s));
        }
        if (filters?.assignee_id) {
            params.append('assignee_id', filters.assignee_id.toString());
        }
        if (filters?.search) {
            params.append('search', filters.search);
        }
        if (filters?.parent_id) {
            params.append('parent_id', filters.parent_id.toString());
        }
        if (filters?.skip) {
            params.append('skip', filters.skip.toString());
        }
        if (filters?.limit) {
            params.append('limit', filters.limit.toString());
        }

        const response = await api.get(`/teams/${teamId}/tasks/?${params.toString()}`);
        return response.data.tasks;
    },

    // Create a new task
    createTask: async (teamId: number, data: CreateTaskInput): Promise<Task> => {
        const response = await api.post(`/teams/${teamId}/tasks/`, data);
        return response.data;
    },

    // Update a task
    updateTask: async (teamId: number, taskId: number, data: Partial<Task>): Promise<Task> => {
        const response = await api.put(`/teams/${teamId}/tasks/${taskId}/`, data);
        return response.data;
    },

    // Delete a task
    deleteTask: async (teamId: number, taskId: number): Promise<void> => {
        await api.delete(`/teams/${teamId}/tasks/${taskId}/`);
    },

    // Update task order
    updateTaskOrder: async (teamId: number, taskId: number, newIndex: number): Promise<Task> => {
        const response = await api.post(`/teams/${teamId}/tasks/${taskId}/order/`, {
            new_index: newIndex
        });
        return response.data;
    }
}; 