import { notificationApi, NotificationType, NotificationPriority } from './notificationApi';
import { Task, Meeting, Comment } from './types';

interface NotificationContext {
    userId?: string;
    teamId?: number;
    resourceId?: string;
    resourceType?: 'task' | 'meeting' | 'team' | 'comment';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}

class NotificationService {
    // Team Events
    async notifyTeamMemberJoined(teamId: number, newMemberId: string, newMemberName: string) {
        return notificationApi.createTeamNotification({
            team_id: teamId,
            title: 'New Team Member',
            content: `${newMemberName} has joined the team`,
            type: 'info',
            priority: 'medium',
            resource_type: 'team',
            resource_id: teamId.toString(),
        });
    }

    async notifyTaskCreated(task: Task, teamId: number, creatorName: string, notifyTeam: boolean = true) {
        if (!notifyTeam) return;

        return notificationApi.createTeamNotification({
            team_id: teamId,
            title: 'New Task Created',
            content: `${creatorName} created a new task: ${task.title}`,
            type: 'info',
            priority: 'medium',
            resource_type: 'task',
            resource_id: task.id,
            action_url: `/dashboard/${teamId}/tasks/${task.id}`,
        });
    }

    async notifyMeetingCreated(meeting: Meeting, teamId: number, creatorName: string, notifyTeam: boolean = true) {
        if (!notifyTeam) return;

        return notificationApi.createTeamNotification({
            team_id: teamId,
            title: 'New Meeting Scheduled',
            content: `${creatorName} scheduled a new meeting: ${meeting.title}`,
            type: 'info',
            priority: 'medium',
            resource_type: 'meeting',
            resource_id: meeting.id,
            action_url: `/dashboard/${teamId}/meetings/${meeting.id}`,
        });
    }

    async notifyTaskDueSoon(task: Task, teamId: number) {
        const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 3600 * 24));

        if (daysUntilDue <= 2) { // Configure threshold as needed
            return notificationApi.createTeamNotification({
                team_id: teamId,
                title: 'Task Due Soon',
                content: `Task "${task.title}" is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
                type: 'warning',
                priority: 'high',
                resource_type: 'task',
                resource_id: task.id,
                action_url: `/dashboard/${teamId}/tasks/${task.id}`,
            });
        }
    }

    async notifyTaskCompleted(task: Task, teamId: number, completedByName: string) {
        return notificationApi.createTeamNotification({
            team_id: teamId,
            title: 'Task Completed',
            content: `${completedByName} marked task "${task.title}" as complete`,
            type: 'success',
            priority: 'medium',
            resource_type: 'task',
            resource_id: task.id,
            action_url: `/dashboard/${teamId}/tasks/${task.id}`,
        });
    }

    async notifyMeetingStatusChanged(meeting: Meeting, teamId: number, oldStatus: string, newStatus: string) {
        return notificationApi.createTeamNotification({
            team_id: teamId,
            title: 'Meeting Status Changed',
            content: `Meeting "${meeting.title}" has been ${newStatus.toLowerCase()}`,
            type: newStatus === 'CANCELLED' ? 'warning' : 'info',
            priority: 'medium',
            resource_type: 'meeting',
            resource_id: meeting.id,
            action_url: `/dashboard/${teamId}/meetings/${meeting.id}`,
        });
    }

    async notifyResourceUpdated(
        type: 'task' | 'meeting',
        resource: Task | Meeting,
        teamId: number,
        updaterName: string,
        notifyTeam: boolean = false
    ) {
        if (!notifyTeam) return;

        return notificationApi.createTeamNotification({
            team_id: teamId,
            title: `${type === 'task' ? 'Task' : 'Meeting'} Updated`,
            content: `${updaterName} updated ${type} "${resource.title}"`,
            type: 'info',
            priority: 'medium',
            resource_type: type,
            resource_id: resource.id,
            action_url: `/dashboard/${teamId}/${type}s/${resource.id}`,
        });
    }

    // Personal Events
    async notifyUserTaskAssigned(userId: string, task: Task, teamId: number) {
        return notificationApi.createNotification({
            user_id: userId,
            title: 'New Task Assignment',
            content: `You have been assigned to task "${task.title}"`,
            type: 'action_required',
            priority: 'high',
            team_id: teamId,
            resource_type: 'task',
            resource_id: task.id,
            action_url: `/dashboard/${teamId}/tasks/${task.id}`,
        });
    }

    async notifyUserMeetingInvited(userId: string, meeting: Meeting, teamId: number) {
        return notificationApi.createNotification({
            user_id: userId,
            title: 'New Meeting Invitation',
            content: `You have been invited to meeting "${meeting.title}"`,
            type: 'action_required',
            priority: 'high',
            team_id: teamId,
            resource_type: 'meeting',
            resource_id: meeting.id,
            action_url: `/dashboard/${teamId}/meetings/${meeting.id}`,
        });
    }

    async notifyUserResourceChanged(
        userId: string,
        type: 'task' | 'meeting',
        resource: Task | Meeting,
        teamId: number,
        updaterName: string
    ) {
        return notificationApi.createNotification({
            user_id: userId,
            title: `${type === 'task' ? 'Task' : 'Meeting'} Updated`,
            content: `${updaterName} updated ${type} "${resource.title}"`,
            type: 'info',
            priority: 'medium',
            team_id: teamId,
            resource_type: type,
            resource_id: resource.id,
            action_url: `/dashboard/${teamId}/${type}s/${resource.id}`,
        });
    }

    async notifyUserMentioned(
        userId: string,
        context: NotificationContext,
        mentionedBy: string
    ) {
        return notificationApi.createNotification({
            user_id: userId,
            title: 'You were mentioned',
            content: `${mentionedBy} mentioned you in a ${context.resourceType}`,
            type: 'info',
            priority: 'medium',
            team_id: context.teamId,
            resource_type: context.resourceType,
            resource_id: context.resourceId,
            action_url: context.actionUrl,
        });
    }

    async notifyCommentReplied(
        userId: string,
        comment: Comment,
        repliedBy: string,
        context: NotificationContext
    ) {
        return notificationApi.createNotification({
            user_id: userId,
            title: 'New Reply to Your Comment',
            content: `${repliedBy} replied to your comment`,
            type: 'info',
            priority: 'medium',
            team_id: context.teamId,
            resource_type: context.resourceType,
            resource_id: context.resourceId,
            action_url: context.actionUrl,
        });
    }

    // Future: Add methods for handling notification preferences
    private async shouldNotifyUser(userId: string, notificationType: string): Promise<boolean> {
        // TODO: Implement user notification preferences check
        return true;
    }

    private async shouldNotifyTeam(teamId: number, notificationType: string): Promise<boolean> {
        // TODO: Implement team notification preferences check
        return true;
    }
}

export const notificationService = new NotificationService(); 