"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Demo tasks
const DEMO_TASKS = [
    { id: 1, title: "Design User Interface" },
    { id: 2, title: "Implement API Integration" },
    { id: 3, title: "Write Documentation" },
    { id: 4, title: "Bug Fixes" },
];

export default function TimeTrackingPage() {
    const [selectedTask, setSelectedTask] = useState<string>("");
    const [isTracking, setIsTracking] = useState(false);
    const [time, setTime] = useState(0);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartStop = () => {
        setIsTracking(!isTracking);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Time Tracking</h1>

            <Card className="p-6 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Task</label>
                        <Select value={selectedTask} onValueChange={setSelectedTask}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a task to track" />
                            </SelectTrigger>
                            <SelectContent>
                                {DEMO_TASKS.map((task) => (
                                    <SelectItem key={task.id} value={task.id.toString()}>
                                        {task.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-center">
                        <div className="text-4xl font-mono mb-4">{formatTime(time)}</div>
                        <Button
                            size="lg"
                            variant={isTracking ? "destructive" : "default"}
                            onClick={handleStartStop}
                            disabled={!selectedTask}
                            className="w-full md:w-auto"
                        >
                            {isTracking ? "Stop Tracking" : "Start Tracking"}
                        </Button>
                    </div>

                    {selectedTask && (
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <h3 className="font-medium mb-2">Currently tracking:</h3>
                            <p>{DEMO_TASKS.find(t => t.id.toString() === selectedTask)?.title}</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
} 