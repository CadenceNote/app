import { supabase } from '@/lib/supabase';

export interface NotificationPreference {
    id: string;
    user_id?: string;
    team_id?: number;
    notification_type: string;
    enabled: boolean;
    frequency?: 'immediate' | 'daily' | 'weekly';
    created_at: string;
    updated_at: string;
}

class NotificationPreferencesService {
    // User preferences
    async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
        const { data, error } = await supabase
            .from('user_notification_preferences')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    }

    async updateUserPreference(
        userId: string,
        notificationType: string,
        enabled: boolean,
        frequency?: 'immediate' | 'daily' | 'weekly'
    ) {
        const { data, error } = await supabase
            .from('user_notification_preferences')
            .upsert({
                user_id: userId,
                notification_type: notificationType,
                enabled,
                frequency,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Team preferences
    async getTeamPreferences(teamId: number): Promise<NotificationPreference[]> {
        const { data, error } = await supabase
            .from('team_notification_preferences')
            .select('*')
            .eq('team_id', teamId);

        if (error) throw error;
        return data || [];
    }

    async updateTeamPreference(
        teamId: number,
        notificationType: string,
        enabled: boolean,
        frequency?: 'immediate' | 'daily' | 'weekly'
    ) {
        const { data, error } = await supabase
            .from('team_notification_preferences')
            .upsert({
                team_id: teamId,
                notification_type: notificationType,
                enabled,
                frequency,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Check preferences
    async shouldNotifyUser(userId: string, notificationType: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_notification_preferences')
            .select('enabled')
            .eq('user_id', userId)
            .eq('notification_type', notificationType)
            .single();

        if (error) return true; // Default to true if no preference is set
        return data?.enabled ?? true;
    }

    async shouldNotifyTeam(teamId: number, notificationType: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('team_notification_preferences')
            .select('enabled')
            .eq('team_id', teamId)
            .eq('notification_type', notificationType)
            .single();

        if (error) return true; // Default to true if no preference is set
        return data?.enabled ?? true;
    }

    // Migration: Create default preferences
    async createDefaultUserPreferences(userId: string) {
        const defaultPreferences = [
            { notification_type: 'team_join', enabled: true, frequency: 'immediate' },
            { notification_type: 'task_assigned', enabled: true, frequency: 'immediate' },
            { notification_type: 'meeting_invited', enabled: true, frequency: 'immediate' },
            { notification_type: 'resource_updated', enabled: true, frequency: 'immediate' },
            { notification_type: 'mentioned', enabled: true, frequency: 'immediate' },
            { notification_type: 'comment_replied', enabled: true, frequency: 'immediate' },
            { notification_type: 'due_date', enabled: true, frequency: 'daily' },
        ];

        const preferencesToInsert = defaultPreferences.map(pref => ({
            user_id: userId,
            ...pref,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
            .from('user_notification_preferences')
            .upsert(preferencesToInsert);

        if (error) throw error;
    }

    async createDefaultTeamPreferences(teamId: number) {
        const defaultPreferences = [
            { notification_type: 'member_joined', enabled: true, frequency: 'immediate' },
            { notification_type: 'task_created', enabled: true, frequency: 'immediate' },
            { notification_type: 'meeting_created', enabled: true, frequency: 'immediate' },
            { notification_type: 'task_completed', enabled: true, frequency: 'immediate' },
            { notification_type: 'meeting_status_changed', enabled: true, frequency: 'immediate' },
            { notification_type: 'resource_updated', enabled: true, frequency: 'immediate' },
            { notification_type: 'due_date', enabled: true, frequency: 'daily' },
        ];

        const preferencesToInsert = defaultPreferences.map(pref => ({
            team_id: teamId,
            ...pref,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
            .from('team_notification_preferences')
            .upsert(preferencesToInsert);

        if (error) throw error;
    }
}

export const notificationPreferencesService = new NotificationPreferencesService(); 