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
  {
    title: "Reports",
    url: "/bookings/reports",
    icon: Clipboard,
    feature: "reports",
  },
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

                // ✅ Parent WITH children → new nested group
                if (visibleChildren?.length) {
                  return (
                    <SidebarGroup key={item.title}>
                      <SidebarGroupLabel className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </SidebarGroupLabel>

                      <SidebarGroupContent>
                        <SidebarMenu>
                          {visibleChildren.map((child) => (
                            <SidebarMenuItem key={child.title}>
                              <SidebarMenuButton asChild>
                                <a href={child.url}>
                                  <child.icon className="h-4 w-4" />
                                  <span>{child.title}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  )
                }

                // ✅ Parent WITHOUT children
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
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
