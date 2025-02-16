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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // First get the task data
        const { data: taskData, error: taskError } = await supabase
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
            .eq('id', taskId)
            .single();

        if (taskError) {
            console.error('Error getting task:', taskError);
            throw taskError;
        }

        // Then get the comments separately
        const { data: comments, error: commentsError } = await supabase
            .from('task_comments')
            .select(`
                id,
                task_id,
                content,
                created_at,
                updated_at,
                parent_id,
                user:user_id(
                    supabase_uid,
                    email,
                    full_name
                )
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (commentsError) {
            console.error('Error getting comments:', commentsError);
            throw commentsError;
        }

        // Check if current user is watching this task
        const isWatching = taskData.task_assignments.some(
            (ta: any) => ta.role === 'WATCHER' && ta.user_id === user.id
        );

        // Transform the response to match Task interface
        const transformedTask = {
            ...taskData,
            id: taskData.id.toString(), // Convert id to string
            assignees: taskData.task_assignments
                .filter((ta: any) => ta.role === 'ASSIGNEE')
                .map((ta: any) => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            watchers: taskData.task_assignments
                .filter((ta: any) => ta.role === 'WATCHER')
                .map((ta: any) => ({
                    id: ta.users.supabase_uid,
                    email: ta.users.email,
                    full_name: ta.users.full_name,
                    avatar_url: ta.users.avatar_url
                })),
            created_by: taskData.created_by ? {
                id: taskData.created_by.supabase_uid,
                email: taskData.created_by.email,
                full_name: taskData.created_by.full_name
            } : undefined,
            comments: comments?.map((c: any) => ({
                id: c.id,
                content: c.content,
                task_id: c.task_id,
                created_at: c.created_at,
                updated_at: c.updated_at,
                parent_id: c.parent_id,
                user: {
                    id: c.user.supabase_uid,
                    email: c.user.email,
                    full_name: c.user.full_name
                }
            })) || [],
            is_watching: isWatching // Add the watch status
        };

        return transformedTask;
    },

    // Create a new task
    createTask: async (teamId: number, data: CreateTaskInput): Promise<Task> => {
        // Get authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('User not authenticated');

        // Get user details including full_name
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('supabase_uid, email, full_name')
            .eq('supabase_uid', authUser.id)
            .single();

        if (userError) throw userError;
        if (!userData) throw new Error('User details not found');

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
                created_by_id: authUser.id,
                task_metadata: data.task_metadata,
                team_ref_number: nextRefNumber
            }])
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
            .single();

        if (taskError) throw taskError;
        if (!newTask) throw new Error('Failed to create task');

        // Get team members for notifications
        const { data: teamMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);

        const teamMemberIds = teamMembers?.map(member => member.user_id) || [];

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

        // Create notification for all team members
        // Create individual notifications for each team member
        if (teamMemberIds.length > 0) {
            const notifications = teamMemberIds.map(userId => ({
                user_id: userId,
                type: 'info',  // Using the correct notification_type enum value
                title: 'New Task Created',
                content: `${userData.full_name} created a new task: ${newTask.title}`,
                team_id: teamId,
                resource_type: 'task',
                resource_id: newTask.id.toString(),
                action_url: `/dashboard/${teamId}/tasks/${newTask.id}`,
                priority: 'medium',
                status: 'unread',
                metadata: {
                    task_title: newTask.title,
                    creator_id: authUser.id,
                    creator_name: userData.full_name
                }
            }));

            const { error: notificationError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notificationError) {
                console.error('Error creating notifications:', notificationError);
                // Don't throw here, as the task was created successfully
            }
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
            // Get authenticated user
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('User not authenticated');

            // Get user details including full_name
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('supabase_uid, email, full_name')
                .eq('supabase_uid', authUser.id)
                .single();

            if (userError) throw userError;
            if (!userData) throw new Error('User details not found');

            // Validate inputs
            if (!teamId || !taskId) {
                throw new Error('Team ID and Task ID are required');
            }

            // Get the original task for comparison
            const originalTask = await taskApi.getTask(teamId, taskId);

            // First update the task's basic information
            const updateData = {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.status !== undefined && { status: normalizeStatus(data.status) }),
                ...(data.priority !== undefined && { priority: normalizePriority(data.priority) }),
                ...(data.type !== undefined && { type: data.type }),
                ...(data.start_date !== undefined && { start_date: data.start_date }),
                ...(data.due_date !== undefined && { due_date: data.due_date }),
                ...(data.category !== undefined && { category: data.category }),
                updated_at: new Date().toISOString()
            };

            // Update task data
            const { data: updatedTaskData, error: updateError } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', taskId)
                .select('*')
                .single();

            if (updateError) {
                console.error("Error updating task:", updateError);
                throw new Error(`Task update failed: ${updateError.message}`);
            }

            if (!updatedTaskData) {
                console.error("No data returned from update");
                throw new Error('Task not found');
            }

            // Handle assignees if provided
            if (data.assignees) {
                // Delete existing assignees
                const { error: deleteError } = await supabase
                    .from('task_assignments')
                    .delete()
                    .eq('task_id', taskId)
                    .eq('role', 'ASSIGNEE');

                if (deleteError) {
                    console.error("Error deleting existing assignees:", deleteError);
                    throw new Error(`Failed to delete existing assignees: ${deleteError.message}`);
                }

                if (data.assignees.length > 0) {
                    // Add new assignees
                    const assignmentData = data.assignees.map(userId => ({
                        task_id: taskId,
                        user_id: typeof userId === 'object' ? userId.id : userId,
                        role: 'ASSIGNEE'
                    }));

                    const { error: assignError } = await supabase
                        .from('task_assignments')
                        .insert(assignmentData);

                    if (assignError) {
                        console.error("Error inserting assignees:", assignError);
                        throw new Error(`Failed to insert assignees: ${assignError.message}`);
                    }
                }
            }

            // Get team members for notifications
            const { data: teamMembers } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', teamId);

            const teamMemberIds = teamMembers?.map(member => member.user_id) || [];

            // Create notifications for team members about the update
            if (teamMemberIds.length > 0) {
                let notificationTitle = 'Task Updated';
                let notificationContent = `${userData.full_name} updated task: ${updatedTaskData.title}`;
                let updateType = 'general';

                // Build a list of changes
                const changes: string[] = [];

                if (data.title && data.title !== originalTask.title) {
                    changes.push(`changed title to "${data.title}"`);
                    updateType = 'title';
                }
                if (data.description && data.description !== originalTask.description) {
                    changes.push(`updated description`);
                    updateType = 'description';
                }
                if (data.status && data.status !== originalTask.status) {
                    changes.push(`changed status from ${originalTask.status} to ${data.status}`);
                    updateType = 'status';
                    notificationTitle = 'Task Status Changed';
                }
                if (data.priority && data.priority !== originalTask.priority) {
                    changes.push(`changed priority from ${originalTask.priority} to ${data.priority}`);
                    updateType = 'priority';
                    notificationTitle = 'Task Priority Changed';
                }
                if (data.due_date && data.due_date !== originalTask.due_date) {
                    const formattedDate = new Date(data.due_date).toLocaleDateString();
                    changes.push(`set due date to ${formattedDate}`);
                    updateType = 'due_date';
                }
                if (data.start_date && data.start_date !== originalTask.start_date) {
                    const formattedDate = new Date(data.start_date).toLocaleDateString();
                    changes.push(`set start date to ${formattedDate}`);
                    updateType = 'start_date';
                }
                if (data.assignees) {
                    const oldAssignees = originalTask.assignees.map(a => a.id);
                    const newAssignees = data.assignees;
                    if (JSON.stringify(oldAssignees) !== JSON.stringify(newAssignees)) {
                        changes.push('updated task assignments');
                        updateType = 'assignments';
                    }
                }

                // Create the notification content from the changes
                if (changes.length > 0) {
                    notificationContent = `${userData.full_name} ${changes.join(', ')} in task "${updatedTaskData.title}"`;
                }

                const notifications = teamMemberIds.map(userId => ({
                    user_id: userId,
                    type: 'info',
                    title: notificationTitle,
                    content: notificationContent,
                    team_id: teamId,
                    resource_type: 'task',
                    resource_id: taskId.toString(),
                    action_url: `/dashboard/${teamId}/tasks/${taskId}`,
                    priority: 'medium',
                    status: 'unread',
                    metadata: {
                        task_title: updatedTaskData.title,
                        creator_id: authUser.id,
                        creator_name: userData.full_name,
                        update_type: updateType,
                        changes,
                        previous_status: data.status ? originalTask.status : undefined,
                        new_status: data.status || undefined,
                        previous_priority: data.priority ? originalTask.priority : undefined,
                        new_priority: data.priority || undefined,
                        previous_title: data.title ? originalTask.title : undefined,
                        new_title: data.title || undefined,
                        previous_due_date: data.due_date ? originalTask.due_date : undefined,
                        new_due_date: data.due_date || undefined,
                        previous_start_date: data.start_date ? originalTask.start_date : undefined,
                        new_start_date: data.start_date || undefined,
                        previous_assignees: data.assignees ? originalTask.assignees.map(a => a.id) : undefined,
                        new_assignees: data.assignees || undefined
                    }
                }));

                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert(notifications);

                if (notificationError) {
                    console.error('Error creating notifications:', notificationError);
                    // Don't throw here, as the task was updated successfully
                }
            }

            // Fetch the final task data with all relations
            const finalTask = await taskApi.getTask(teamId, taskId);
            return finalTask;

        } catch (error) {
            console.error('Error in updateTask:', error);
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
                user_id: user.id,  // This is already the supabase_uid
                content,
                parent_id: parentId,
                created_at: new Date().toISOString()
            })
            .select(`
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
            `)
            .single();

        if (error) {
            console.error('Error adding comment:', error);
            throw error;
        }

        return {
            id: comment.id,
            content: comment.content,
            task_id: taskId,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            parent_id: comment.parent_id,
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

    // Delete a comment and all its replies
    deleteComment: async (teamId: number, taskId: number, commentId: number): Promise<void> => {
        // First, get all child comments recursively
        const getAllChildCommentIds = async (parentId: number): Promise<number[]> => {
            const { data: children } = await supabase
                .from('task_comments')
                .select('id')
                .eq('task_id', taskId)
                .eq('parent_id', parentId);

            if (!children || children.length === 0) return [];

            const childIds = children.map(c => c.id);
            const grandChildIds = await Promise.all(
                childIds.map(id => getAllChildCommentIds(id))
            );

            return [...childIds, ...grandChildIds.flat()];
        };

        try {
            // Get all child comment IDs
            const childCommentIds = await getAllChildCommentIds(commentId);
            const allCommentIds = [commentId, ...childCommentIds];

            // Delete all comments in a single operation
            const { error } = await supabase
                .from('task_comments')
                .delete()
                .in('id', allCommentIds)
                .eq('task_id', taskId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting comments:', error);
            throw error;
        }
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Validate taskIds
        if (taskIds.some(id => isNaN(id) || !Number.isInteger(id))) {
            console.error('Invalid task IDs:', taskIds);
            throw new Error('Invalid task IDs');
        }

        // Update all tasks in the quadrant with their new order
        const updates = taskIds.map((taskId, index) => {
            return {
                task_id: taskId,
                user_id: user.id,
                order_in_quadrant: index + 1,
                quadrant: mapQuadrantToEnum(quadrant)
            };
        });


        const { error } = await supabase
            .from('personal_task_preferences')
            .upsert(updates, {
                onConflict: 'task_id,user_id'
            });

        if (error) {
            console.error('Error in reorderTasksInQuadrant:', error);
            throw error;
        }

    },

    // Add watcher to a task
    addWatcher: async (teamId: number, taskId: number, userId: string): Promise<void> => {
        const { error } = await supabase
            .from('task_assignments')
            .insert({
                task_id: taskId,
                user_id: userId,
                role: 'WATCHER'
            });

        if (error) throw error;
    },

    // Remove watcher from a task
    removeWatcher: async (teamId: number, taskId: number, userId: string): Promise<void> => {
        const { error } = await supabase
            .from('task_assignments')
            .delete()
            .eq('task_id', taskId)
            .eq('user_id', userId)
            .eq('role', 'WATCHER');

        if (error) throw error;
    },

    // Toggle watch status for current user
    toggleWatch: async (teamId: number, taskId: number): Promise<Task> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Cast taskId to integer and ensure it's valid
        const taskIdInt = parseInt(String(taskId));
        if (isNaN(taskIdInt)) {
            throw new Error('Invalid task ID');
        }

        try {
            // Check if user is already watching
            const { data: existingWatch, error: watchError } = await supabase
                .from('task_assignments')
                .select('*')
                .eq('task_id', taskIdInt)
                .eq('user_id', user.id)
                .eq('role', 'WATCHER')
                .maybeSingle();

            if (watchError) {
                console.error('Error checking watch status:', watchError);
                throw watchError;
            }

            if (existingWatch) {
                // Remove watcher
                const { error: removeError } = await supabase
                    .from('task_assignments')
                    .delete()
                    .eq('task_id', taskIdInt)
                    .eq('user_id', user.id)
                    .eq('role', 'WATCHER');

                if (removeError) {
                    console.error('Error removing watcher:', removeError);
                    throw removeError;
                }
            } else {
                // Add watcher
                const { error: addError } = await supabase
                    .from('task_assignments')
                    .insert({
                        task_id: taskIdInt,
                        user_id: user.id,
                        role: 'WATCHER'
                    });

                if (addError) {
                    console.error('Error adding watcher:', addError);
                    throw addError;
                }
            }

            // Fetch and return updated task
            return await taskApi.getTask(teamId, taskIdInt);
        } catch (error) {
            console.error('Error toggling watch status:', error);
            throw error;
        }
    }
}; 