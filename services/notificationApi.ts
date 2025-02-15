import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export type NotificationType = 'info' | 'warning' | 'action_required' | 'success';
export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationStatus = 'read' | 'unread' | 'archived';
export type ResourceType = 'task' | 'meeting' | 'team' | 'comment';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    content: string;
    type: NotificationType;
    priority: NotificationPriority;
    status: NotificationStatus;
    action_url?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    expires_at?: string;
    resource_id?: string;
    resource_type?: ResourceType;
    team_id?: number;
}

export interface CreateNotificationParams {
    user_id: string;
    title: string;
    content: string;
    type: NotificationType;
    priority?: NotificationPriority;
    action_url?: string;
    metadata?: Record<string, unknown>;
    expires_at?: string;
    resource_id?: string;
    resource_type?: ResourceType;
    team_id?: number;
}

class NotificationApi {
    async getUserNotifications(
        userId: string,
        options: {
            status?: NotificationStatus;
            limit?: number;
            offset?: number;
            type?: NotificationType;
            resourceType?: ResourceType;
        } = {}
    ) {
        const { status, limit = 20, offset = 0, type, resourceType } = options;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }
        if (type) {
            query = query.eq('type', type);
        }
        if (resourceType) {
            query = query.eq('resource_type', resourceType);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Notification[];
    }

    async getTeamNotifications(
        teamId: number,
        options: {
            limit?: number;
            offset?: number;
            type?: NotificationType;
        } = {}
    ) {
        const { limit = 20, offset = 0, type } = options;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Notification[];
    }

    async createTeamNotification(params: Omit<CreateNotificationParams, 'user_id'> & { team_id: number }) {
        // First, get all team members
        const { data: teamMembers, error: teamError } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', params.team_id);

        if (teamError) throw teamError;
        if (!teamMembers?.length) return;

        // Create notifications for all team members
        const notifications = teamMembers.map(member => ({
            user_id: member.user_id,
            title: params.title,
            content: params.content,
            type: params.type,
            priority: params.priority || 'medium',
            action_url: params.action_url,
            metadata: params.metadata || {},
            expires_at: params.expires_at,
            resource_id: params.resource_id,
            resource_type: params.resource_type,
            team_id: params.team_id,
        }));

        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;
        return data as Notification[];
    }

    async createNotification(params: CreateNotificationParams) {
        // If it's a team notification, use createTeamNotification instead
        if (params.team_id) {
            return this.createTeamNotification(params);
        }

        const { data, error } = await supabase
            .from('notifications')
            .insert([params])
            .select()
            .single();

        if (error) throw error;
        return data as Notification;
    }

    async markAsRead(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('id', notificationId);

        if (error) throw error;
    }

    async markAllAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('user_id', userId)
            .eq('status', 'unread');

        if (error) throw error;
    }

    async archiveNotification(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'archived' })
            .eq('id', notificationId);

        if (error) throw error;
    }

    async deleteNotification(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
    }

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'unread');

        if (error) throw error;
        return count || 0;
    }
}

export const notificationApi = new NotificationApi(); 