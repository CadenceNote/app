"use client"
import { useEffect, useState } from "react"
import { NotificationBell } from "../common/NotificationBell"
import { Separator } from "../ui/separator"
import { SidebarTrigger } from "../ui/sidebar"
import { DropdownNavigation } from "../ui/dropdown-navigation"
import { Settings, Layout, Users, Home, Sun, Moon } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "../ui/button"
import { useTheme } from "next-themes"
export default function DashboardHeader({ context }: { context: string }) {
    const [searchTerm, setSearchTerm] = useState("")
    const params = useParams()
    const teamId = params?.teamId as string | undefined
    const { theme, setTheme } = useTheme()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])


    // Define navigation items based on scope
    const getNavigationItems = () => {
        const baseNavItems = [
            {
                title: "Navigation",
                items: [
                    {
                        key: "personal-dashboard",
                        label: "Personal Dashboard",
                        description: "View your personal dashboard",
                        icon: Home,
                        href: "/dashboard"
                    }
                ]
            }
        ];

        // Add team-specific navigation when in team scope
        if (teamId) {
            baseNavItems[0].items = [
                {
                    key: "team-dashboard",
                    label: "Team Dashboard",
                    description: "View team dashboard",
                    icon: Layout,
                    href: `/dashboard/${teamId}`
                },
                {
                    key: "team-members",
                    label: "Team Members",
                    description: "Manage team members",
                    icon: Users,
                    href: `/dashboard/${teamId}/members`
                },
                {
                    key: "team-settings",
                    label: "Team Settings",
                    description: "Manage team settings",
                    icon: Settings,
                    href: `/dashboard/${teamId}/settings`
                }
            ];
        } else {
            // Add personal settings when in personal scope
            baseNavItems[0].items.push({
                key: "personal-settings",
                label: "Settings",
                description: "Manage your preferences",
                icon: Settings,
                href: "/dashboard/settings"
            });
        }

        return [{
            id: 1,
            key: "main-nav",
            label: context,
            subMenus: baseNavItems
        }];
    };

    return (
        <div className="border-b">
            <div className="flex items-center h-14 px-4">
                {/* Left section */}
                <div className="flex-none flex items-center space-x-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-6" />
                    <div className="relative">
                        <DropdownNavigation navItems={getNavigationItems()} />
                    </div>
                </div>
                {/* Center section - Search */}
                <div className="flex-1 flex justify-center px-4">
                    <div className="w-full max-w-2xl">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex-none flex items-center space-x-2">
                    <div className="relative">
                        {mounted && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className=""
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                        <NotificationBell />
                    </div>
                </div>
            </div>
        </div>
    )
}