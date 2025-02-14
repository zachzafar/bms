import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
  } from "@/components/ui/sidebar"
import { Home, Box, Calendar, Clipboard,Cog, Settings, User2 } from "lucide-react"
import Logout from "./Logout"



// Menu items.
const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: Calendar,
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Cog,
    },
    {
      title: "Assets",
      url: "/assets",
      icon: Box,
    },
    {
        title: "Reports",
        url: "/reports",
        icon: Clipboard,
      },
      {
        title:"Users",
        url:"/users",
        icon: User2
      },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ]
   
  export function AppSidebar() {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <Logout />
        </SidebarFooter>
      </Sidebar>
    )
  }