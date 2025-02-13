import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/common/UserAvatar"
import { format, parseISO } from "date-fns"
import {
    Users2,
    UsersRound,
    Clock,
    CalendarCheck,
    CalendarClock,
    CheckCircle,
    CircleDot
} from "lucide-react"
import { PriorityBadge } from "@/components/common/PriorityBadge"
import { TaskPriority } from "@/lib/types/task"

interface ExpandableEventCardProps {
    title: string;
    time: string;
    description?: string;
    type: 'meeting' | 'task';
    priority?: TaskPriority;
    status?: string;
    duration?: number;
    participants?: {
        id?: string | number;
        name?: string;
        full_name?: string;
        email?: string;
    }[];
    onClick?: () => void;
    className?: string;
}

// Helper function to get display name for avatar
function getDisplayName(participant: {
    name?: string;
    full_name?: string;
    email?: string;
}): string {
    if (typeof participant.name === 'string') return participant.name;
    if (typeof participant.full_name === 'string') return participant.full_name;
    if (typeof participant.email === 'string') return participant.email;
    return 'User';
}

// Helper function to get user ID
function getUserId(participant: { id?: string | number }): string {
    if (participant.id) return participant.id.toString();
    return 'unknown';
}

// Helper function to get status icon
function getStatusIcon(status: string) {
    switch (status) {
        case 'DONE':
            return CheckCircle;
        case 'IN_PROGRESS':
            return CircleDot;
        default:
            return CalendarClock;
    }
}

export function ExpandableEventCard({
    title,
    time,
    description,
    type,
    priority,
    status,
    duration,
    participants,
    onClick,
    className
}: ExpandableEventCardProps) {
    const isMeeting = type === 'meeting';
    const Icon = isMeeting ? UsersRound : CalendarCheck;
    const StatusIcon = status ? getStatusIcon(status) : undefined;

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-lg border hover:border-primary/20 px-3 py-2 hover:bg-accent/50 transition-all duration-700 ease-in-out cursor-pointer",
                className
            )}
        >
            {/* Main Content */}
            <div className="flex items-center gap-3 min-h-[36px]">
                <div className="flex items-center justify-center rounded-full p-1.5 shrink-0 bg-background">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none truncate">{title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                            {isMeeting ? format(parseISO(time), 'MMM d, h:mm a') : `Due ${format(parseISO(time), 'MMM d, h:mm a')}`}
                        </p>
                        {!isMeeting && priority && (
                            <PriorityBadge priority={priority} />
                        )}
                    </div>
                </div>
                {participants && participants.length > 0 && (
                    <div className="flex -space-x-2 opacity-70 group-hover:opacity-100 transition-opacity duration-700 ease-in-out shrink-0">
                        {participants.slice(0, 2).map((participant, i) => (
                            <UserAvatar
                                key={i}
                                userId={getUserId(participant)}
                                name={getDisplayName(participant)}
                                className="h-6 w-6 border-2 border-background transition-transform duration-700 ease-in-out group-hover:scale-110"
                            />
                        ))}
                        {participants.length > 2 && (
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs border-2 border-background transition-transform duration-700 ease-in-out group-hover:scale-110">
                                +{participants.length - 2}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hover Content */}
            <div className="overflow-hidden transition-all duration-700 ease-in-out max-h-0 group-hover:max-h-[200px] opacity-0 group-hover:opacity-100">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-in-out pt-3 mt-3 border-t">
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        {isMeeting
                                            ? `${format(parseISO(time), 'MMM d, h:mm a')} (${duration}min)`
                                            : `Due ${format(parseISO(time), 'MMM d, h:mm a')}`
                                        }
                                    </span>
                                </div>
                                {!isMeeting && status && (
                                    <div className="flex items-center gap-1">
                                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                        <span>{status}</span>
                                    </div>
                                )}
                            </div>
                            {description && (
                                <p className="text-xs text-muted-foreground">{description}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users2 className="h-3 w-3 shrink-0" />
                                <span>{participants?.length || 0} {isMeeting ? 'participants' : 'assignees'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 