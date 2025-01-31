"use client"

import * as React from "react"
import {
  Home,
  BarChart2,
  Layout,
  Calendar,
  Users,
  Settings,
  Command,
  Building2,
  ListTodo,
} from "lucide-react"
import { usePathname } from 'next/navigation';
import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDashboard } from "@/contexts/DashboardContext";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { defaultAvatarUrl } from "../common/DefaultAvatarSvg";

// Move this outside component to prevent recreation
const getPersonalItems = () => [
  {
    title: "My Dashboard",
    url: "/dashboard",
    icon: Home,
    items: [
      {
        title: "Main Dashboard",
        url: "/dashboard",
      },
      {
        title: "My Meetings",
        url: "/dashboard/my-meetings",
      },
      {
        title: "My Tasks",
        url: "/dashboard/my-tasks",
      },
      {
        title: "My Reports",
        url: "/dashboard/my-reports",
      },
      {
        title: "My Teams",
        url: "/dashboard/my-teams",
      },
    ],
  },
];

const getTeamItems = (teamId: string) => [
  {
    title: "Team Space",
    url: `/dashboard/${teamId}`,
    icon: Users,
    items: [
      {
        title: "Overview",
        url: `/dashboard/${teamId}`,
      },
      {
        title: "Meetings",
        url: `/dashboard/${teamId}/meetings`,
      },
      {
        title: "Tasks",
        url: `/dashboard/${teamId}/tasks`,
      },
      {
        title: "Reports",
        url: `/dashboard/${teamId}/reports`,
      },
      {
        title: "Members",
        url: `/dashboard/${teamId}/members`,
      },
    ],
  },
];

const getSettingsItems = (teamId: string | undefined | null) => [
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

export const AppSidebar = memo(function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, teams: allTeams } = useDashboard();

  // Get current team ID from URL if we're in a team context
  const teamId = React.useMemo(() => {
    const segments = pathname.split('/');
    const dashboardIndex = segments.indexOf('dashboard');
    if (dashboardIndex === -1) return undefined;
    const possibleTeamId = segments[dashboardIndex + 1];
    return possibleTeamId && !isNaN(Number(possibleTeamId)) ? possibleTeamId : undefined;
  }, [pathname]);

  const isTeamContext = Boolean(teamId);

  // Cache team names for quick lookup




  // Memoize teams list items
  const teamsListItems = React.useMemo(() => !isTeamContext ? [
    {
      title: "Team Space",
      url: "/dashboard/teams",
      icon: Building2,
      items: [
        ...allTeams.slice(0, 5).map(team => ({
          title: team.name,
          url: `/dashboard/${team.id}`,
        })),
        ...(allTeams.length > 5 ? [{
          title: "View All Teams",
          url: "/dashboard",
        }] : []),
      ],
    },
  ] : [], [allTeams, isTeamContext]);

  // Memoize navigation data
  const navData = React.useMemo(() => ({
    navMain: [
      ...getPersonalItems(),
      ...teamsListItems,
      ...(teamId ? getTeamItems(teamId) : []),
      ...getSettingsItems(teamId),
    ],
    projects: isTeamContext ? [
      {
        name: "Daily Standup",
        url: `/dashboard/${teamId}/meetings/daily-standup`,
        icon: Calendar,
      },
      {
        name: "Sprint Planning",
        url: `/dashboard/${teamId}/meetings/sprint-planning`,
        icon: Layout,
      },
      {
        name: "Retrospective",
        url: `/dashboard/${teamId}/meetings/retrospective`,
        icon: BarChart2,
      },
    ] : [],
  }), [teamId, teamsListItems, isTeamContext]);

  // Memoize active states
  const navMainWithActive = React.useMemo(() => ({
    ...navData,
    navMain: navData.navMain.map(section => ({
      ...section,
      isActive: pathname.startsWith(section.url),
      items: section.items?.map(item => ({
        ...item,
        isActive: pathname === item.url,
      })),
    })),
  }), [navData, pathname]);

  // Memoize TeamSwitcher data
  const teamSwitcherData = React.useMemo(() => [
    {
      id: 0,
      name: "Personal",
      plan: "Free",
      logo: Command
    },
    ...allTeams.slice(0, 5).map(team => ({
      id: team.id,
      name: team.name,
      plan: "Free",
      logo: Command
    }))
  ], [allTeams]);

  return (
    <Sidebar collapsible="icon" className={cn("transition-all duration-300", className)} {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamSwitcherData} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive.navMain} />
        {navData.projects.length > 0 && (
          <NavProjects projects={navData.projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ? {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: defaultAvatarUrl
        } : {
          name: 'Loading...',
          email: '',
          avatar: defaultAvatarUrl
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});
