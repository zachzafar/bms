"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Menu, Users, Building, MessageSquare, CheckSquare, BarChart3, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppHeader } from "./app-header"

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Clients", href: "/crm/clients", icon: Users },
  // { name: "Properties", href: "/properties", icon: Building },
  { name: "Feedback", href: "/crm/feedback", icon: MessageSquare },
  { name: "Brochures", href: "/crm/brochure", icon: FileText },
  { name: "Inquiries", href: "/crm/inquiries", icon: MessageSquare },
  { name: "Tasks", href: "/crm/tasks", icon: CheckSquare },
  { name: "Communications", href: "/crm/communications", icon: FileText },
  { name: "Reports", href: "/crm/reports", icon: BarChart3 },
  // { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Function to determine if a navigation item is current
  const isCurrentPath = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center px-6 border-b">
              <h1 className="text-xl font-bold text-foreground">CRM System</h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const isCurrent = isCurrentPath(item.href)
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isCurrent
                        ? "bg-primary/10 border-blue-500 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
                      "group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md",
                    )}
                  >
                    <item.icon
                      className={cn(
                        isCurrent ? "text-primary" : "text-muted-foreground group-hover:text-muted-foreground",
                        "mr-3 h-5 w-5",
                      )}
                    />
                    {item.name}
                  </a>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-border">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">CRM System</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isCurrentPath(item.href)
                      ? "bg-primary/10 border-blue-500 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
                    "group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md",
                  )}
                >
                  <item.icon
                    className={cn(
                      isCurrentPath(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-muted-foreground",
                      "mr-3 h-5 w-5",
                    )}
                  />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <AppHeader />
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
