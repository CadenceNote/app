import { supabase } from '@/lib/supabase';
import { notificationService } from './notificationService';
import { Task, Meeting } from './types';

class NotificationJobService {
    private checkInterval: NodeJS.Timeout | null = null;

    async startNotificationJobs() {
        // Check for upcoming due dates every hour
        this.checkInterval = setInterval(async () => {
            await this.checkUpcomingDueDates();
        }, 60 * 60 * 1000); // 1 hour
    }

    stopNotificationJobs() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private async checkUpcomingDueDates() {
        await Promise.all([
            this.checkTaskDueDates(),
            this.checkMeetingDueDates()
        ]);
    }

    private async checkTaskDueDates() {
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        // Get tasks that are due within the next 2 days and haven't been notified yet
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*, team_id, assignees')
            .gte('due_date', now.toISOString())
            .lte('due_date', twoDaysFromNow.toISOString())
            .eq('status', 'IN_PROGRESS')
            .is('due_date_notified', false);

        if (error || !tasks) return;

        for (const task of tasks) {
            // Create team notification
            await notificationService.notifyTaskDueSoon(task as Task, task.team_id);

            // Create personal notifications for assignees
            for (const assigneeId of task.assignees) {
                await notificationService.notifyUserTaskAssigned(
                    assigneeId,
                    task as Task,
                    task.team_id
                );
            }

            // Mark task as notified
            await supabase
                .from('tasks')
                .update({ due_date_notified: true })
                .eq('id', task.id);
        }
    }

    private async checkMeetingDueDates() {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Get meetings that start within the next 24 hours and haven't been notified yet
        const { data: meetings, error } = await supabase
            .from('meetings')
            .select('*, team_id, participants')
            .gte('start_time', now.toISOString())
            .lte('start_time', oneDayFromNow.toISOString())
            .eq('status', 'SCHEDULED')
            .is('reminder_sent', false);

        if (error || !meetings) return;

        for (const meeting of meetings) {
            // Notify all participants
            for (const participantId of meeting.participants) {
                await notificationService.notifyUserMeetingInvited(
                    participantId,
                    meeting as Meeting,
                    meeting.team_id
                );
            }

            // Mark meeting as notified
            await supabase
                .from('meetings')
                .update({ reminder_sent: true })
                .eq('id', meeting.id);
        }
    }
}

export const notificationJobService = new NotificationJobService(); 