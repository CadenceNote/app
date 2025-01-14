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

export interface MeetingNotes {
    todo: string[];
    blockers: string[];
    done: string[];
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