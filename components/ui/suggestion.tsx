"use client"

import * as React from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "./command"
import { TaskSuggestion, UserMention } from "@/lib/types/meeting"

interface SuggestionProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (item: TaskSuggestion | UserMention) => void
    items: (TaskSuggestion | UserMention)[]
    type: "task" | "user"
}

export function Suggestion({ isOpen, onClose, onSelect, items, type }: SuggestionProps) {
    if (!isOpen) return null

    return (
        <div className="absolute z-50 w-64 mt-1 bg-white rounded-md shadow-lg">
            <Command>
                <CommandList>
                    <CommandGroup heading={type === "task" ? "Tasks" : "Users"}>
                        {items.map((item) => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => {
                                    onSelect(item)
                                    onClose()
                                }}
                            >
                                <div className="flex items-center">
                                    {type === "task" ? (
                                        <>
                                            <span className="mr-2">#</span>
                                            <span>{(item as TaskSuggestion).title}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">@</span>
                                            <span>{(item as UserMention).name}</span>
                                        </>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                        {items.length === 0 && (
                            <CommandItem disabled>No {type === "task" ? "tasks" : "users"} found</CommandItem>
                        )}
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    )
} 