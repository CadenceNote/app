'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Home,
    BarChart2,
    Layout,
    GitPullRequest,
    Calendar,
    Map,
    Milestone,
    GitBranch,
    Settings,
    ChevronLeft,
    Users,
    HelpCircle,
    MenuIcon,
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

    const sidebarItems = [
        {
            icon: <Home className="h-4 w-4" />,
            label: 'Home',
            href: '/dashboard',
        },
        {
            icon: <Calendar className="h-4 w-4" />,
            label: 'Daily Feed',
            href: '/dashboard/daily',
        },
        {
            icon: <Layout className="h-4 w-4" />,
            label: 'Board',
            href: '/dashboard/board',
        },
        {
            icon: <GitPullRequest className="h-4 w-4" />,
            label: 'Epics',
            href: '/dashboard/epics',
        },
        {
            icon: <BarChart2 className="h-4 w-4" />,
            label: 'Reports',
            href: '/dashboard/reports',
            hasSubItems: true,
        },
        {
            icon: <Map className="h-4 w-4" />,
            label: 'Roadmap',
            href: '/dashboard/roadmap',
        },
        {
            icon: <Milestone className="h-4 w-4" />,
            label: 'Milestones',
            href: '/dashboard/milestones',
        },
        {
            icon: <GitBranch className="h-4 w-4" />,
            label: 'Workflows',
            href: '/dashboard/workflows',
        },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={cn(
                "bg-white border-r flex flex-col transition-all duration-300",
                isCollapsed ? "w-[60px]" : "w-[240px]"
            )}>
                {/* Project Header */}
                <div className="p-4 border-b flex items-center gap-2">
                    {!isCollapsed && (
                        <div className="text-m,d truncate">My workspace</div>
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

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start gap-2 mb-2",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <Users className="h-4 w-4" />
                        {!isCollapsed && "Invite team members"}
                    </Button>

                    {sidebarItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            isCollapsed={isCollapsed}
                            isActive={pathname === item.href}
                        />
                    ))}
                </div>

                {/* Bottom Section */}
                <div className="p-2 border-t space-y-1">
                    <SidebarItem
                        icon={<Settings className="h-4 w-4" />}
                        label="Edit workspace"
                        href="/dashboard/settings"
                        isCollapsed={isCollapsed}
                    />
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