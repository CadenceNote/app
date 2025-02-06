import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bell, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Notification, NotificationTitle, NotificationDescription } from "@/components/ui/notification"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { useUser } from "@/hooks/useUser"

interface PHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}



export default function PHeader({ searchTerm, setSearchTerm }: PHeaderProps) {
    const [notifications, setNotifications] = useState<{ id: string; title: string; description: string }[]>([])
    const { user } = useUser()
    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
            <h1 className="text-2xl  ">👋 Hey, {user?.full_name ?? 'Guest'}</h1>
            <div className="flex items-center space-x-4">
                <Input
                    type="search"
                    placeholder="Search tasks or meetings..."
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Bell className="h-4 w-4" />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <h4 className="font-medium leading-none">Notifications</h4>
                            {notifications.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No new notifications.</p>
                            ) : (
                                notifications.map((notification) => (
                                    <Notification key={notification.id} className="grid gap-1">
                                        <NotificationTitle>{notification.title}</NotificationTitle>
                                        <NotificationDescription>{notification.description}</NotificationDescription>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => { }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </Notification>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
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
