"use client"

import * as React from "react"
import { Home, Settings, LucideIcon } from "lucide-react"
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
import { useDashboard } from "@/contexts/DashboardContext";
import { memo, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { defaultAvatarUrl } from "../common/DefaultAvatarSvg";
import Logo from "../common/Logo";
import { ProcessedTeamItem } from "@/contexts/DashboardContext";
import { isEqual } from "lodash";

// Deep comparison utility
const areProcessedTeamsEqual = (a: ProcessedTeamItem[], b: ProcessedTeamItem[]) =>
  a.length === b.length && a.every((item, i) => isEqual(item, b[i]));

// Static nav items outside component
const personalItems = [
  {
    title: "My Dashboard",
    url: "/dashboard",
    icon: Home,
  }
];

const getSettingsItems = (teamId?: string | null) => [
  {
    title: "Settings",
    url: teamId ? `/dashboard/${teamId}/settings` : "/dashboard/settings",
    icon: Settings,
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
      },
      ...(teamId ? [{
        title: "Team Settings",
        url: `/dashboard/${teamId}/settings`,
      }] : []),
    ],
  },
];

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: { title: string; url: string; }[];
}

interface NavData {
  mySpace: NavItem[];
  teamSpace: ProcessedTeamItem[];
  others: NavItem[];
  projects: NavItem[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  className?: string;
}

const calculateActiveStates = (items: NavItem[], pathname: string) =>
  items.map(item => ({
    ...item,
    isActive: pathname.startsWith(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      isActive: pathname === subItem.url,
    }))
  }));

export const AppSidebar = memo(function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, processedTeams, sidebarState, setSidebarState } = useDashboard();
  const previousNavData = useRef<NavData | null>(null);
  const processedTeamsRef = useRef(processedTeams);

  // Deep memoization for nav data
  const navData = useMemo(() => {
    // If we have cached data and teams haven't changed, return cached data
    if (previousNavData.current && areProcessedTeamsEqual(processedTeamsRef.current, processedTeams)) {
      return previousNavData.current;
    }

    // Create new nav data
    const newNavData = {
      mySpace: personalItems,
      teamSpace: processedTeams || [],
      others: getSettingsItems(null),
      projects: [],
    };

    // Update refs
    processedTeamsRef.current = processedTeams;
    previousNavData.current = newNavData;

    return newNavData;
  }, [processedTeams]);

  // Stable active state calculation
  const navMainWithActive = useMemo(() => {
    if (!navData) return { mySpace: [], teamSpace: [], others: [] };

    return {
      mySpace: calculateActiveStates(navData.mySpace, pathname),
      teamSpace: calculateActiveStates(navData.teamSpace, pathname),
      others: calculateActiveStates(navData.others, pathname),
    };
  }, [navData, pathname]);

  // Handle sidebar state changes
  const handleClick = useCallback(() => {
    setSidebarState({
      ...sidebarState,
      isCollapsed: !sidebarState.isCollapsed
    });
  }, [sidebarState, setSidebarState]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn("transition-all duration-300", className)}
      data-state={sidebarState.isCollapsed ? "collapsed" : "expanded"}
      onClick={handleClick}
    >
      <SidebarHeader className="pl-3 pt-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.full_name || 'Unknown',
          email: user?.email || '',
          avatar: user?.avatar_url || defaultAvatarUrl
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});
