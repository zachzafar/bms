'use client'


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/api/publicClient"
import { Users, Building, MessageSquare, CheckSquare, TrendingUp, Calendar } from "lucide-react"
import { REPORTS_DASHBOARD_QUERY_KEY } from "@/lib/api/queryKeys"



const mockActivities = [
  { id: 1, message: "New inquiry from Sarah Johnson for Downtown Apartment", time: "2 minutes ago" },
  { id: 2, message: "Property viewing scheduled with Mike Chen", time: "15 minutes ago" },
  { id: 3, message: "Contract signed for Luxury Villa by David Wilson", time: "1 hour ago" },
  { id: 4, message: "Follow-up call completed with Lisa Anderson", time: "2 hours ago" },
  { id: 5, message: "New client registered: Robert Martinez", time: "3 hours ago" },
]

export default function DashboardOverview() {
  const { data: dashboardData, isLoading } = authClient.reports.getOverallDashboard.useQuery({
    queryKey: REPORTS_DASHBOARD_QUERY_KEY,
  })

  // Map API data to display format
  const displayStats = dashboardData?.body?.contacts ? [
    { 
      name: "Total Contacts", 
      value: dashboardData.body.contacts.totalContacts.toString(), 
      change: `+${dashboardData.body.contacts.newContactsThisMonth}`, 
      changeType: "positive", 
      icon: "Users" 
    },
    { 
      name: "Open Inquiries", 
      value: dashboardData?.body?.inquiries?.inquiriesByStatus.find(s => s.status === "New")?.count.toString() || "0", 
      change: `${dashboardData?.body?.inquiries?.totalInquiries || 0} total`, 
      changeType: "neutral", 
      icon: "MessageSquare" 
    },
    { 
      name: "Overdue Tasks", 
      value: dashboardData?.body?.tasks?.overdueTasks.toString() || "0", 
      change: `${Math.round(dashboardData?.body?.tasks?.completionRate || 0)}% completion rate`, 
      changeType: dashboardData?.body?.tasks?.completionRate > 80 ? "positive" : "negative", 
      icon: "CheckSquare" 
    },
  ] : []

  const displayActivities = mockActivities // Keep mock data for now since we don't have a specific recent activities endpoint

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Welcome back! Here's what's happening with your CRM today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayStats.map((stat: any) => {
          const IconComponent = stat.icon === "Users" ? Users : stat.icon === "Building" ? Building : stat.icon === "MessageSquare" ? MessageSquare : stat.icon === "CheckSquare" ? CheckSquare : Users

          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.name}</CardTitle>
                <IconComponent className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className={`text-xs ${
                  stat.changeType === "positive" ? "text-green-600" : 
                  stat.changeType === "negative" ? "text-red-600" : 
                  "text-gray-600"
                }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your CRM system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Task Summary
            </CardTitle>
            <CardDescription>Current task statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="text-lg font-semibold">{dashboardData?.body?.tasks?.totalTasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-lg font-semibold text-green-600">{dashboardData?.body?.tasks?.completedTasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overdue</span>
                  <span className="text-lg font-semibold text-red-600">{dashboardData?.body?.tasks?.overdueTasks || 0}</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className={`text-lg font-semibold ${
                      dashboardData?.body?.tasks?.completionRate > 80 ? 'text-green-600' : 
                      dashboardData?.body?.tasks?.completionRate > 60 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {Math.round(dashboardData?.body?.tasks?.completionRate || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
