'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Home,
    BarChart2,
    Layout,
    Calendar,
    Users,
    HelpCircle,
    MenuIcon,
    ListTodo,
    UserCircle,
    PlusCircle,
    Settings,
    ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    isCollapsed: boolean;
    isActive?: boolean;
    hasSubItems?: boolean;
}

const SidebarItem = ({
    icon,
    label,
    href,
    isCollapsed,
    isActive,
    hasSubItems
}: SidebarItemProps) => {
    return (
        <Link href={href}>
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start gap-4 px-2",
                    isActive ? "bg-gray-100/50" : "hover:bg-gray-100/50",
                    isCollapsed ? "py-2" : "py-2"
                )}
            >
                {icon}
                {!isCollapsed && (
                    <span className="flex-1 text-left">{label}</span>
                )}
                {!isCollapsed && hasSubItems && (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>
        </Link>
    );
};

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    // Check if we're in a team context by looking for /dashboard/{number}
    // This ensures personal routes like /dashboard/my-tasks don't trigger team context
    const teamId = pathname.split('/').find((segment, index, array) =>
        array[index - 1] === 'dashboard' && !isNaN(Number(segment))
    );

    const isTeamContext = Boolean(teamId);

    const personalSidebarItems = [
        {
            icon: <Home className="h-4 w-4" />,
            label: 'Overview',
            href: '/dashboard',
        },
        {
            icon: <Calendar className="h-4 w-4" />,
            label: 'My Meetings',
            href: '/dashboard/my-meetings',
        },
        {
            icon: <ListTodo className="h-4 w-4" />,
            label: 'My Tasks',
            href: '/dashboard/my-tasks',
        },
        {
            icon: <BarChart2 className="h-4 w-4" />,
            label: 'My Reports',
            href: '/dashboard/my-reports',
        },
        {
            icon: <UserCircle className="h-4 w-4" />,
            label: 'My Teams',
            href: '/dashboard/my-teams',
        },
    ];

    const teamSidebarItems = [
        {
            icon: <Layout className="h-4 w-4" />,
            label: 'Team Overview',
            href: `/dashboard/${teamId}`,
        },
        {
            icon: <Calendar className="h-4 w-4" />,
            label: 'Meetings',
            href: `/dashboard/${teamId}/meetings`,
        },
        {
            icon: <ListTodo className="h-4 w-4" />,
            label: 'Tasks',
            href: `/dashboard/${teamId}/tasks`,
        },
        {
            icon: <BarChart2 className="h-4 w-4" />,
            label: 'Reports',
            href: `/dashboard/${teamId}/reports`,
        },
        {
            icon: <Users className="h-4 w-4" />,
            label: 'Members',
            href: `/dashboard/${teamId}/members`,
        },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={cn(
                "bg-white border-r flex flex-col transition-all duration-300",
                isCollapsed ? "w-[60px]" : "w-[240px]"
            )}>
                {/* Header */}
                <div className="border-b">

                    <div className="p-4 flex items-center gap-2">
                        {!isCollapsed && (
                            <div className="text-md font-medium truncate">
                                {isTeamContext ? 'Team Dashboard' : 'My Dashboard'}
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <MenuIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isTeamContext ? (
                        // Team context
                        <>
                            {teamSidebarItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    {...item}
                                    isCollapsed={isCollapsed}
                                    isActive={pathname === item.href}
                                />
                            ))}
                        </>
                    ) : (
                        // Personal context
                        <>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start gap-2 mb-2",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <PlusCircle className="h-4 w-4" />
                                {!isCollapsed && "Join Team"}
                            </Button>
                            {personalSidebarItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    {...item}
                                    isCollapsed={isCollapsed}
                                    isActive={pathname === item.href}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Bottom Section */}
                <div className="p-2 border-t space-y-1">
                    {isTeamContext && (
                        <SidebarItem
                            icon={<UserCircle className="h-4 w-4" />}
                            label="My Dashboard"
                            href="/dashboard"
                            isCollapsed={isCollapsed}
                        />
                    )}
                    <SidebarItem
                        icon={<Settings className="h-4 w-4" />}
                        label="Settings"
                        href={isTeamContext ? `/dashboard/${teamId}/settings` : "/dashboard/settings"}
                        isCollapsed={isCollapsed}
                    />

                    {!isTeamContext && (
                        <SidebarItem
                            icon={<UserCircle className="h-4 w-4" />}
                            label="Profile"
                            href="/dashboard/profile"
                            isCollapsed={isCollapsed}
                        />
                    )}
                    <SidebarItem
                        icon={<HelpCircle className="h-4 w-4" />}
                        label="Help center"
                        href="/help"
                        isCollapsed={isCollapsed}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}