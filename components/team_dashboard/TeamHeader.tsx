import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/common/UserAvatar"
import { useUser } from "@/hooks/useUser"
import { useTeams } from "@/hooks/useTeams"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import handleSignOut from "@/components/common/handleSignOut"

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
        <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 p-4 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center h-8 px-4">
                {/* Left section */}
                <div className="flex-none flex items-center space-x-4">
                    <h1 className="pl-12 text-xl font-semibold text-indigo-900">{currentTeam?.name || 'Loading...'}</h1>
                </div>

                {/* Center section - Search */}
                <div className="flex-1 flex justify-center px-4">
                    <div className="w-full max-w-2xl">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search tasks or meetings..."
                            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex-none flex items-center space-x-2">
                    <div className="relative">
                        <button className="p-2 text-gray-400 hover:text-gray-500">
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                9
                            </span>
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
            </div>
        </header>
    )
}
