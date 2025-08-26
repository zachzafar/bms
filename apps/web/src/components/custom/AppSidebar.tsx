import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { Home, Box, Calendar, Clipboard, Cog, Settings, User2, CircleDollarSign, CreditCard, DollarSign, FileText } from "lucide-react"



// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Bookings",
    icon: Calendar,
    children: [
      {
        title: "Rates",
        url: "/bookings/rates",
        icon: CircleDollarSign,
      },
      {
        title: "Bookings",
        url: "/bookings",
        icon: Calendar,
      }
    ]
  },
  {
    title: "Maintenance",
    url: "/maintenance",
    icon: Cog,
  },
  {
    title: "Assets",
    icon: Box,
    children: [
      {
        title: "Asset List",
        url: "/assets",
        icon: Box,
      },
      {
        title: "Config",
        url: "/assets/config",
        icon: Settings
      },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: Clipboard,
  },
  {
    title: "Users",
    icon: User2,
    children: [
      {
        title: "Owners",
        url: "/users/owners",
        icon: User2,
      },
      {
        title: "Customers",
        url: "/users/customers",
        icon: User2,
      },
    ]
  },
  {
    title: "Billing",
    url: "/billing",
    icon: DollarSign,
    children: [
      {
        title: "Invoices",
        url: "/billing/invoices",
        icon: FileText,
      },
      {
        title: "Payments",
        url: "/billing/payments",
        icon: CreditCard,
      },
    ]
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
                  {item.children ? (
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <a href={child.url} className="flex items-center gap-2">
                                <child.icon className="h-4 w-4" />
                                <span>{child.title}</span>
                              </a>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}