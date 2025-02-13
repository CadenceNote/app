"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

// Demo checklists
const DEMO_CHECKLISTS: Checklist[] = [
    {
        id: "1",
        title: "Project Setup",
        items: [
            { id: "1-1", text: "Initialize repository", completed: true },
            { id: "1-2", text: "Setup development environment", completed: false },
            { id: "1-3", text: "Configure CI/CD", completed: false },
        ],
    },
    {
        id: "2",
        title: "Daily Tasks",
        items: [
            { id: "2-1", text: "Check emails", completed: false },
            { id: "2-2", text: "Review pull requests", completed: false },
            { id: "2-3", text: "Update documentation", completed: false },
        ],
    },
];

export default function ChecklistsPage() {
    const [checklists, setChecklists] = useState<Checklist[]>(DEMO_CHECKLISTS);
    const [newItemText, setNewItemText] = useState("");
    const [activeChecklist, setActiveChecklist] = useState<string>(DEMO_CHECKLISTS[0].id);

    const handleToggleItem = (checklistId: string, itemId: string) => {
        setChecklists(checklists.map(checklist => {
            if (checklist.id === checklistId) {
                return {
                    ...checklist,
                    items: checklist.items.map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    ),
                };
            }
            return checklist;
        }));
    };

    const handleAddItem = (checklistId: string) => {
        if (!newItemText.trim()) return;

        setChecklists(checklists.map(checklist => {
            if (checklist.id === checklistId) {
                return {
                    ...checklist,
                    items: [
                        ...checklist.items,
                        {
                            id: `${checklistId}-${checklist.items.length + 1}`,
                            text: newItemText,
                            completed: false,
                        },
                    ],
                };
            }
            return checklist;
        }));
        setNewItemText("");
    };

    const handleDeleteItem = (checklistId: string, itemId: string) => {
        setChecklists(checklists.map(checklist => {
            if (checklist.id === checklistId) {
                return {
                    ...checklist,
                    items: checklist.items.filter(item => item.id !== itemId),
                };
            }
            return checklist;
        }));
    };

    const currentChecklist = checklists.find(cl => cl.id === activeChecklist);

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Checklists</h1>
                <div className="flex gap-2">
                    {checklists.map(checklist => (
                        <Button
                            key={checklist.id}
                            variant={activeChecklist === checklist.id ? "default" : "outline"}
                            onClick={() => setActiveChecklist(checklist.id)}
                        >
                            {checklist.title}
                        </Button>
                    ))}
                </div>
            </div>

            {currentChecklist && (
                <Card className="p-6">
                    <div className="space-y-4">
                        {currentChecklist.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-4">
                                <Checkbox
                                    checked={item.completed}
                                    onCheckedChange={() => handleToggleItem(currentChecklist.id, item.id)}
                                />
                                <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                                    {item.text}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-auto"
                                    onClick={() => handleDeleteItem(currentChecklist.id, item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="flex gap-2 mt-4">
                            <Input
                                placeholder="Add new item..."
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleAddItem(currentChecklist.id);
                                    }
                                }}
                            />
                            <Button onClick={() => handleAddItem(currentChecklist.id)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 text-sm text-muted-foreground">
                        {currentChecklist.items.filter(item => item.completed).length} of {currentChecklist.items.length} tasks completed
                    </div>
                </Card>
            )}
        </div>
    );
} 