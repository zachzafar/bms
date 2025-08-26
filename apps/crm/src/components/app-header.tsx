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
  Globe
} from "lucide-react"
import { useCrossDomainAuth } from "@/hooks/useCrossDomainAuth"
import { StorageService } from "@/lib/api/storage"

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
    id: 'booking',
    name: 'Booking Platform',
    description: 'Manage property bookings and reservations',
    icon: <Building className="h-4 w-4" />,
    url: process.env.NODE_ENV === 'production' ? 'https://booking.bookos.xyz' : 'http://localhost:3000',
    color: 'text-blue-600'
  },
  {
    id: 'auth',
    name: 'Auth Hub',
    description: 'Central authentication and user management',
    icon: <Globe className="h-4 w-4" />,
    url: process.env.NODE_ENV === 'production' ? 'https://bookos.xyz' : 'http://localhost:3002',
    color: 'text-green-600'
  }
]

export function AppHeader() {
  const { logout, isAuthenticated, isLoading } = useCrossDomainAuth()
  const [currentUser, setCurrentUser] = useState({ name: 'User', initials: 'U' })

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const user = await StorageService.getUser()
        if (user) {
          const name = user.name || user.email || 'User'
          const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U'
          setCurrentUser({ name, initials })
        }
      } catch (error) {
        console.error('Failed to get user info:', error)
      }
    }

    if (isAuthenticated && !isLoading) {
      getUserInfo()
    }
  }, [isAuthenticated, isLoading])

  const handleAppSwitch = (app: AppOption) => {
    // Store current CRM state if needed
    localStorage.setItem('crm_last_visited', window.location.pathname)
    
    // Redirect to the selected app
    window.location.href = app.url
  }

  const handleLogout = () => {
    logout()
  }

  // Don't render if still loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="h-8 w-8 rounded-full bg-gray-300 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
      <div className="flex flex-1"></div>
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Application Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Switch App</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-medium text-gray-500">
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
                  <span className="text-sm font-medium text-gray-900">{app.name}</span>
                  <span className="text-xs text-gray-500">{app.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile and Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{currentUser.initials}</span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {currentUser.name}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm font-medium text-gray-500">
              Account
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
