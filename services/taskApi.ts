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
    assignee_id?: string;
    parent_id?: number;
    order_index?: number;
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
    listTasks: async (teamId: number, filters?: TaskFilters): Promise<Task[]> => {
        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:assignee_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                parent:parent_id(*),
                watchers:task_watchers!task_id(
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
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
            .order('order_index', { ascending: true });

        // Apply filters
        if (filters?.status?.length) {
            query = query.in('status', filters.status);
        }
        if (filters?.assignee_id) {
            query = query.eq('assignee_id', filters.assignee_id);
        }
        if (filters?.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }
        if (filters?.parent_id) {
            query = query.eq('parent_id', filters.parent_id);
        }
        if (filters?.skip && filters?.limit) {
            query = query.range(filters.skip, filters.skip + filters.limit - 1);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform the response to use supabase_uid as id
        return data.map(task => ({
            ...task,
            assignee: task.assignee ? {
                id: task.assignee.supabase_uid,
                email: task.assignee.email,
                full_name: task.assignee.full_name
            } : null,
            created_by: {
                id: task.created_by.supabase_uid,
                email: task.created_by.email,
                full_name: task.created_by.full_name
            },
            watchers: task.watchers.map((w: TaskWatcher) => ({
                id: w.user.supabase_uid,
                email: w.user.email,
                full_name: w.user.full_name
            })),
            comments: task.comments.map((c: TaskComment) => ({
                ...c,
                user: {
                    id: c.user.supabase_uid,
                    email: c.user.email,
                    full_name: c.user.full_name
                }
            }))
        }));
    },

    // Get a single task
    getTask: async (teamId: number, taskId: number): Promise<Task> => {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                assignee:assignee_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                parent:parent_id(*),
                watchers:task_watchers!task_id(
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
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

        // Transform the response to use supabase_uid as id
        return {
            ...data,
            assignee: data.assignee ? {
                id: data.assignee.supabase_uid,
                email: data.assignee.email,
                full_name: data.assignee.full_name
            } : null,
            created_by: {
                id: data.created_by.supabase_uid,
                email: data.created_by.email,
                full_name: data.created_by.full_name
            },
            watchers: data.watchers.map((w: TaskWatcher) => ({
                id: w.user.supabase_uid,
                email: w.user.email,
                full_name: w.user.full_name
            })),
            comments: data.comments.map((c: TaskComment) => ({
                ...c,
                user: {
                    id: c.user.supabase_uid,
                    email: c.user.email,
                    full_name: c.user.full_name
                }
            }))
        };
    },

    // Create a new task
    createTask: async (teamId: number, data: CreateTaskInput): Promise<Task> => {
        try {
            console.log('Starting task creation with data:', { teamId, ...data });

            // Get current user session
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) {
                console.error('No session found');
                throw new Error('Not authenticated');
            }
            const user_id = session.session.user.id;
            console.log("1. Got user ID:", user_id);

            // Get max ref number with error handling
            let maxRef;
            try {
                const { data: refData, error: refError } = await supabase
                    .from('tasks')
                    .select('team_ref_number')
                    .eq('team_id', teamId)
                    .order('team_ref_number', { ascending: false })
                    .limit(1)
                    .single();

                if (refError && refError.code !== 'PGRST116') {
                    console.error("Error getting max ref number:", refError);
                    throw refError;
                }
                maxRef = refData;
            } catch (error) {
                console.error('Error in max ref number query:', error);
                maxRef = null;
            }

            console.log("2. Got max ref:", maxRef);
            const newRefNumber = (maxRef?.team_ref_number || 0) + 1;
            console.log("2.1 New ref number:", newRefNumber);

            // Prepare task data
            const taskData = {
                title: data.title,
                description: data.description || '',
                status: normalizeStatus(data.status),
                priority: normalizePriority(data.priority),
                type: TaskType.TASK,
                team_id: teamId,
                team_ref_number: newRefNumber,
                created_by_id: user_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                category: data.category,
                due_date: data.due_date,
                task_metadata: {}
            };
            console.log("3. Prepared task data:", taskData);

            // Create the task with more detailed error handling
            console.log("3.1 Sending insert request to Supabase");
            const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert([taskData])
                .select(`
                    id,
                    title,
                    description,
                    status,
                    priority,
                    type,
                    team_id,
                    team_ref_number,
                    category,
                    due_date,
                    created_at,
                    updated_at,
                    created_by:created_by_id(
                        supabase_uid,
                        email,
                        full_name
                    )
                `)
                .single();

            if (taskError) {
                console.error('Task creation error:', taskError);
                console.error('Task data that caused error:', taskData);
                throw taskError;
            }

            if (!newTask) {
                console.error('No task was created, but no error was thrown');
                throw new Error('No task was created');
            }

            console.log("4. Task created successfully:", newTask);

            // Transform and return the task
            const transformedTask = {
                ...newTask,
                created_by: {
                    id: (newTask.created_by as any).supabase_uid,
                    email: (newTask.created_by as any).email,
                    full_name: (newTask.created_by as any).full_name
                }
            } as Task;

            console.log("5. Returning transformed task:", transformedTask);
            return transformedTask;

        } catch (error) {
            console.error('Detailed create task error:', error);
            throw error;
        }
    },

    // Update a task
    updateTask: async (teamId: number, taskId: number, data: Partial<CreateTaskInput>): Promise<Task> => {
        try {
            // Normalize the data before update
            const updateData = {
                ...data,
                status: data.status ? normalizeStatus(data.status) : undefined,
                priority: data.priority ? normalizePriority(data.priority) : undefined,
                updated_at: new Date().toISOString()
            };

            // Get current task state for history
            const { data: oldTask } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single();

            // Update task
            const { error: taskError } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', taskId)
                .eq('team_id', teamId);

            if (taskError) throw taskError;

            // Create history records
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const changes = [];
            for (const [key, newValue] of Object.entries(updateData)) {
                if (oldTask && oldTask[key] !== newValue) {
                    changes.push({
                        task_id: taskId,
                        user_id: user.id,
                        field_name: key,
                        old_value: oldTask[key]?.toString(),
                        new_value: newValue?.toString(),
                        change_type: 'UPDATE',
                        created_at: new Date().toISOString()
                    });
                }
            }

            if (changes.length > 0) {
                const { error: historyError } = await supabase
                    .from('task_history')
                    .insert(changes);

                if (historyError) throw historyError;
            }

            // Fetch updated task with all related data
            const { data: updatedTask, error: fetchError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assignee:assignee_id(
                        supabase_uid,
                        email,
                        full_name,
                        avatar_url
                    ),
                    created_by:created_by_id(
                        supabase_uid,
                        email,
                        full_name
                    ),
                    parent:parent_id(*),
                    watchers:task_watchers!task_id(
                        user:user_id(
                            supabase_uid,
                            email,
                            full_name
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
                .eq('id', taskId)
                .single();

            if (fetchError) throw fetchError;
            if (!updatedTask) throw new Error('Failed to fetch updated task');

            // Transform the response to match Task interface
            return {
                ...updatedTask,
                assignee: updatedTask.assignee ? {
                    id: updatedTask.assignee.supabase_uid,
                    email: updatedTask.assignee.email,
                    full_name: updatedTask.assignee.full_name,
                    avatar_url: updatedTask.assignee.avatar_url
                } : undefined,
                created_by: {
                    id: updatedTask.created_by.supabase_uid,
                    email: updatedTask.created_by.email,
                    full_name: updatedTask.created_by.full_name
                },
                watchers: updatedTask.watchers?.map((w: TaskWatcher) => ({
                    id: w.user.supabase_uid,
                    email: w.user.email,
                    full_name: w.user.full_name
                })),
                comments: updatedTask.comments?.map((c: TaskComment) => ({
                    ...c,
                    user: {
                        id: c.user.supabase_uid,
                        email: c.user.email,
                        full_name: c.user.full_name
                    }
                }))
            } as Task;
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
    }
}; 