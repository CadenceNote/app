export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    due_date: string;
    created_at: string;
    updated_at: string;
    team_id: number;
    assignees: string[];
    watchers: string[];
    creator_id: string;
    metadata?: Record<string, unknown>;
}

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    status: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
    team_id: number;
    participants: string[];
    creator_id: string;
    metadata?: Record<string, unknown>;
}

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    resource_id: string;
    resource_type: 'task' | 'meeting';
    parent_id?: string;
    team_id: number;
    metadata?: Record<string, unknown>;
} 