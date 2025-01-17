import { TASK_STATUS } from '../config/taskConfig';

export enum TaskPriority {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High'
}

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export enum TaskType {
    TASK = 'Task',
    BUG = 'Bug',
    FEATURE = 'Feature',
    EPIC = 'Epic'
}

export interface Task {
    id: number;
    team_ref_number: number;
    title: string;
    description: string;
    assignee: string;
    status: TaskStatus;
    type: TaskType;
    priority: TaskPriority;
    startDate?: Date;
    dueDate?: Date;
    created: string;
    updated: string;
    reporter: string;
    labels?: string[];
    category?: string;
    team?: string;
    timeTracking?: {
        logged: string;
        remaining: string;
    };
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    assignee_id?: number;
    priority?: TaskPriority;
    type?: TaskType;
    status?: TaskStatus;
    start_date?: string;
    due_date?: string;
}