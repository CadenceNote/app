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
    date: Date;
    type: string;
    duration: string;
    goal: string;
    participants: Participant[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
}