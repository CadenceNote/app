export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
    BLOCKED = 'BLOCKED'
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

export interface Comment {
    id: number
    content: string
    created_at: string
    user: {
        id: number
        full_name: string
        email: string
    }
    parent_id: number | null
}

export interface Task {
    id: number
    team_ref_number: string
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    type: TaskType
    assignee: {
        id: number
        full_name: string
        email: string
    } | null
    reporter: {
        id: number
        full_name: string
        email: string
    } | null
    due_date: string | null
    start_date: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
    time_tracking: TimeTracking
    parent_id: number | null
    order_index: number
    category: string | null
    labels: Array<{
        id: number
        name: string
        color: string
    }>
    team: {
        id: number
        name: string
    }
    metadata: Record<string, unknown>
    comments: Comment[]
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