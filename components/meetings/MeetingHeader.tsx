import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Users, Clock, Calendar, Check, X, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { SaveStatus } from './SaveStatus';
import { MeetingParticipantsModal } from './MeetingParticipantsModal';
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { meetingApi } from '@/services/meetingApi';
import { useToast } from '@/hooks/use-toast';

interface MeetingHeaderProps {
    teamId: string;
    teamName?: string;
    meetingId: string;
    onCreateMeeting: () => void;
    title?: string;
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
    canEdit?: boolean;
    onUpdate?: () => void;
}

export function MeetingHeader({
    teamId,
    teamName = 'Team',
    meetingId,
    onCreateMeeting,
    title,
    durationMinutes,
    participantCount,
    lastSaved,
    isSaving,
    participants = [],
    canEdit,
    onUpdate
}: MeetingHeaderProps) {
    const { toast } = useToast();
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title || '');

    const handleTitleSubmit = async () => {
        if (editedTitle.trim() === '') {
            handleTitleCancel();
            return;
        }

        try {
            await meetingApi.updateMeeting(parseInt(teamId), parseInt(meetingId), {
                title: editedTitle.trim()
            });
            setIsEditingTitle(false);
            toast({
                title: "Success",
                description: "Meeting title updated",
            });
            onUpdate?.();
        } catch (error) {
            console.error('[MeetingHeader] Failed to update title:', error);
            toast({
                title: "Error",
                description: "Failed to update title",
                variant: "destructive"
            });
            handleTitleCancel(); // Reset on error
        }
    };

    const handleTitleCancel = () => {
        setEditedTitle(title || '');
        setIsEditingTitle(false);
    };

    // Update editedTitle when title prop changes
    useEffect(() => {
        setEditedTitle(title || '');
    }, [title]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSubmit();
        } else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };

    return (
        <>
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-[2000px] mx-auto">
                    {/* Main Header Row */}
                    <div className="h-16 px-6 flex items-center justify-between">
                        {/* Left section: Navigation and Title */}
                        <div className="flex items-center gap-6 min-w-0 flex-1">
                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-2 text-[14px] font-medium" aria-label="Breadcrumb">
                                <Link
                                    href={`/dashboard/${teamId}`}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    {teamName}
                                </Link>
                                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </nav>

                            {/* Title */}
                            {title && (
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    {isEditingTitle ? (
                                        <div className="flex items-center gap-2 min-w-0 flex-1 group">
                                            <Input
                                                value={editedTitle}
                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                onBlur={handleTitleCancel}
                                                className={cn(
                                                    "h-9 text-[14px] min-w-0 font-medium",
                                                    "px-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                    "bg-transparent max-w-[400px]"
                                                )}
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleTitleSubmit}
                                                    className={cn(
                                                        "h-8 w-8 p-0",
                                                        "text-gray-600 hover:text-gray-900",
                                                        "hover:bg-gray-100/80 active:bg-gray-200/80"
                                                    )}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleTitleCancel}
                                                    className={cn(
                                                        "h-8 w-8 p-0",
                                                        "text-gray-600 hover:text-gray-900",
                                                        "hover:bg-gray-100/80 active:bg-gray-200/80"
                                                    )}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 min-w-0 flex-1 group">
                                            <h1
                                                className={cn(
                                                    "text-[14px] text-gray-900 truncate font-medium py-1",
                                                    canEdit && "cursor-pointer hover:text-gray-700"
                                                )}
                                                onClick={() => canEdit && setIsEditingTitle(true)}
                                            >
                                                {title}
                                            </h1>
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsEditingTitle(true)}
                                                    className={cn(
                                                        "h-8 w-8 p-0 opacity-0 group-hover:opacity-100",
                                                        "text-gray-600 hover:text-gray-900",
                                                        "hover:bg-gray-100/80 active:bg-gray-200/80"
                                                    )}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right section: Metadata and Actions */}
                        <div className="flex items-center">
                            {/* Metadata */}
                            <SaveStatus lastSaved={lastSaved || null} isSaving={isSaving || false} />
                            <div className="h-4 w-px border-r border-gray-200 flex-shrink-0 pr-4 mr-4" />

                            <div className="flex items-center pr-4 mr-4">
                                <div className="flex items-center gap-4">
                                    {durationMinutes && (
                                        <span className="flex items-center text-[14px] leading-5 text-gray-600 hover:text-gray-900 transition-colors cursor-default">
                                            <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                            {durationMinutes}m
                                        </span>
                                    )}
                                    {participantCount !== undefined && (
                                        <button
                                            onClick={() => setIsParticipantsModalOpen(true)}
                                            className="flex items-center text-[14px] leading-5 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            <Users className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                            {participantCount}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    onClick={onCreateMeeting}
                                    className={cn(
                                        "h-8 px-3 text-[14px] font-medium",
                                        "bg-gray-900 hover:bg-gray-800 active:bg-gray-950",
                                        "text-white"
                                    )}
                                >
                                    <Plus className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                    New Meeting
                                </Button>
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