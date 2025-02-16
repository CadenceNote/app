'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationStatus, NotificationType, ResourceType, NotificationPriority, notificationApi } from '@/services/notificationApi';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, Info, AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from '@/hooks/useUser';
import { useTeams } from '@/hooks/useTeams';
import { mutate } from 'swr';
import Image from 'next/image';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useInView } from 'react-intersection-observer';

const ITEMS_PER_PAGE = 10;

interface Notification {
    id: string;
    title: string;
    content: string;
    type: NotificationType;
    priority: NotificationPriority;
    status: 'read' | 'unread';
    created_at: string;
    metadata?: {
        creator_id?: string;
        creator_name?: string;
        changes?: string[];
    };
}

export default function NotificationsPage() {
    const [type, setType] = useState<NotificationType | undefined>();
    const [resourceType, setResourceType] = useState<ResourceType | undefined>();
    const [page, setPage] = useState(1);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { user } = useUser();
    const { teams } = useTeams();
    const [hasMore, setHasMore] = useState(true);
    const [readNotificationsList, setReadNotificationsList] = useState<Notification[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { ref: loadMoreRef, inView } = useInView();

    // First, fetch unread notifications
    const {
        notifications: unreadNotifications,
        isLoading: isLoadingUnread,
        markAsRead,
        markAllAsRead
    } = useNotifications({
        status: 'unread',
        type,
        resourceType,
        limit: 100, // Fetch all unread notifications
    });

    // Then fetch read notifications with pagination
    const {
        notifications: readNotifications,
        isLoading: isLoadingRead,
        mutateNotifications
    } = useNotifications({
        status: 'read',
        type,
        resourceType,
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
    });

    // Handle read notifications accumulation
    useEffect(() => {
        if (!isLoadingRead && readNotifications) {
            setReadNotificationsList(prev => {
                // Create a Set of existing IDs for deduplication
                const existingIds = new Set(prev.map(n => n.id));

                // Filter out any duplicates from new notifications
                const newNotifications = readNotifications.filter(n => !existingIds.has(n.id));

                // Combine previous and new notifications
                return [...prev, ...newNotifications];
            });

            // Update hasMore based on whether we received a full page
            setHasMore(readNotifications.length === ITEMS_PER_PAGE);
        }
    }, [readNotifications, isLoadingRead]);

    // Reset read notifications when filters change
    useEffect(() => {
        setReadNotificationsList([]);
        setPage(1);
        setHasMore(true);
    }, [type, resourceType]);

    // Handle infinite scroll
    useEffect(() => {
        if (inView && !isLoadingMore && hasMore) {
            setIsLoadingMore(true);
            setPage(prev => prev + 1);
            setIsLoadingMore(false);
        }
    }, [inView, hasMore, isLoadingMore]);

    // Combine notifications for display
    const allNotifications = [
        ...(unreadNotifications || []),
        ...readNotificationsList
    ];

    // Create notification form state
    const [createForm, setCreateForm] = useState({
        title: '',
        content: '',
        type: 'info' as NotificationType,
        priority: 'medium' as NotificationPriority,
        teamId: undefined as number | undefined,
        resourceType: undefined as ResourceType | undefined,
        resourceId: '',
        actionUrl: '',
    });

    const handleCreateNotification = async () => {
        if (!user?.id) return;

        try {
            const notification = {
                user_id: user.id,
                title: createForm.title,
                content: createForm.content,
                type: createForm.type,
                priority: createForm.priority,
                team_id: createForm.teamId,
                resource_type: createForm.resourceType,
                resource_id: createForm.resourceId || undefined,
                action_url: createForm.actionUrl || undefined,
            };

            await notificationApi.createNotification(notification);

            // Reset form and close dialog
            setCreateForm({
                title: '',
                content: '',
                type: 'info',
                priority: 'medium',
                teamId: undefined,
                resourceType: undefined,
                resourceId: '',
                actionUrl: '',
            });
            setIsCreateDialogOpen(false);

            // Revalidate both personal and team notifications if this was a team notification
            if (createForm.teamId) {
                mutateNotifications();
                // Also mutate team notifications if we're viewing them
                mutate(['notifications', 'team', createForm.teamId]);
            } else {
                mutateNotifications();
            }
        } catch (error) {
            console.error('Failed to create notification:', error);
            // TODO: Add error toast here
        }
    };

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'action_required':
                return <Bell className="w-5 h-5 text-red-500" />;
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoadingUnread && page === 1) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
                <div className="flex gap-2">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Notification
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Notification</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Input
                                        placeholder="Title"
                                        value={createForm.title}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Textarea
                                        placeholder="Content"
                                        value={createForm.content}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        value={createForm.type}
                                        onValueChange={(value) =>
                                            setCreateForm(prev => ({ ...prev, type: value as NotificationType }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="action_required">Action Required</SelectItem>
                                            <SelectItem value="success">Success</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={createForm.priority}
                                        onValueChange={(value) =>
                                            setCreateForm(prev => ({ ...prev, priority: value as NotificationPriority }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        value={createForm.resourceType || "none"}
                                        onValueChange={(value) =>
                                            setCreateForm(prev => ({
                                                ...prev,
                                                resourceType: value === "none" ? undefined : value as ResourceType
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Resource Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="task">Task</SelectItem>
                                            <SelectItem value="meeting">Meeting</SelectItem>
                                            <SelectItem value="team">Team</SelectItem>
                                            <SelectItem value="comment">Comment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={createForm.teamId?.toString() || "none"}
                                        onValueChange={(value) =>
                                            setCreateForm(prev => ({
                                                ...prev,
                                                teamId: value === "none" ? undefined : parseInt(value)
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {teams?.map((team) => (
                                                <SelectItem key={team.id} value={team.id.toString()}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Input
                                        placeholder="Resource ID (optional)"
                                        value={createForm.resourceId}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, resourceId: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Input
                                        placeholder="Action URL (optional)"
                                        value={createForm.actionUrl}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                                    />
                                </div>
                                <Button onClick={handleCreateNotification} disabled={!createForm.title || !createForm.content}>
                                    Create
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {unreadNotifications?.length > 0 && (
                        <Button variant="outline" onClick={() => markAllAsRead()} disabled={isLoadingUnread}>
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <Select
                    value={type || "none"}
                    onValueChange={(value) => setType(value === "none" ? undefined : value as NotificationType)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">All Types</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="action_required">Action Required</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={resourceType || "none"}
                    onValueChange={(value) => setResourceType(value === "none" ? undefined : value as ResourceType)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by resource" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">All Resources</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="comment">Comment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {/* Unread Notifications Section */}
                {unreadNotifications && unreadNotifications.length > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-medium text-foreground">Unread Notifications</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAllAsRead()}
                                disabled={isLoadingUnread}
                                className="text-xs"
                            >
                                Mark all as read
                            </Button>
                        </div>
                        {unreadNotifications.map((notification) => (
                            <div key={notification.id} className="w-full max-w-5xl mx-auto">
                                <div className="relative bg-background border border-border shadow-sm rounded-xl p-4 transition-colors bg-accent/5">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-10 w-10 flex-shrink-0">
                                            {notification.metadata?.creator_id ? (
                                                <UserAvatar
                                                    userId={notification.metadata.creator_id}
                                                    name={notification.metadata.creator_name || 'User'}
                                                    className="h-10 w-10"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-accent rounded-lg flex items-center justify-center">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {notification.title}
                                                    </p>

                                                    {notification.metadata?.changes ? (
                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                            {notification.metadata.changes.map((change: string, index: number) => (
                                                                <span key={index} className="inline-block mr-2">
                                                                    • {change}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[13px] text-muted-foreground mt-0.5">
                                                            {notification.content}
                                                        </p>
                                                    )
                                                    }

                                                </div>
                                                <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                                                    {notification.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="rounded-lg flex items-center justify-center h-8 w-8 p-0 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="mt-2 ml-14">
                                        <p className="text-[12px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Separator between unread and read notifications */}
                {unreadNotifications && unreadNotifications.length > 0 && readNotificationsList.length > 0 && (
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-border" />
                        </div>
                    </div>
                )}

                {/* Read Notifications Section */}
                {readNotificationsList.length > 0 && (
                    <>
                        <h2 className="text-sm font-medium text-foreground">Previous Notifications</h2>
                        {readNotificationsList.map((notification) => (
                            <div key={notification.id} className="w-full max-w-5xl mx-auto">
                                <div className="relative bg-background border border-border shadow-sm rounded-xl p-4 transition-colors bg-accent/5 opacity-80">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-10 w-10 flex-shrink-0">
                                            {notification.metadata?.creator_id ? (
                                                <UserAvatar
                                                    userId={notification.metadata.creator_id}
                                                    name={notification.metadata.creator_name || 'User'}
                                                    className="h-10 w-10"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-accent rounded-lg flex items-center justify-center">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {notification.title}
                                                    </p>
                                                    {notification.metadata?.changes ? (
                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                            <ul>
                                                                {notification.metadata.changes.map((change: string, index: number) => (

                                                                    <li key={index} className='font-normal text-sm'>
                                                                        • {change}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[13px] text-muted-foreground mt-0.5">
                                                            {notification.content}
                                                        </p>
                                                    )
                                                    }
                                                </div>
                                                <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                                                    {notification.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-2 ml-14">
                                        <p className="text-[12px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {hasMore && (
                    <div ref={loadMoreRef} className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!hasMore && allNotifications.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No more notifications
                    </div>
                )}

                {allNotifications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No notifications found
                    </div>
                )}
            </div>
        </div>
    );
} 