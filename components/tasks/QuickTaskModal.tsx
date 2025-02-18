'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCombobox } from "@/components/common/UserCombobox";
import { Task, TaskStatus, TaskPriority, TaskType } from '@/lib/types/task';
import { useToast } from '@/hooks/use-toast';

interface QuickTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreate: (task: Task) => void;
    teamId: number;
    initialTitle?: string;
}

export function QuickTaskModal({
    isOpen,
    onClose,
    onTaskCreate,
    teamId,
    initialTitle = ''
}: QuickTaskModalProps) {
    const [title, setTitle] = React.useState(initialTitle);
    const [assignees, setAssignees] = React.useState<string[]>([]);
    const { toast } = useToast();
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialTitle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({
                title: "Error",
                description: "Please enter a task title",
                variant: "destructive"
            });
            return;
        }

        const task: Task = {
            id: String(Date.now()),
            title: title.trim(),
            description: '',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            type: TaskType.TASK,
            team_ref_number: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            team_id: teamId,
            assignee_id: assignees[0] || undefined,
            reporter_id: undefined,
            due_date: undefined,
            assignees: assignees.map(id => ({
                id,
                email: '',
                full_name: '',
                role: 'assignee'
            })),
            watchers: [],
            labels: [],
            comments: [],
            team: {
                id: teamId,
                name: ''
            }
        };

        onTaskCreate(task);
        onClose();
        setTitle('');
        setAssignees([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>
                        Quickly create a task from your meeting notes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            ref={inputRef}
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                        />
                        <UserCombobox
                            teamId={teamId}
                            selectedUsers={assignees}
                            onSelectionChange={setAssignees}
                            placeholder="Assign to..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Task
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 