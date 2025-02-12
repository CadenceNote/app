import { supabase } from '@/lib/supabase';
import { TeamRole } from '@/lib/types/team';
import { MeetingType, MeetingStatus, MeetingNotes, MeetingNoteBlock, TaskSuggestion } from '@/lib/types/meeting';

interface Meeting {
    id: number;
    title: string;
    description?: string;
    type: MeetingType;
    status: MeetingStatus;
    duration_minutes: number;
    start_time: string;
    participants: {
        id: string;
        email: string;
        full_name: string;
        role?: TeamRole;
    }[];
    notes: Record<string, MeetingNotes>;
    summary?: string;
    settings?: {
        goals: string[];
        agenda: string[];
    };
}

interface CreateMeetingInput {
    title: string;
    description?: string;
    type: Meeting['type'];
    start_time: string;
    duration_minutes: number;
    participant_ids: string[];
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    assignee_id?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    due_date?: string;
}

interface Task {
    id: number;
    title: string;
    status: string;
}

interface UserSearchResponse {
    users: Array<{
        id: string;
        name: string;
        email: string;
    }>;
}

export const meetingApi = {
    // Get a specific meeting
    getMeeting: async (teamId: number, meetingId: number): Promise<Meeting> => {
        const { data: meeting, error } = await supabase
            .from('meetings')
            .select(`
                *,
                meeting_participants(
                    user:users(supabase_uid, email, full_name)
                )
            `)
            .eq('id', meetingId)
            .eq('team_id', teamId)
            .single();

        if (error) throw error;

        const { data: notes, error: notesError } = await supabase
            .from('meeting_notes')
            .select('*')
            .eq('meeting_id', meetingId);

        if (notesError) throw notesError;

        const formattedNotes: Record<string, MeetingNotes> = {};
        notes?.forEach(note => {
            formattedNotes[note.user_id] = {
                content: note.content,
                version: note.version,
                lastEditedAt: note.last_edited_at
            };
        });

        return {
            ...meeting,
            participants: meeting.meeting_participants.map(mp => ({
                id: mp.user.supabase_uid,
                email: mp.user.email,
                full_name: mp.user.full_name
            })),
            notes: formattedNotes
        };
    },

    updateMeeting: async (teamId: number, meetingId: number, data: Partial<Meeting>): Promise<Meeting> => {
        const { data: updated, error } = await supabase
            .from('meetings')
            .update({
                ...data,
                status: data.status?.toUpperCase(),
                updated_at: new Date().toISOString()
            })
            .eq('id', meetingId)
            .eq('team_id', teamId)
            .select()
            .single();

        if (error) throw error;
        return updated;
    },

    // List meetings
    listMeetings: async (teamId: number): Promise<Meeting[]> => {
        const { data: meetings, error } = await supabase
            .from('meetings')
            .select(`
                *,
                meeting_participants(
                    user:users(supabase_uid, email, full_name)
                )
            `)
            .eq('team_id', teamId);

        if (error) throw error;

        return meetings.map(meeting => ({
            ...meeting,
            participants: meeting.meeting_participants.map(mp => ({
                id: mp.user.supabase_uid,
                email: mp.user.email,
                full_name: mp.user.full_name
            }))
        }));
    },

    // Create meeting
    createMeeting: async (teamId: number, data: CreateMeetingInput): Promise<Meeting> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');


        const { data: meeting, error } = await supabase
            .from('meetings')
            .insert({
                team_id: teamId,
                title: data.title,
                description: data.description,
                type: data.type,
                start_time: data.start_time,
                duration_minutes: data.duration_minutes,
                status: 'SCHEDULED'
            })
            .select()
            .single();

        if (error) throw error;

        // Add participants
        const participantRows = data.participant_ids.map(userId => ({
            meeting_id: meeting.id,
            user_id: userId
        }));

        const { error: participantError } = await supabase
            .from('meeting_participants')
            .insert(participantRows);

        if (participantError) throw participantError;

        // Send notifications to participants


        // Get the complete meeting data with participants
        return meetingApi.getMeeting(teamId, meeting.id);
    },

    // Search tasks
    searchTasks: async (teamId: number, query: string): Promise<TaskSuggestion[]> => {
        const response = await supabase.rpc('search_tasks', {
            team_id: teamId,
            query: query
        });
        return response.data.tasks;
    },

    // Search users
    searchUsers: async (teamId: number, query: string): Promise<UserSearchResponse> => {
        const { data: teamMembers, error } = await supabase
            .from('team_members')
            .select(`
                user:users(supabase_uid, email, full_name)
            `)
            .eq('team_id', teamId)
            .textSearch('user.full_name', query);

        if (error) throw error;

        return {
            users: teamMembers.map(tm => ({
                id: tm.user.supabase_uid,
                name: tm.user.full_name,
                email: tm.user.email
            }))
        };
    },

    // Create task from note
    createTaskFromNote: async (teamId: number, meetingId: number, data: CreateTaskInput): Promise<Task> => {
        const response = await supabase.rpc('create_task_from_note', {
            team_id: teamId,
            meeting_id: meetingId,
            title: data.title,
            description: data.description,
            assignee_id: data.assignee_id,
            priority: data.priority,
            due_date: data.due_date
        });
        return {
            id: response.data.id,
            title: response.data.title,
            status: response.data.status
        };
    },

    // Update notes
    updateNotes: async (teamId: number, meetingId: number, userId: string, blocks: MeetingNoteBlock[]): Promise<void> => {
        const { error } = await supabase
            .from('meeting_notes')
            .upsert({
                meeting_id: meetingId,
                user_id: userId,
                content: blocks,
                last_edited_at: new Date().toISOString(),
                version: 1
            });

        if (error) throw error;
    },

    // Update meeting participants
    updateParticipants: async (teamId: number, meetingId: number, participantIds: string[]): Promise<void> => {
        // First delete existing participants
        const { error: deleteError } = await supabase
            .from('meeting_participants')
            .delete()
            .eq('meeting_id', meetingId);

        if (deleteError) throw deleteError;

        // Then add new participants
        const participantRows = participantIds.map(userId => ({
            meeting_id: meetingId,
            user_id: userId
        }));

        const { error: insertError } = await supabase
            .from('meeting_participants')
            .insert(participantRows);

        if (insertError) throw insertError;
    },

    // Get user's role in a team
    getTeamRole: async (teamId: number): Promise<{ role: TeamRole }> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error('Not authenticated');

        const { data: teamMember, error } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', session.session.user.id)
            .single();

        if (error) throw error;
        return { role: teamMember.role as TeamRole };
    }
}; 