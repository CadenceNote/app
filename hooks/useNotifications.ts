import useSWR, { mutate } from 'swr';
import { notificationApi, Notification, NotificationStatus, NotificationType, ResourceType } from '@/services/notificationApi';
import { useUser } from './useUser';

const NOTIFICATIONS_KEY = 'notifications';

export function useNotifications(options: {
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
    type?: NotificationType;
    resourceType?: ResourceType;
    teamId?: number;
} = {}) {
    const { user, isLoading: isUserLoading } = useUser();
    const { status, limit, offset, type, resourceType, teamId } = options;

    const key = teamId
        ? [NOTIFICATIONS_KEY, 'team', teamId, { limit, offset, type }]
        : [NOTIFICATIONS_KEY, user?.id, { status, limit, offset, type, resourceType }];

    const { data: notifications, error, mutate: mutateNotifications } = useSWR(
        // Only fetch if we have user.id or teamId
        (!isUserLoading && (user?.id || teamId)) ? key : null,
        async () => {
            if (teamId) {
                return notificationApi.getTeamNotifications(teamId, { limit, offset, type });
            }
            if (!user?.id) return [];
            return notificationApi.getUserNotifications(user.id, {
                status,
                limit,
                offset,
                type,
                resourceType,
            });
        },
        {
            revalidateOnFocus: true,
            refreshInterval: 30000, // Refresh every 30 seconds
        }
    );

    const { data: unreadCount } = useSWR(
        (!isUserLoading && user?.id) ? [NOTIFICATIONS_KEY, 'unread-count', user.id] : null,
        () => {
            if (!user?.id) return 0;
            return notificationApi.getUnreadCount(user.id);
        },
        {
            refreshInterval: 30000,
        }
    );

    const markAsRead = async (notificationId: string) => {
        if (!user?.id) return;
        await notificationApi.markAsRead(notificationId);
        mutate([NOTIFICATIONS_KEY, 'unread-count', user.id]);
        mutateNotifications();
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        await notificationApi.markAllAsRead(user.id);
        mutate([NOTIFICATIONS_KEY, 'unread-count', user.id]);
        mutateNotifications();
    };

    const archiveNotification = async (notificationId: string) => {
        if (!user?.id) return;
        await notificationApi.archiveNotification(notificationId);
        mutateNotifications();
    };

    const deleteNotification = async (notificationId: string) => {
        if (!user?.id) return;
        await notificationApi.deleteNotification(notificationId);
        mutateNotifications();
    };

    return {
        notifications,
        error,
        isLoading: isUserLoading || (!error && !notifications),
        unreadCount,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        mutateNotifications,
    };
} 