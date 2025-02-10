import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { userApi } from "@/services/userApi";
import { UserAvatar } from "./UserAvatar";

interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

interface UserComboboxProps {
    teamId: number;
    selectedUsers: string[];
    onSelectionChange: (users: string[]) => void;
    placeholder?: string;
}

export function UserCombobox({ teamId, selectedUsers, onSelectionChange, placeholder }: UserComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const loadUsers = async () => {
            if (teamId) {
                setLoading(true);
                try {
                    const teamUsers = await userApi.getTeamUsers(teamId);
                    setUsers(teamUsers);
                } catch (error) {
                    console.error('Failed to load team users:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadUsers();
    }, [teamId]);

    const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));

    const handleSelect = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            onSelectionChange(selectedUsers.filter(id => id !== userId));
        } else {
            onSelectionChange([...selectedUsers, userId]);
        }
    };

    const removeUser = (userId: string) => {
        onSelectionChange(selectedUsers.filter(id => id !== userId));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen} >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between "
                    >
                        {selectedUsers.length === 0 ? (
                            <span className="text-muted-foreground">{placeholder || "Select users..."}</span>
                        ) : (
                            <span>{selectedUsers.length} selected</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-full p-2"
                    style={{ zIndex: 100001 }}
                    sideOffset={4}
                    align="start"
                >
                    <div className="max-h-64 overflow-auto space-y-1">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => handleSelect(user.id)}
                                className={cn(
                                    "flex items-center gap-2 w-full p-2 rounded-md cursor-pointer hover:bg-accent",
                                    selectedUsers.includes(user.id) && "bg-accent"
                                )}
                                style={{ pointerEvents: 'auto' }}
                            >
                                <UserAvatar
                                    userId={user.id}
                                    name={user.full_name || user.email}
                                    className="h-6 w-6"
                                />
                                <span className="flex-1">{user.full_name || user.email}</span>
                                <Check
                                    className={cn(
                                        "h-4 w-4",
                                        selectedUsers.includes(user.id) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {selectedUserObjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedUserObjects.map((user) => (
                        <Badge
                            key={user.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                        >
                            <UserAvatar
                                userId={user.id}
                                name={user.full_name || user.email}
                                className="h-4 w-4"
                            />
                            <span>{user.full_name || user.email}</span>
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeUser(user.id)}
                            />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
} 