import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead } = useNotifications({
        status: 'unread',
        limit: 5,
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative w-10 h-10 rounded-full"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <span className="font-semibold">Notifications</span>
                    <Link href="/dashboard/notifications" className="text-sm text-blue-600">
                        View all
                    </Link>
                </div>
                {notifications?.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                        No unread notifications
                    </div>
                ) : (
                    notifications?.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="px-4 py-3 cursor-default"
                        >
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{notification.title}</span>
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {notification.content}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {notification.action_url && (
                                        <Link
                                            href={notification.action_url}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View details
                                        </Link>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Mark as read
                                    </button>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 