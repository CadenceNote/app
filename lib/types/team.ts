export type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface TeamMember {
    id: number;
    team_id: number;
    user_id: string;
    role: TeamRole;
    created_at: string;
    user: {
        id: string;
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
    members: TeamMember[];
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