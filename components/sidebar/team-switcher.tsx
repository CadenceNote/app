"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronsUpDown, Plus, Users } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface TeamSwitcherProps {
  teams: {
    id: number
    name: string
    logo: React.ElementType
    plan: string
  }[]
  currentTeamId: number | null
  variant?: 'dropdown' | 'list'
}

// Alternative list-style version
const TeamSwitcherList = React.memo(function TeamSwitcherList({ teams, currentTeamId }: Omit<TeamSwitcherProps, 'variant'>) {
  // Sort teams to ensure consistent order and handle personal space
  const sortedTeams = React.useMemo(() => {
    return [...teams].sort((a, b) => {
      // Personal space (id: 0) always comes first
      if (a.id === 0) return -1
      if (b.id === 0) return 1
      return a.name.localeCompare(b.name)
    })
  }, [teams])

  return (
    <SidebarMenu>
      {sortedTeams.map((team) => (
        <SidebarMenuItem key={`team-${team.name}-${team.id}`}>
          <SidebarMenuButton
            asChild
            isActive={team.id === currentTeamId}
            tooltip={team.name}
          >
            <Link href={team.id === 0 ? '/dashboard' : `/dashboard/${team.id}`}>
              <team.logo className="size-4" />
              <span>{team.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip="Create New Team"
        >
          <Link href="/dashboard/teams/create">
            <Plus className="size-4" />
            <span>Create New Team</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
})

// Original dropdown version
const TeamSwitcherDropdown = React.memo(function TeamSwitcherDropdown({ teams, currentTeamId }: Omit<TeamSwitcherProps, 'variant'>) {
  const { isMobile } = useSidebar()

  // Sort teams to ensure consistent order and handle personal space
  const sortedTeams = React.useMemo(() => {
    return [...teams].sort((a, b) => {
      // Personal space (id: 0) always comes first
      if (a.id === 0) return -1
      if (b.id === 0) return 1
      return a.name.localeCompare(b.name)
    })
  }, [teams])

  const activeTeam = React.useMemo(() =>
    currentTeamId === null ? null : sortedTeams.find(t => t.id === currentTeamId),
    [currentTeamId, sortedTeams]
  )

  const handleTeamClick = React.useCallback((team: typeof teams[0]) => {
    try {
      // Close the dropdown first
      const dropdownTrigger = document.querySelector('[data-state="open"]') as HTMLElement
      dropdownTrigger?.click()

      // Navigate using window.location for reliable navigation
      const url = team.id === 0 ? '/dashboard' : `/dashboard/${team.id}`
      window.location.href = url
    } catch (error) {
      console.error('Navigation failed:', error)
    }
  }, [])

  const handleCreateTeam = React.useCallback(() => {
    window.location.href = '/dashboard/teams/create'
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Users className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <>
                  <span className="truncate font-semibold">
                    Switch Team
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Select a workspace
                  </span>
                </>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {activeTeam ? "Switch Team" : "Available Teams"}
            </DropdownMenuLabel>
            {sortedTeams.map((team) => (
              <DropdownMenuItem
                key={`team-${team.name}-${team.id}`}
                onClick={() => handleTeamClick(team)}
                className={cn(
                  "gap-2 p-2",
                  team.id === currentTeamId && "bg-accent"
                )}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                <span className="flex-1">{team.name}</span>
                {team.id === currentTeamId && (
                  <span className="text-xs text-muted-foreground">Current</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={handleCreateTeam}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Create new team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
})

// Main component that switches between variants
export const TeamSwitcher = React.memo(function TeamSwitcher({ teams, currentTeamId, variant = 'dropdown' }: TeamSwitcherProps) {
  return variant === 'dropdown' ? (
    <TeamSwitcherDropdown teams={teams} currentTeamId={currentTeamId} />
  ) : (
    <TeamSwitcherList teams={teams} currentTeamId={currentTeamId} />
  )
})
