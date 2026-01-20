'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  BarChart3,
  Users,
  MessageSquare,
  FileText,
  CheckSquare,
} from "lucide-react"

type SidebarItem = {
  title: string
  icon: any
  url: string
}

const items: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/crm",
    icon: BarChart3,
  },
  {
    title: "Clients",
    url: "/crm/clients",
    icon: Users,
  },
  {
    title: "Feedback",
    url: "/crm/feedback",
    icon: MessageSquare,
  },
  {
    title: "Brochures",
    url: "/crm/brochures",
    icon: FileText,
  },
  {
    title: "Inquiries",
    url: "/crm/inquiries",
    icon: MessageSquare,
  },
  {
    title: "Tasks",
    url: "/crm/tasks",
    icon: CheckSquare,
  },
  {
    title: "Communications",
    url: "/crm/communications",
    icon: FileText,
  },
  {
    title: "Reports",
    url: "/crm/reports",
    icon: BarChart3,
  },
]

export function CrmSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CRM System</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
