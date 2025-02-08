export enum TaskStatus {
    BACKLOG = 'BACKLOG',
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    DONE = 'DONE',
    BLOCKED = 'BLOCKED',
    CANCELED = 'CANCELED'
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum TaskType {
    TASK = 'TASK',
    BUG = 'BUG',
    FEATURE = 'FEATURE',
    IMPROVEMENT = 'IMPROVEMENT'
}

export enum TimeUnit {
    MINUTES = 'MINUTES',
    HOURS = 'HOURS',
    DAYS = 'DAYS',
    WEEKS = 'WEEKS'
}

export interface TimeEntry {
    id: number
    duration: number
    description: string
    started_at: string
    ended_at: string | null
    created_at: string
    user: {
        id: number
        full_name: string
        email: string
    }
}

export interface TimeEstimate {
    id: number
    original_estimate: number
    remaining_estimate: number
    unit: TimeUnit
    updated_at: string
    updated_by: {
        id: number
        full_name: string
        email: string
    }
}

export interface TimeTracking {
    original_estimate: number
    remaining_estimate: number
    time_spent: number
    unit: TimeUnit
    entries: TimeEntry[]
}

export interface Label {
    id: number;
    name: string;
    color: string;
    team_id: number;
}

export interface TaskLabel {
    task_id: number;
    label_id: number;
    label: Label;
}

export interface User {
    id: number;
    supabase_uid: string;
    email: string;
    full_name: string | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface Comment {
    id: number;
    content: string;
    task_id: number;
    user_id: number;
    parent_id?: number;
    created_at: string;
    updated_at?: string;
    user: User;
    replies?: Comment[];
}

export interface TaskAssignee {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: 'ASSIGNEE' | 'WATCHER';
}

export interface Task {
    id: string;
    taskId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    start_date?: string;
    due_date?: string;
    assignees: TaskAssignee[];
    watchers: TaskAssignee[];
    category?: string;
    team_id: number;
    team_ref_number?: string;
    created_at: string;
    created_by?: {
        id: string;
        email: string;
        full_name?: string;
    };
    comments?: Comment[];
    labels?: string[];
    task_metadata?: Record<string, any>;
}

export interface CreateTaskInput {
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    type: TaskType
    start_date: string | null
    due_date: string | null
    assignee_id: number | null
    labels: number[]
    category: string | null
    team: {
        id: number
        name: string
    } | null
}

export interface TaskCommandParts {
    title: string;
    assignees: string[];  // User IDs
    priority?: TaskPriority;
    dueDate?: string;
    startDate?: string;
    type?: TaskType;
    description?: string;
}

export interface TaskBadge {
    id: number;
    team_ref_number: string;
    title: string;
    status: TaskStatus;
    isNew?: boolean;
}

export interface UserBadge {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}