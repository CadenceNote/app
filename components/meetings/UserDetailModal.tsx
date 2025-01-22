'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: number;
        email: string;
        full_name: string;
    };
}

export function UserDetailModal({ open, onOpenChange, user }: UserDetailModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>
                        View detailed information about this user
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                        <AvatarFallback>{user.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 text-center">
                        <h3 className="font-semibold text-lg">{user.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {/* Placeholder for additional user information */}
                    <div className="w-full space-y-4 mt-4">
                        {/* TODO: Add role information */}
                        <div className="text-sm">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="ml-2">Placeholder Role</span>
                        </div>
                        {/* TODO: Add department information */}
                        <div className="text-sm">
                            <span className="text-muted-foreground">Department:</span>
                            <span className="ml-2">Placeholder Department</span>
                        </div>
                        {/* TODO: Add contact information */}
                        <div className="text-sm">
                            <span className="text-muted-foreground">Contact:</span>
                            <span className="ml-2">Placeholder Contact</span>
                        </div>
                        {/* TODO: Add timezone information */}
                        <div className="text-sm">
                            <span className="text-muted-foreground">Timezone:</span>
                            <span className="ml-2">Placeholder Timezone</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 