// Remember to update the backend types when changing these
// backend at backend/src/models/meeting.py (changing might need migration)
export enum MeetingType {
    STANDUP = 'STANDUP',
    PLANNING = 'PLANNING',
    RETRO = 'RETROSPECTIVE',
    OTHER = 'OTHER'
}

export enum MeetingStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface Participant {
    id: number;
    name: string;
    role: string;
}

export interface TaskSuggestion {
    id: number;
    team_ref_number: number;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface UserMention {
    id: number;
    name: string;
    email: string;
    avatar: string;
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
    description?: string;
    type: MeetingType;
    status: MeetingStatus;
    duration_minutes: number;
    start_time: string;
    participants: Participant[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
}