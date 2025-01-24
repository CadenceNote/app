'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Calendar, AlertCircle } from 'lucide-react';
import { taskApi } from '@/services/taskApi';
import { format } from 'date-fns';

interface Task {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
}

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // For now, we'll just get tasks from the first team
                // TODO: Get tasks across all teams
                const teamTasks = await taskApi.listTasks(1);
                setTasks(teamTasks);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
                return 'bg-red-100 text-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'done':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'todo':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">My Tasks</h1>

            <div className="grid gap-4">
                {tasks.length === 0 ? (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-center">No tasks assigned</p>
                        </CardContent>
                    </Card>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ListTodo className="h-4 w-4 text-gray-500" />
                                        <span>{task.title}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className={getPriorityColor(task.priority)}>
                                            {task.priority}
                                        </Badge>
                                        <Badge className={getStatusColor(task.status)}>
                                            {task.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            {task.due_date && (
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                                        {new Date(task.due_date) < new Date() && (
                                            <span className="flex items-center gap-1 text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                Overdue
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
} 