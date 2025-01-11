export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done' | 'Blocked';
export type TaskType = 'Feature' | 'Bug' | 'Task' | 'Epic';

export interface Task {
    id: number;
    key: string;
    description: string;
    assignee: string;
    status: TaskStatus;
    type: TaskType;
    priority: TaskPriority;
    start: string;
    end: string;
    created: string;
    updated: string;
    reporter: string;
}