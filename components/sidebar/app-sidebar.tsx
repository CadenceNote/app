"use client"

import * as React from "react"
import { Home, Settings, LucideIcon, Building2, Clock, CheckSquare, BookOpen } from "lucide-react"
import { usePathname } from 'next/navigation';
import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { memo, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { defaultAvatarUrl } from "../common/DefaultAvatarSvg";
import Logo from "../common/Logo";
import { useTeams } from "@/hooks/useTeams";
import { useUser } from "@/hooks/useUser";

// Static nav items outside component
const personalItems = [
  {
    title: "My Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Time Tracking",
    url: "/dashboard/time-tracking",
    icon: Clock,
  },
  {
    title: "Checklists",
    url: "/dashboard/checklists",
    icon: CheckSquare,
  }
];

const getSettingsItems = () => [
  {
    title: "Tutorial",
    url: "/tutorial",
    icon: BookOpen,
  },
];

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: { title: string; url: string; }[];
}

interface AppSidebarProps {
  className?: string;
}

const calculateActiveStates = (items: NavItem[], pathname: string) =>
  items.map(item => ({
    ...item,
    isActive: item.title === "My Dashboard" ? pathname === item.url : pathname.startsWith(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      isActive: pathname === subItem.url,
    }))
  }));

export const AppSidebar = memo(function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { teams, isLoading } = useTeams();

  // Add loading state handling
  if (isLoading) {
    return <div>Loading teams...</div>;
  }

  // Transform teams data for TeamSwitcher
  const teamSwitcherData = useMemo(() => {
    if (!teams?.length) return [];

    return teams.map(team => ({
      id: team.id,
      name: team.name,
      logo: Building2,
      plan: 'Free' // Default plan for now
    }));
  }, [teams]);

  // Get current team from pathname
  const getCurrentTeamId = useCallback((path: string) => {
    const matches = path.match(/\/dashboard\/(\d+)/);
    return matches ? Number(matches[1]) : null;
  }, []);

  const currentTeamId = getCurrentTeamId(pathname);

  // Calculate active states
  const navMainWithActive = {
    mySpace: calculateActiveStates(personalItems, pathname),
    others: calculateActiveStates(getSettingsItems(), pathname),
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn("transition-all duration-300", className)}
    >
      <SidebarHeader className="pl-3 pt-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={{
            mySpace: navMainWithActive.mySpace,
            others: navMainWithActive.others,
            teamSwitcher: {
              teams: teamSwitcherData,
              currentTeamId,
              showTeamSpace: Boolean(currentTeamId)
            }
          }}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.full_name || user?.email || 'Unknown',
          email: user?.email || '',
          avatar: user?.avatar_url || defaultAvatarUrl
        }} />
      </SidebarFooter>
      <SidebarRail className="hover:after:bg-gradient-to-b from-indigo-500/50 to-green-500/50" />
    </Sidebar>
  );
});

