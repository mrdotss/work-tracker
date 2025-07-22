"use client"

import * as React from "react"
import {
  IconDashboard,
  IconUsers,
  IconUserCheck,
  IconSettings,
  IconInnerShadowTop,
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/nav-main"
// import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  // Navigation items based on a user role
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    ...(session?.user && session.user.role === "ADMIN"
      ? [
          {
            title: "Admin",
            url: "/admin",
            icon: IconUsers,
            items: [
              {
                title: "Staff Management",
                url: "/admin",
              },
              {
                title: "Units",
                url: "/admin/units",
              },
              {
                title: "Check Items",
                url: "/admin/check-items",
              },
            ],
          },
        ]
      : []),
    ...(session?.user && session.user.role === "STAFF"
      ? [
          {
            title: "Staff",
            url: "/staff",
            icon: IconUserCheck,
          },
        ]
      : []),
  ]

  // const navSecondary = [
  //   {
  //     title: "Settings",
  //     url: "/settings",
  //     icon: IconSettings,
  //   },
  // ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Work Tracker</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/*<NavSecondary items={navSecondary} className="mt-auto" />*/}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
