import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TeamCardProps {
    team: {
        id: number;
        name: string;
        memberCount: number;
        description: string;
    };
}

export function TeamCard({ team }: TeamCardProps) {
    const router = useRouter();

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    {team.name}
                </CardTitle>
                <CardDescription>
                    {team.memberCount} members
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                <Button
                    className="w-full"
                    onClick={() => router.push(`/dashboard/${team.id}`)}
                >
                    View Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
}