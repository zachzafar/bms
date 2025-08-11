import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building, MessageSquare, CheckSquare, TrendingUp, Calendar } from "lucide-react"

const stats = [
  {
    name: "Total Clients",
    value: "2,651",
    change: "+4.75%",
    changeType: "positive",
    icon: Users,
  },
  {
    name: "Active Properties",
    value: "1,423",
    change: "+54.02%",
    changeType: "positive",
    icon: Building,
  },
  {
    name: "Open Inquiries",
    value: "89",
    change: "-1.39%",
    changeType: "negative",
    icon: MessageSquare,
  },
  {
    name: "Pending Tasks",
    value: "12",
    change: "+10.18%",
    changeType: "positive",
    icon: CheckSquare,
  },
]

const recentActivities = [
  {
    id: 1,
    type: "inquiry",
    message: "New inquiry from Sarah Johnson for 3-bedroom apartment",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "task",
    message: "Follow-up call with Michael Brown completed",
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "client",
    message: "New client Emma Davis added to the system",
    time: "3 hours ago",
  },
  {
    id: 4,
    type: "property",
    message: "Property listing updated: Downtown Condo",
    time: "5 hours ago",
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Welcome back! Here's what's happening with your CRM today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
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
              {recentActivities.map((activity) => (
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
              Upcoming Tasks
            </CardTitle>
            <CardDescription>Tasks scheduled for today and tomorrow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Follow up with John Smith</p>
                  <p className="text-xs text-gray-500">Due today at 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Property viewing with Lisa Chen</p>
                  <p className="text-xs text-gray-500">Tomorrow at 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Send brochure to David Wilson</p>
                  <p className="text-xs text-gray-500">Tomorrow at 3:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
