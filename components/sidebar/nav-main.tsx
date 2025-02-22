"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Plus } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"

interface NavMainProps {
  items: {
    mySpace: {
      title: string
      url: string
      icon?: React.ElementType
      isActive?: boolean
      items?: {
        title: string
        url: string
        isActive?: boolean
      }[]
    }[]
    others: {
      title: string
      url: string
      icon?: React.ElementType
      isActive?: boolean
      items?: {
        title: string
        url: string
        isActive?: boolean
      }[]
    }[]
    teamSwitcher: {
      teams: {
        id: number
        name: string
        logo: React.ElementType
        plan: string
      }[]
      currentTeamId: number | null
      showTeamSpace: boolean
    }
  }
}

export function NavMain({ items }: NavMainProps) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Personal</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.mySpace.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.items ? (
                  <>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto" />
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                          >
                            <Link href={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>
          Team Space
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <TeamSwitcher
            teams={items.teamSwitcher.teams}
            currentTeamId={items.teamSwitcher.currentTeamId}
            variant="list"
          />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Quick Start</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.others.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.items ? (
                  <>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto" />
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                          >
                            <Link href={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
