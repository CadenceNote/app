import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types/task";
import { useTask } from "@/hooks/useTask";
import { TaskList } from "@/components/tasks/TaskList";
import { PlusCircle, Eye, Plus } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { useUser } from "@/hooks/useUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamTasksProps {
    teamId: number;
    searchTerm: string;
}

export default function TeamTasks({ teamId, searchTerm }: TeamTasksProps) {
    const { user } = useUser();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [activeTab, setActiveTab] = useState("all");

    // Use task hook with team scope
    const { tasks, isLoadingTasks, createTask, updateTask } = useTask(teamId);

    const handleTaskCreate = async (data: any) => {
        const newTask = await createTask({
            ...data,
            team: teamId
        });
        setIsCreateModalOpen(false);
        return newTask;
    };

    // Filter tasks based on user's role and active tab
    const filteredTasks = tasks?.filter(task => {
        if (activeTab === "all") return true;
        if (activeTab === "assigned") return task.assignees.some(assignee => assignee.id === user?.id);
        if (activeTab === "watching") return task.watchers.some(watcher => watcher.id === user?.id);
        return true;
    }) || [];

    return (
        <Card className="space-y-6">
            <CardHeader>
                <CardTitle>Team Tasks</CardTitle>
                <CardDescription>
                    Manage tasks for this team
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">
                            All Tasks ({tasks?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="assigned">
                            Assigned to me ({tasks?.filter(t => t.assignees.some(a => a.id === user?.id)).length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="watching">
                            <Eye className="mr-2 h-4 w-4" />
                            Watching ({tasks?.filter(t => t.watchers.some(w => w.id === user?.id)).length || 0})
                        </TabsTrigger>
                    </TabsList>

                    {["all", "assigned", "watching"].map((tab) => (
                        <TabsContent key={tab} value={tab}>
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold">
                                        {tab === "all" ? "All Tasks" : tab === "assigned" ? "Tasks Assigned to Me" : "Tasks I'm Watching"}
                                    </h2>
                                    <Button onClick={() => setIsCreateModalOpen(true)} className="">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Task
                                    </Button>
                                </div>

                                {isLoadingTasks ? (
                                    <div className="flex items-center justify-center py-8">
                                        Loading tasks...
                                    </div>
                                ) : filteredTasks.length > 0 ? (
                                    <TaskList
                                        tasks={filteredTasks}
                                        onTaskSelect={setSelectedTask}
                                        teamId={teamId}
                                        isLoading={isLoadingTasks}
                                    />
                                ) : (
                                    <EmptyState
                                        title={`No ${tab === "all" ? "" : tab} tasks`}
                                        description={`${tab === "all" ? "Create your first task to get started" : tab === "assigned" ? "Tasks assigned to you will appear here" : "Tasks you're watching will appear here"}`}
                                    />
                                )}
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>

                <CreateTaskModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    teamId={teamId}
                    onTaskCreate={handleTaskCreate}
                />

                {selectedTask && (
                    <TaskDetail
                        isOpen={!!selectedTask}
                        onClose={() => setSelectedTask(undefined)}
                        task={selectedTask}
                        teamId={teamId}
                    />
                )}
            </CardContent>
        </Card>
    );
}

