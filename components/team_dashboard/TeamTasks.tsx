import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Task } from "@/lib/types/task";
import { useTask } from "@/hooks/useTask";
import { TaskList } from "@/components/tasks/TaskList";
import { PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetail } from "@/components/tasks/TaskDetail";

interface TeamTasksProps {
    teamId: number;
}

export default function TeamTasks({ teamId }: TeamTasksProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Team Tasks</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            <Card className="p-6">
                {isLoadingTasks ? (
                    <div className="flex items-center justify-center py-8">
                        Loading tasks...
                    </div>
                ) : tasks && tasks.length > 0 ? (
                    <TaskList
                        tasks={tasks}
                        onTaskSelect={setSelectedTask}
                        teamId={teamId}
                    />
                ) : (
                    <EmptyState
                        title="No tasks yet"
                        description="Create your first task to get started"
                    />
                )}
            </Card>

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
                    onTaskUpdate={updateTask}
                />
            )}
        </div>
    );
}

