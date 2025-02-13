import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/common/UserAvatar"
import { useUser } from "@/hooks/useUser"
import { useTeams } from "@/hooks/useTeams"
import { useRouter } from "next/navigation"
import handleSignOut from "@/components/common/handleSignOut"
import { NotificationBell } from "@/components/common/NotificationBell"
import { SidebarTrigger } from "../ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface TeamHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    teamId: number;
}

export default function TeamHeader({ searchTerm, setSearchTerm, teamId }: TeamHeaderProps) {
    const { user } = useUser()
    const { teams } = useTeams()
    const currentTeam = teams?.find(t => t.id === teamId)
    const router = useRouter()

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-6" />
                <h1 className="text-2xl font-semibold text-indigo-900">
                    {currentTeam?.name || 'Loading...'}
                </h1>
            </div>

            <div className="flex items-center space-x-4">
                <Input
                    type="search"
                    placeholder="Search tasks or meetings..."
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <NotificationBell />

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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/profile')}>Profile</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings')}>Settings</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSignOut(router)}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
