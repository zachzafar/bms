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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  Home,
  Box,
  Calendar,
  Clipboard,
  Cog,
  Settings,
  User2,
  CreditCard,
  DollarSign,
  FileText,
  CircleDollarSign,
  ChevronDown,
} from "lucide-react"

import { FEATURE_PERMISSIONS } from "@/lib/feature-permissions"
import { canAccessFeature } from "@/lib/permissions"
import { usePermissions } from "@/lib/auth/use-permissions"

type FeatureKey = keyof typeof FEATURE_PERMISSIONS

type SidebarItem = {
  title: string
  icon: any
  url?: string
  feature?: FeatureKey
  children?: {
    title: string
    url: string
    icon: any
    feature?: FeatureKey
  }[]
}

const items: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/bookings/dashboard",
    icon: Home,
    feature: "analytics",
  },
  {
    title: "Bookings",
    icon: Calendar,
    children: [
      {
        title: "Rates",
        url: "/bookings/booking/rates",
        icon: CircleDollarSign,
        feature: "settings",
      },
      {
        title: "Bookings",
        url: "/bookings/booking",
        icon: Calendar,
        feature: "bookings_assets",
      },
      {
        title: "Booking Calendar",
        url: "/bookings/booking/calendar",
        icon: Calendar,
        feature: "bookings_assets",
      },
    ],
  },
  {
    title: "Maintenance",
    url: "/bookings/maintenance",
    icon: Cog,
    feature: "settings",
  },
  {
    title: "Assets",
    icon: Box,
    children: [
      {
        title: "Asset List",
        url: "/bookings/assets",
        icon: Box,
        feature: "bookings_assets",
      },
      {
        title: "Config",
        url: "/bookings/assets/config",
        icon: Settings,
        feature: "settings",
      },
    ],
  },
  // {
  //   title: "Reports",
  //   url: "/bookings/reports",
  //   icon: Clipboard,
  //   feature: "reports",
  // },
  {
    title: "Users",
    icon: User2,
    children: [
      {
        title: "Owners",
        url: "/bookings/users/owners",
        icon: User2,
        feature: "settings",
      },
      {
        title: "Customers",
        url: "/bookings/users/customers",
        icon: User2,
        feature: "settings",
      },
      {
        title: "Config",
        url: "/bookings/users/config",
        icon: Settings,
        feature: "settings",
      },
    ],
  },
  {
    title: "Billing",
    icon: DollarSign,
    children: [
      {
        title: "Invoices",
        url: "/bookings/billing/invoices",
        icon: FileText,
        feature: "invoices",
      },
      {
        title: "Payments",
        url: "/bookings/billing/payments",
        icon: CreditCard,
        feature: "invoices",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    children: [
      {
        title: "General",
        url: "/bookings/settings",
        icon: Settings,
        feature: "settings",
      },
      // {
      //   title: "Booking Forms",
      //   url: "/bookings/settings/forms",
      //   icon: FileText,
      //   feature: "settings",
      // },
    ],
  },
]

export function AppSidebar() {
  const { permissions: userPermissions, loading } = usePermissions()

  if (loading) return null

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const visibleChildren = item.children?.filter(
                  (child) =>
                    !child.feature ||
                    canAccessFeature(
                      userPermissions,
                      FEATURE_PERMISSIONS[child.feature]
                    )
                )

                const canShowParent =
                  (!item.feature ||
                    canAccessFeature(
                      userPermissions,
                      FEATURE_PERMISSIONS[item.feature]
                    )) &&
                  (!item.children || visibleChildren?.length)

                if (!canShowParent) return null

                // Parent WITH children → collapsible menu
                if (visibleChildren?.length) {
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {visibleChildren.map((child) => (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={child.url}>
                                    <child.icon className="h-4 w-4" />
                                    <span>{child.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                // Parent WITHOUT children → simple link
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url!}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
