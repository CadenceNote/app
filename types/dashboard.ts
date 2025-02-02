export interface Task {
    id: string;
    taskId: string;
    title: string;
    tag: 'Feature' | 'Bug' | 'Documentation';
    status: 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled';
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    quadrant?: 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
}

export interface Meeting {
    id: string;
    title: string;
    time: string;
    date: string;
    attendees: string[];
    isImportant?: boolean;
}

export interface DashboardStats {
    meetings: {
        upcoming: number;
        thisWeek: number;
    };
    tasks: {
        active: number;
        dueThisWeek: number;
    };
    team: {
        total: number;
        active: number;
    };
}

export interface Alert {
    id: string;
    type: 'meeting_invite' | 'mention' | 'task_assignment' | 'team_invite';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
} 