'use client';

import { TeamCard } from '@/components/dashboard/TeamCard';
import { useRouter } from 'next/navigation';

export function TeamGrid() {
    const router = useRouter();

    // Mock data - would come from API
    const teams = [
        {
            id: 1,
            name: "Frontend Team",
            memberCount: 5,
            description: "Core frontend development team"
        },
        {
            id: 2,
            name: "Backend Team",
            memberCount: 4,
            description: "API and infrastructure team"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
                <TeamCard
                    key={team.id}
                    team={team}
                    onMeetingsClick={() => router.push(`/dashboard/${team.id}/meetings`)}
                    onTasksClick={() => router.push(`/dashboard/${team.id}/tasks`)}
                />
            ))}
        </div>
    );
}