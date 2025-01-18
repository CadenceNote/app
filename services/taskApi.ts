import api from './api';
import { Task, TaskStatus, TaskPriority, TaskType, TimeUnit, Comment } from '@/lib/types/task';

export interface CreateTaskInput {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    start_date?: string;
    due_date?: string;
    assignee_id?: number;
    labels: number[];
    category?: string;
    team?: {
        id: number;
        name: string;
    };
    time_tracking: {
        original_estimate: number;
        remaining_estimate: number;
        unit: TimeUnit;
    };
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

    // Get a single task
    getTask: async (teamId: number, taskId: number): Promise<Task> => {
        const response = await api.get(`/teams/${teamId}/tasks/${taskId}/`);
        return response.data;
    },

    // Create a new task
    createTask: async (teamId: number, data: CreateTaskInput): Promise<Task> => {
        const formattedData = {
            ...data,
            status: data.status || TaskStatus.TODO
        };
        const response = await api.post(`/teams/${teamId}/tasks/create/`, formattedData);
        return response.data;
    },

    // Update a task
    updateTask: async (teamId: number, taskId: number, data: Partial<CreateTaskInput>): Promise<Task> => {
        const response = await api.put(`/teams/${teamId}/tasks/${taskId}/`, data);
        return response.data;
    },

    // Delete a task
    deleteTask: async (teamId: number, taskId: number): Promise<void> => {
        await api.delete(`/teams/${teamId}/tasks/${taskId}/`, {
            data: { user_id: 1 } // TODO: Get actual user ID from auth context
        });
    },

    // Update task order
    updateTaskOrder: async (teamId: number, taskId: number, newIndex: number): Promise<Task> => {
        const response = await api.post(`/teams/${teamId}/tasks/${taskId}/order/`, {
            new_index: newIndex
        });
        return response.data;
    },

    // Add a comment to a task
    addComment: async (teamId: number, taskId: number, data: { content: string, parent_id?: number }): Promise<Comment> => {
        const response = await api.post(`/teams/${teamId}/tasks/${taskId}/comments/add/`, data);
        return response.data;
    },

    // Get task comments
    getComments: async (teamId: number, taskId: number): Promise<Comment[]> => {
        const response = await api.get(`/teams/${teamId}/tasks/${taskId}/comments/`);
        return response.data.comments;
    }
}; 