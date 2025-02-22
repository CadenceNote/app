import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { UserAvatar } from '@/components/common/UserAvatar';

function Dot({ className }: { className?: string }) {
    return (
        <svg
            width="6"
            height="6"
            fill="currentColor"
            viewBox="0 0 6 6"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <circle cx="3" cy="3" r="3" />
        </svg>
    );
}

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead } = useNotifications({
        status: 'unread',
        limit: 5,
    });

    const handleMarkAllAsRead = () => {
        if (notifications) {
            notifications.forEach((notification) => {
                markAsRead(notification.id);
            });
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="relative" aria-label="Open notifications">
                    <Bell size={16} strokeWidth={2} aria-hidden="true" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 left-full min-w-1 -translate-x-2 p-1 py-0">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
                <div className="flex items-baseline justify-between gap-4 px-3 py-2">
                    <div className="text-sm font-semibold">Notifications</div>
                    {unreadCount > 0 && (
                        <button
                            className="text-xs font-medium hover:underline"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="-mx-1 my-1 h-px bg-border"
                />
                {notifications?.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                        No unread notifications
                    </div>
                ) : (
                    notifications?.map((notification) => (
                        <div
                            key={notification.id}
                            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                        >
                            <div className="relative flex items-start gap-3 pe-3">
                                <div className="relative h-9 w-9 flex-shrink-0">
                                    {notification.user_id && (
                                        <UserAvatar
                                            userId={notification.user_id}
                                            name={notification.user_name || 'User'}
                                            className="h-9 w-9"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <button
                                        className="text-left text-foreground/80 after:absolute after:inset-0"
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <span className="font-medium text-foreground">
                                            {notification.title}
                                        </span>
                                        <div className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.content}
                                        </div>
                                    </button>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                        })}
                                    </div>
                                </div>
                                {notification.status === 'unread' && (
                                    <div className="absolute end-0 self-center">
                                        <Dot className="text-primary" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div className="p-2 text-center">
                    <Link
                        href="/dashboard/notifications"
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                        View all notifications
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
} 