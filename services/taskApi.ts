import { Task, TaskStatus, TaskPriority, TaskType, Comment } from '@/lib/types/task';

// Initialize Supabase client
import { supabase } from '@/lib/supabase';

export interface CreateTaskInput {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type?: TaskType;
    start_date?: string;
    due_date?: string;
    assignees?: string[];  // Array of user IDs (supabase_uid)
    watchers?: string[];   // Array of user IDs (supabase_uid)
    category?: string;
    labels?: number[];
    task_metadata?: Record<string, unknown>;
}

export interface TaskFilters {
    status?: TaskStatus[];
    assignee_id?: string;
    search?: string;
    parent_id?: number;
    skip?: number;
    limit?: number;
}

export type TaskQuadrant = 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';

export interface PersonalTaskPreference {
    importance: boolean;
    urgency: boolean;
    quadrant: TaskQuadrant;
    order_in_quadrant: number;
}

// Add a function to map quadrant values to database enum values
function mapQuadrantToEnum(quadrant: TaskQuadrant): string {
    const quadrantMap = {
        'important-urgent': 'important-urgent',
        'important-not-urgent': 'important-not-urgent',
        'not-important-urgent': 'not-important-urgent',
        'not-important-not-urgent': 'not-important-not-urgent',
        'unsorted': 'unsorted'
    } as const;
    return quadrantMap[quadrant];
}

// Add a reverse mapping function
function mapEnumToQuadrant(dbQuadrant: string): TaskQuadrant {
    return dbQuadrant as TaskQuadrant;
}

// Add types for the parameters
interface TaskWatcher {
    user: {
        supabase_uid: string;
        email: string;
        full_name: string;
    };
}

interface TaskComment {
    user: {
        supabase_uid: string;
        email: string;
        full_name: string;
    };
    [key: string]: any;
}

// Add a helper function to ensure proper priority casing
const normalizePriority = (priority: string): TaskPriority => {
    const normalized = priority.toUpperCase();
    switch (normalized) {
        case 'LOW':
            return TaskPriority.LOW;
        case 'MEDIUM':
            return TaskPriority.MEDIUM;
        case 'HIGH':
            return TaskPriority.HIGH;
        case 'URGENT':
            return TaskPriority.URGENT;
        default:
            return TaskPriority.MEDIUM;
    }
};

const normalizeStatus = (status: string): TaskStatus => {
    const normalized = status.toUpperCase().replace(' ', '_');
    switch (normalized) {
        case 'TODO':
            return TaskStatus.TODO;
        case 'IN_PROGRESS':
            return TaskStatus.IN_PROGRESS;
        case 'IN_REVIEW':
            return TaskStatus.IN_REVIEW;
        case 'DONE':
            return TaskStatus.DONE;
        case 'BACKLOG':
            return TaskStatus.BACKLOG;
        case 'BLOCKED':
            return TaskStatus.BLOCKED;
        case 'CANCELED':
            return TaskStatus.CANCELED;
        default:
            return TaskStatus.TODO;
    }
};

export const taskApi = {
    // List tasks with filters
    listTasks: async (teamId: number): Promise<Task[]> => {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                *,
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                task_assignments(
                    user_id,
                    role,
                    users:user_id(
                        supabase_uid,
                        email,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }

        // Transform the response to match Task interface
        return tasks.map(task => ({
            ...task,
            assignees: task.task_assignments
                .filter((ta: any) => ta.role === 'ASSIGNEE')
                .map((ta: any) => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            watchers: task.task_assignments
                .filter((ta: any) => ta.role === 'WATCHER')
                .map((ta: any) => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            created_by: task.created_by ? {
                id: task.created_by.supabase_uid,
                email: task.created_by.email,
                full_name: task.created_by.full_name
            } : undefined,
            taskId: `T-${task.team_ref_number || task.id}`
        }));
    },

    // Get a single task
    getTask: async (teamId: number, taskId: number): Promise<Task> => {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                task_assignments(
                    user_id,
                    role,
                    users:user_id(
                        supabase_uid,
                        email,
                        full_name,
                        avatar_url
                    )
                ),
                comments:task_comments!task_id(
                    id,
                    content,
                    created_at,
                    updated_at,
                    parent_id,
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
                    )
                )
            `)
            .eq('team_id', teamId)
            .eq('id', taskId)
            .single();

        if (error) throw error;

        // Transform the response to match Task interface
        return {
            ...data,
            assignees: data.task_assignments
                .filter((ta: any) => ta.role === 'ASSIGNEE')
                .map((ta: any) => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            watchers: data.task_assignments
                .filter((ta: any) => ta.role === 'WATCHER')
                .map((ta: any) => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            created_by: data.created_by ? {
                id: data.created_by.supabase_uid,
                email: data.created_by.email,
                full_name: data.created_by.full_name
            } : undefined,
            comments: data.comments?.map((c: any) => ({
                ...c,
                user: {
                    id: c.user.supabase_uid,
                    email: c.user.email,
                    full_name: c.user.full_name
                }
            })) || []
        };
    },

    // Create a new task
    createTask: async (teamId: number, data: CreateTaskInput): Promise<Task> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // First get the next team_ref_number
        const { data: maxRef } = await supabase
            .from('tasks')
            .select('team_ref_number')
            .eq('team_id', teamId)
            .order('team_ref_number', { ascending: false })
            .limit(1)
            .single();

        const nextRefNumber = maxRef ? maxRef.team_ref_number + 1 : 1;

        // Create the task with the next ref number
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert([{
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                type: data.type,
                start_date: data.start_date,
                due_date: data.due_date,
                category: data.category,
                team_id: teamId,
                created_by_id: user.id,
                task_metadata: data.task_metadata,
                team_ref_number: nextRefNumber
            }])
            .select()
            .single();

        if (taskError) throw taskError;
        if (!newTask) throw new Error('Failed to create task');

        // Then create task assignments if any assignees
        if (data.assignees?.length) {
            const assignmentData = data.assignees.map(userId => ({
                task_id: newTask.id,
                user_id: userId,
                role: 'ASSIGNEE'
            }));

            const { error: assignmentError } = await supabase
                .from('task_assignments')
                .insert(assignmentData);

            if (assignmentError) throw assignmentError;
        }

        // Create watcher assignments if any
        if (data.watchers?.length) {
            const watcherData = data.watchers.map(userId => ({
                task_id: newTask.id,
                user_id: userId,
                role: 'WATCHER'
            }));

            const { error: watcherError } = await supabase
                .from('task_assignments')
                .insert(watcherData);

            if (watcherError) throw watcherError;
        }

        // Fetch the complete task with assignments
        const { data: taskWithAssignments, error: fetchError } = await supabase
            .from('tasks')
            .select(`
                *,
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                task_assignments(
                    user_id,
                    role,
                    users:user_id(
                        supabase_uid,
                        email,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('id', newTask.id)
            .single();

        if (fetchError) throw fetchError;
        if (!taskWithAssignments) throw new Error('Failed to fetch task with assignments');

        // Transform the response to match Task interface
        return {
            ...taskWithAssignments,
            assignees: taskWithAssignments.task_assignments
                .filter(ta => ta.role === 'ASSIGNEE')
                .map(ta => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            watchers: taskWithAssignments.task_assignments
                .filter(ta => ta.role === 'WATCHER')
                .map(ta => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                }))
        } as Task;
    },

    // Update a task
    updateTask: async (teamId: number, taskId: number, data: Partial<CreateTaskInput>): Promise<Task> => {
        try {
            console.log('Updating task:', { teamId, taskId, data });

            // First update the task's basic information
            const updateData = {
                title: data.title,
                description: data.description,
                status: data.status ? normalizeStatus(data.status) : undefined,
                priority: data.priority ? normalizePriority(data.priority) : undefined,
                type: data.type,
                start_date: data.start_date,
                due_date: data.due_date,
                category: data.category,
                updated_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', taskId)
                .eq('team_id', teamId);

            if (updateError) throw updateError;

            // If assignees are provided, update task assignments
            if (data.assignees) {
                console.log('Updating assignees:', data.assignees);

                // First, remove all existing assignees
                const { error: deleteError } = await supabase
                    .from('task_assignments')
                    .delete()
                    .eq('task_id', taskId)
                    .eq('role', 'ASSIGNEE');

                if (deleteError) throw deleteError;

                // Then add new assignees if any
                if (data.assignees.length > 0) {
                    // Create assignments using supabase_uid directly
                    const assignmentData = data.assignees.map(userId => ({
                        task_id: taskId,
                        user_id: userId, // Use supabase_uid directly
                        role: 'ASSIGNEE'
                    }));

                    console.log('Assignment data:', assignmentData);
                    const { error: assignError } = await supabase
                        .from('task_assignments')
                        .insert(assignmentData);

                    if (assignError) {
                        console.error('Error inserting assignments:', assignError);
                        throw assignError;
                    }
                }
            }

            // Fetch and return the updated task
            return taskApi.getTask(teamId, taskId);

        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    // Delete a task
    deleteTask: async (teamId: number, taskId: number): Promise<void> => {
        // First, delete related task comments
        const { error: commentsError } = await supabase
            .from('task_comments')
            .delete()
            .eq('task_id', taskId);

        if (commentsError) throw commentsError;

        // Then, delete related task history records
        const { error: historyError } = await supabase
            .from('task_history')
            .delete()
            .eq('task_id', taskId);

        if (historyError) throw historyError;

        // Finally delete the task
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('team_id', teamId);

        if (error) throw error;
    },

    // Add a comment to a task
    addComment: async (teamId: number, taskId: number, content: string, parentId?: number): Promise<Comment> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: comment, error } = await supabase
            .from('task_comments')
            .insert({
                task_id: taskId,
                user_id: user.id,
                content,
                parent_id: parentId,
                created_at: new Date().toISOString()
            })
            .select(`
                *,
                user:user_id(
                    supabase_uid,
                    email,
                    full_name
                )
            `)
            .single();

        if (error) throw error;

        return {
            ...comment,
            user: {
                id: comment.user.supabase_uid,
                email: comment.user.email,
                full_name: comment.user.full_name
            }
        };
    },

    // Update a comment
    updateComment: async (teamId: number, taskId: number, commentId: number, content: string): Promise<Comment> => {
        const { data: comment, error } = await supabase
            .from('task_comments')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId)
            .eq('task_id', taskId)
            .select(`
                *,
                user:user_id(
                    supabase_uid,
                    email,
                    full_name
                )
            `)
            .single();

        if (error) throw error;

        return {
            ...comment,
            user: {
                id: comment.user.supabase_uid,
                email: comment.user.email,
                full_name: comment.user.full_name
            }
        };
    },

    // Delete a comment
    deleteComment: async (teamId: number, taskId: number, commentId: number): Promise<void> => {
        const { error } = await supabase
            .from('task_comments')
            .delete()
            .eq('id', commentId)
            .eq('task_id', taskId);

        if (error) throw error;
    },

    // Get personal preferences for a task
    getPersonalPreferences: async (taskId: number): Promise<PersonalTaskPreference> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('personal_task_preferences')
            .select('*')
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            return {
                ...data,
                quadrant: mapEnumToQuadrant(data.quadrant)
            };
        }

        return {
            importance: false,
            urgency: false,
            quadrant: 'unsorted',
            order_in_quadrant: 0
        };
    },

    // Update personal preferences for a task
    updatePersonalPreferences: async (taskId: number, preferences: PersonalTaskPreference): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('personal_task_preferences')
            .upsert({
                task_id: taskId,
                user_id: user.id,
                importance: preferences.importance,
                urgency: preferences.urgency,
                quadrant: mapQuadrantToEnum(preferences.quadrant),
                order_in_quadrant: preferences.order_in_quadrant,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'task_id,user_id'
            });

        if (error) throw error;
    },

    // Reorder tasks within a quadrant
    reorderTasksInQuadrant: async (quadrant: TaskQuadrant, taskIds: number[]): Promise<void> => {
        console.log('Reordering tasks:', { quadrant, taskIds });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Validate taskIds
        if (taskIds.some(id => isNaN(id) || !Number.isInteger(id))) {
            console.error('Invalid task IDs:', taskIds);
            throw new Error('Invalid task IDs');
        }

        // Update all tasks in the quadrant with their new order
        const updates = taskIds.map((taskId, index) => {
            console.log('Creating update for taskId:', taskId, 'index:', index);
            return {
                task_id: taskId,
                user_id: user.id,
                order_in_quadrant: index + 1,
                quadrant: mapQuadrantToEnum(quadrant)
            };
        });

        console.log('Updates to be applied:', updates);

        const { error } = await supabase
            .from('personal_task_preferences')
            .upsert(updates, {
                onConflict: 'task_id,user_id'
            });

        if (error) {
            console.error('Error in reorderTasksInQuadrant:', error);
            throw error;
        }

        console.log('Reorder completed successfully');
    },

    // Add watcher to a task
    addWatcher: async (teamId: number, taskId: number, userId: string): Promise<Task> => {
        const { error } = await supabase
            .from('task_assignments')
            .insert({
                task_id: taskId,
                user_id: userId, // Use supabase_uid directly
                role: 'WATCHER'
            });

        if (error) throw error;

        // Fetch and return updated task
        return taskApi.getTask(teamId, taskId);
    },

    // Remove watcher from a task
    removeWatcher: async (teamId: number, taskId: number, userId: string): Promise<Task> => {
        const { error } = await supabase
            .from('task_assignments')
            .delete()
            .eq('task_id', taskId)
            .eq('user_id', userId) // Use supabase_uid directly
            .eq('role', 'WATCHER');

        if (error) throw error;

        // Fetch and return updated task
        return taskApi.getTask(teamId, taskId);
    }
}; 