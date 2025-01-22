import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Users, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { SaveStatus } from './SaveStatus';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { useState } from 'react';
import { cn } from "@/lib/utils";

interface MeetingHeaderProps {
    teamId: string;
    meetingId: string;
    onCreateMeeting: () => void;
    title?: string;
    description?: string;
    durationMinutes?: number;
    participantCount?: number;
    lastSaved?: Date | null;
    isSaving?: boolean;
    participants?: Array<{
        id: number;
        email: string;
        full_name: string;
        role?: string;
    }>;
}

export function MeetingHeader({
    teamId,
    meetingId,
    onCreateMeeting,
    title,
    description,
    durationMinutes,
    participantCount,
    lastSaved,
    isSaving,
    participants = []
}: MeetingHeaderProps) {
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

    return (
        <>
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 shadow-sm">
                <div className="max-w-[2000px] mx-auto">
                    <div className="h-14 px-5 flex items-center justify-between">
                        {/* Left section: Navigation and Title */}
                        <div className="flex items-center gap-6 min-w-0 flex-1">
                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-2 text-[13px] font-medium" aria-label="Breadcrumb">
                                <Link
                                    href={`/dashboard/${teamId}`}
                                    className="text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Team {teamId}
                                </Link>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    Meeting {meetingId ? `#${meetingId}` : ''}
                                </span>
                            </nav>

                            {/* Title and Description */}
                            {title && (
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <h1 className="text-[14px] leading-5 font-semibold text-gray-900 truncate">
                                            {title}
                                        </h1>
                                        {description && (
                                            <>
                                                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                                                <p className="text-[13px] leading-5 text-gray-500 truncate flex-1">
                                                    {description}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right section: Metadata and Actions */}
                        <div className="flex items-center">
                            {/* Metadata */}
                            <div className="flex items-center border-r border-gray-200 pr-4 mr-4">
                                <div className="flex items-center gap-4">
                                    {durationMinutes && (
                                        <span className="flex items-center text-[13px] leading-5 text-gray-500 hover:text-gray-900 transition-colors cursor-default">
                                            <Clock className="h-[15px] w-[15px] mr-1.5 flex-shrink-0" />
                                            {durationMinutes}m
                                        </span>
                                    )}
                                    {participantCount !== undefined && (
                                        <button
                                            onClick={() => setIsParticipantsModalOpen(true)}
                                            className="flex items-center text-[13px] leading-5 text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            <Users className="h-[15px] w-[15px] mr-1.5 flex-shrink-0" />
                                            {participantCount}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <SaveStatus lastSaved={lastSaved || null} isSaving={isSaving || false} />
                                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsParticipantsModalOpen(true)}
                                        className={cn(
                                            "h-7 px-2.5 text-[13px] font-medium",
                                            "text-gray-600 hover:text-gray-900",
                                            "hover:bg-gray-100/80 active:bg-gray-200/80"
                                        )}
                                    >
                                        <Users className="h-[15px] w-[15px]" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={onCreateMeeting}
                                        className={cn(
                                            "h-7 px-3 text-[13px] font-medium",
                                            "bg-gray-900 hover:bg-gray-800 active:bg-gray-950",
                                            "text-white"
                                        )}
                                    >
                                        <Plus className="h-[15px] w-[15px] mr-1.5 flex-shrink-0" />
                                        New Meeting
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MeetingParticipantsModal
                open={isParticipantsModalOpen}
                onOpenChange={setIsParticipantsModalOpen}
                teamId={parseInt(teamId)}
                meetingId={parseInt(meetingId)}
                currentParticipants={participants}
                onParticipantsUpdate={() => {
                    // Refresh meeting data
                    window.location.reload();
                }}
            />
        </>
    );
}