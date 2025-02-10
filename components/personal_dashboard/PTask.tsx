import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { Task, TaskStatus } from "@/lib/types/task";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { taskApi } from "@/services/taskApi";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { useTask } from "@/hooks/useTask";
import { useTeams } from "@/hooks/useTeams";
import { TaskList } from "./TaskList";
import { PlusCircle, Eye } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { TeamSelectModal } from "./TeamSelectModal";
import { CreateTaskModal } from "./CreateTaskModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { mutate } from 'swr';

interface Team {
    id: number;
    name: string;
}

interface PTaskProps {
    searchTerm: string;
}

export default function PTask({ searchTerm }: PTaskProps) {
    const { user } = useUser();
    const { teams } = useTeams();
    const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [activeTab, setActiveTab] = useState("assigned");
    const { toast } = useToast();

    // Use task hook with selected team
    const { tasks, createTask, updateTask } = useTask(
        selectedTeamId === "all" ? undefined : Number(selectedTeamId)
    );

    // Filter tasks based on user's role
    const filteredTasks = tasks?.filter(task => {
        const roleMatch = activeTab === "assigned"
            ? task.assignees.some(assignee => assignee.id === user?.id)
            : task.watchers.some(watcher => watcher.id === user?.id);
        return roleMatch;
    }) || [];

    const handleTaskUpdate = async (updatedTask: Task) => {
        try {
            await updateTask(updatedTask.id, updatedTask);
            toast({
                title: "Success",
                description: "Task updated successfully"
            });
        } catch (error) {
            console.error('Error updating task:', error);
            toast({
                title: "Error",
                description: "Failed to update task",
                variant: "destructive"
            });
        }
    };

    if (!teams?.length) {
        return (
            <EmptyState
                title="Welcome to Tasks"
                description="Join or create your first team to start collaborating on tasks"
                action={
                    <Button onClick={() => window.location.href = "/teams"}>
                        Join or Create Team
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Tasks</h2>
                <div className="flex items-center gap-4">
                    {selectedTeamId !== "all" && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    )}
                    <Select
                        value={selectedTeamId}
                        onValueChange={setSelectedTeamId}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Teams</SelectItem>
                            {teams?.map((team) => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assigned">
                        Assigned to me ({tasks?.filter(t => t.assignees.some(a => a.id === user?.id)).length})
                    </TabsTrigger>
                    <TabsTrigger value="watching">
                        <Eye className="mr-2 h-4 w-4" />
                        Watching ({tasks?.filter(t => t.watchers.some(w => w.id === user?.id)).length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assigned">
                    <Card className="p-6">
                        {filteredTasks.length > 0 ? (
                            <TaskList
                                tasks={filteredTasks}
                                onTaskSelect={setSelectedTask}
                            />
                        ) : (
                            <EmptyState
                                title="No tasks assigned"
                                description="Tasks assigned to you will appear here"
                            />
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="watching">
                    <Card className="p-6">
                        {filteredTasks.length > 0 ? (
                            <TaskList
                                tasks={filteredTasks}
                                onTaskSelect={setSelectedTask}
                            />
                        ) : (
                            <EmptyState
                                title="No tasks on watch"
                                description="Tasks you're watching will appear here"
                            />
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={Number(selectedTeamId)}
                onTaskCreate={async (newTask) => {
                    await createTask(newTask);
                    setIsCreateModalOpen(false);
                }}
            />

            {selectedTask && (
                <TaskDetail
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(undefined)}
                    task={selectedTask}
                    teamId={selectedTask.team_id}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}
        </div>
    );
}

