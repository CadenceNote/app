import useSWR, { mutate } from 'swr';
import { meetingApi } from '@/services/meetingApi';
import { Meeting } from '@/lib/types/meeting';
import { useTeams } from './useTeams';

// Cache keys for meetings
export const meetingKeys = {
    all: () => ['meetings'],
    allTeams: () => [...meetingKeys.all(), 'all_teams'],
    teamMeetings: (teamId?: number) => [...meetingKeys.all(), 'team', teamId],
    meetingDetail: (teamId?: number, meetingId?: number) => [...meetingKeys.teamMeetings(teamId), 'detail', meetingId],
};

export function useMeeting(teamId?: number, meetingId?: number) {
    const { teams } = useTeams();

    // Main meetings query for the team
    const {
        data: meetings = [],
        error: meetingsError,
        isLoading: isLoadingMeetings,
        mutate: mutateMeetings
    } = useSWR<Meeting[]>(
        teams?.length ? (teamId ? meetingKeys.teamMeetings(teamId) : meetingKeys.allTeams()) : null,
        async () => {
            if (!teamId) {
                const allMeetings = await Promise.all(
                    teams.map(team => meetingApi.listMeetings(team.id))
                );
                const flattened = allMeetings.flat();
                return flattened;
            }
            const meetings = await meetingApi.listMeetings(teamId);
            return meetings;
        },
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 0,
            shouldRetryOnError: false,
            revalidateIfStale: true,
            revalidateOnMount: true
        }
    );

    // Individual meeting query if meetingId is provided
    const {
        data: meeting,
        error: meetingError,
        isLoading: isLoadingMeeting,
        mutate: mutateMeeting
    } = useSWR<Meeting | undefined>(
        teamId && meetingId ? meetingKeys.meetingDetail(teamId, meetingId) : null,
        async () => {
            if (!teamId || !meetingId) return undefined;
            return meetingApi.getMeeting(teamId, meetingId);
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
            shouldRetryOnError: false,
            revalidateIfStale: false,
            revalidateOnMount: true,
            isPaused: () => !teams?.length
        }
    );

    // Modify the mutation handler to be more selective about revalidation
    const handleMutation = async <T>({
        operation,
        optimisticUpdate,
    }: {
        operation: () => Promise<T>;
        optimisticUpdate?: (current: Meeting[]) => Meeting[];
    }) => {
        if (!teamId) return;

        try {
            // Optimistic update if provided
            if (optimisticUpdate && meetings) {
                await mutateMeetings(optimisticUpdate(meetings), false);
            }

            // Perform operation
            const result = await operation();

            // Only revalidate the specific queries that need it
            if (meetingId) {
                await mutate(meetingKeys.meetingDetail(teamId, meetingId));
            } else {
                await mutateMeetings();
                // Only revalidate all teams view if we're in all teams mode
                if (!teamId) {
                    await mutate(meetingKeys.allTeams());
                }
            }

            return result;
        } catch (error) {
            // Rollback on error
            await mutateMeetings();
            throw error;
        }
    };

    // Create meeting
    const createMeeting = async (data: any) => {
        return handleMutation({
            operation: () => meetingApi.createMeeting(teamId!, {
                ...data,
                participant_ids: data.participant_ids?.map((id: string) => id.toString()) || [],
            }),
            optimisticUpdate: (current) => [
                ...current,
                {
                    ...data,
                    id: Date.now(),
                    team_id: teamId!,
                    created_at: new Date().toISOString(),
                    participants: data.participant_ids?.map((id: string) => ({ id })) || [],
                } as Meeting,
            ],
        });
    };

    // Update meeting
    const updateMeeting = async (meetingId: number, data: Partial<Meeting>) => {
        return handleMutation({
            operation: () => meetingApi.updateMeeting(teamId!, meetingId, {
                ...data,
                participant_ids: data.participants?.map(p => p.id.toString()) || undefined,
            }),
            optimisticUpdate: (current) =>
                current.map(m =>
                    m.id === meetingId ? { ...m, ...data } : m
                ),
        });
    };

    // Delete meeting
    const deleteMeeting = async (meetingId: number) => {
        return handleMutation({
            operation: () => meetingApi.deleteMeeting(teamId!, meetingId),
            optimisticUpdate: (current) =>
                current.filter(m => m.id !== meetingId),
        });
    };

    return {
        // Data
        meetings,
        meeting,

        // Loading states
        isLoadingMeetings,
        isLoadingMeeting,

        // Errors
        meetingsError,
        meetingError,

        // Mutations
        createMeeting,
        updateMeeting,
        deleteMeeting,

        // Mutation helpers
        mutateMeetings,
        mutateMeeting,
    };
} 