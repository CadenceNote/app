import { TaskBadge, UserBadge } from './task';

export interface NoteBlock {
    id: string;
    type: 'todo' | 'blocker' | 'done';
    content: {
        text: string;
        task?: {
            id: number;
            title?: string;
            status?: string;
        };
        badges?: Array<{
            type: 'task';
            id: number;
            data: TaskBadge;
            startIndex: number;
            endIndex: number;
        } | {
            type: 'user';
            id: number;
            data: UserBadge;
            startIndex: number;
            endIndex: number;
        }>;
    };
}

export interface NoteRow {
    id: string;
    type: 'todo' | 'blocker' | 'done';
    content: string;
    taskId?: number;
    badges: Array<{
        type: 'task';
        id: number;
        data: TaskBadge;
        startIndex: number;
        endIndex: number;
    } | {
        type: 'user';
        id: number;
        data: UserBadge;
        startIndex: number;
        endIndex: number;
    }>;
}

export interface ParticipantNotes {
    [participantId: number]: {
        [type in 'todo' | 'blocker' | 'done']: NoteRow[];
    };
}

export interface NoteEditorProps {
    content: string;
    onChange: (content: string) => void;
    onTaskCreate: (taskData: { title: string; description?: string }) => void;
    onMentionClick: (userId: number) => void;
    onTaskClick: (taskId: number) => void;
    placeholder?: string;
    readOnly?: boolean;
    teamId: number;
} 