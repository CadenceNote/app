import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/common/UserAvatar"
import { useUser } from "@/hooks/useUser"
import { useTeams } from "@/hooks/useTeams"

interface TeamHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    teamId: number;
}

export default function TeamHeader({ searchTerm, setSearchTerm, teamId }: TeamHeaderProps) {
    const { user } = useUser()
    const { teams } = useTeams()
    const currentTeam = teams?.find(t => t.id === teamId)

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
            <h1 className="text-2xl font-semibold text-indigo-900">{currentTeam?.name || 'Loading...'}</h1>
            <div className="flex items-center space-x-4">
                <Input
                    type="search"
                    placeholder="Search tasks or meetings..."
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <UserAvatar
                                name={user?.full_name || 'User'}
                                imageUrl={user?.avatar_url}
                                className="h-8 w-8"
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
