"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Building,
  Users,
  LogOut,
  ChevronDown,
  User,
  Globe,
  Calendar
} from "lucide-react"
import { useStorage } from "@/hooks/useStorage"
import { deleteSession } from "@/lib/api/session"
import { StorageService } from "@/lib/api/storage"
import { queryClient } from "@/providers/tanstack"
import { ModeToggle } from "@/components/mode-toggle"

interface AppOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  url: string
  color: string
}

const appOptions: AppOption[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administration Dashboard',
    icon: <Building className="h-4 w-4" />,
    url: '/admin',
    color: 'text-primary'
  },
  // {
  //   id: 'booking',
  //   name: 'Booking',
  //   description: 'Manage bookings',
  //   icon: <Calendar className="h-4 w-4" />,
  //   url: '/booking',
  //   color: 'text-primary'
  // },
  // {
  //   id: 'crm',
  //   name: 'CRM System',
  //   description: 'Manage clients, inquiries, and business relationships',
  //   icon: <Users className="h-4 w-4" />,
  //   url: '/crm',
  //   color: 'text-primary'
  // },
]

export function AppHeader() {
  const { user } = useStorage()
  const [currentUser, setCurrentUser] = useState({ name: 'User', initials: 'U' })

  useEffect(() => {
    if (user) {
      const name = user.name || user.email || 'User'
      const initials = name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U'
      setCurrentUser({ name, initials })
    }
  }, [user])

  const handleAppSwitch = (app: AppOption) => {
    // Redirect to the selected app
    window.location.href = app.url
  }

  const handleLogout = async () => {
    try {
      StorageService.removeToken()
      StorageService.removeUser()
      StorageService.removeTenant()
      StorageService.removeTenantList()
      await deleteSession()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className="flex items-center gap-x-4 lg:gap-x-6">
      {/* Dark Mode Toggle */}
      <ModeToggle />

      {/* Application Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Switch App</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Switch Application
          </div>
          <DropdownMenuSeparator />
          {appOptions.map((app) => (
            <DropdownMenuItem
              key={app.id}
              onClick={() => handleAppSwitch(app)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer"
            >
              <div className={`${app.color}`}>
                {app.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{app.name}</span>
                <span className="text-xs text-muted-foreground">{app.description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Profile and Logout */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">{currentUser.initials}</span>
            </div>
            <span className="hidden sm:inline text-sm font-medium text-foreground">
              {currentUser.name}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Account
          </div>
          {/* <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer text-destructive hover:text-destructive/90"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
