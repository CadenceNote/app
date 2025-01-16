export enum MeetingType {
    DAILY = 'daily',
    PLANNING = 'planning',
    REVIEW = 'review',
    RETRO = 'retrospective',
    ADHOC = 'adhoc'
}

export interface Participant {
    id: number;
    name: string;
    role: string;
}

export interface TaskSuggestion {
    id: number;
    title: string;
    status: string;
    assignee?: string;
}

export interface UserMention {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export interface InlineTask {
    id?: number;
    title: string;
    assignee_id?: number;
    due_date?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface MeetingNoteBlock {
    id: string;
    type: 'todo' | 'blocker' | 'done';
    content: {
        text: string;
        task?: {
            id: number;
            title?: string;
            status?: string;
        };
    };
    created_by: number;
    created_at: string;
    last_edited_by?: number;
    last_edited_at?: string;
}

export interface MeetingNotes {
    blocks: MeetingNoteBlock[];
    permissions?: {
        can_edit: boolean;
        can_delete: boolean;
        is_meeting_owner: boolean;
    };
}

export interface Meeting {
    id: number;
    title: string;
    date: Date;
    type: MeetingType;
    duration: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    goal?: string;
    participants: Participant[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
}