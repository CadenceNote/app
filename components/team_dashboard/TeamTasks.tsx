import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Task } from "@/lib/types/task";
import { useToast } from "@/hooks/use-toast";
import { useTask } from "@/hooks/useTask";
import { TaskList } from "./TaskList";
import { PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetail } from "@/components/tasks/TaskDetail";

interface TeamTasksProps {
    searchTerm: string;
    teamId: number;
}

export default function TeamTasks({ searchTerm, teamId }: TeamTasksProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const { toast } = useToast();

    // Use task hook with team scope
    const { tasks, createTask, updateTask } = useTask(teamId);

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
                {tasks && tasks.length > 0 ? (
                    <TaskList
                        tasks={tasks}
                        onTaskSelect={setSelectedTask}
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

