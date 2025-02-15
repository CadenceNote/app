'use client';

import { useState } from 'react';
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
import { Loader2, Bell, Info, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
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

const ITEMS_PER_PAGE = 20;

export default function NotificationsPage() {
    const [status, setStatus] = useState<NotificationStatus>('unread');
    const [type, setType] = useState<NotificationType | undefined>();
    const [resourceType, setResourceType] = useState<ResourceType | undefined>();
    const [page, setPage] = useState(1);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { user } = useUser();
    const { teams } = useTeams();

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

    const { notifications, isLoading, error, markAsRead, markAllAsRead, mutateNotifications } = useNotifications({
        status,
        type,
        resourceType,
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
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

    if (error) return <div>Failed to load notifications</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <div className="flex gap-2">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
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
                    <Button onClick={() => markAllAsRead()} disabled={isLoading}>
                        Mark all as read
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as NotificationStatus)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>

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

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications?.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`p-4 ${notification.status === 'unread' ? 'bg-gray-50' : 'bg-white'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{notification.title}</h3>
                                        <Badge
                                            variant="secondary"
                                            className={getPriorityColor(notification.priority)}
                                        >
                                            {notification.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-600 mb-2">{notification.content}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                        {notification.action_url && (
                                            <Link
                                                href={notification.action_url}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View details
                                            </Link>
                                        )}
                                        {notification.status === 'unread' && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {notifications?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No notifications found
                        </div>
                    )}
                </div>
            )}

            {notifications && notifications.length >= ITEMS_PER_PAGE && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="mx-4 py-2">Page {page}</span>
                    <Button
                        variant="outline"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={notifications.length < ITEMS_PER_PAGE}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
} 