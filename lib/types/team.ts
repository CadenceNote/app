export type TeamRole = 'member' | 'admin' | 'meeting_manager';

export interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: TeamRole;
    user: {
        email: string;
        full_name: string;
    };
}

export interface Team {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at?: string;
    is_active: boolean;
    members?: TeamMember[];
}

export interface CreateTeamInput {
    name: string;
    description?: string;
}

export interface UpdateTeamInput {
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface AddTeamMemberInput {
    email: string;
    role?: TeamRole;
}