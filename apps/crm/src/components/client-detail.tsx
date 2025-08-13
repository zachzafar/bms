"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Calendar, MessageSquare, FileText, User } from "lucide-react"

interface ClientDetailProps {
  client: any
  onClose: () => void
}

// Mock data for client activities
const mockActivities = [
  {
    id: 1,
    type: "inquiry",
    title: "Property Inquiry",
    description: "Inquired about 3-bedroom apartment in downtown",
    date: "2024-01-20",
    status: "Open",
  },
  {
    id: 2,
    type: "communication",
    title: "Phone Call",
    description: "Follow-up call regarding property viewing",
    date: "2024-01-18",
    status: "Completed",
  },
  {
    id: 3,
    type: "task",
    title: "Send Brochure",
    description: "Send property brochure via email",
    date: "2024-01-15",
    status: "Completed",
  },
]

export function ClientDetail({ client, onClose }: ClientDetailProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "inquiry":
        return <MessageSquare className="h-4 w-4" />
      case "communication":
        return <Phone className="h-4 w-4" />
      case "task":
        return <FileText className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Open: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Closed: "bg-gray-100 text-gray-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {client.firstName[0]}
              {client.lastName[0]}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h2>
            <p className="text-gray-600">Client since {client.createdAt}</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">Active</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-gray-600">{client.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Inquiries</span>
              <span className="font-semibold">{client.totalInquiries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inquiry Source</span>
              <Badge className="bg-blue-100 text-blue-800">{client.inquirySource}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Contact</span>
              <span className="text-sm">{client.lastContact}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full bg-transparent" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button className="w-full bg-transparent" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Make Call
            </Button>
            <Button className="w-full bg-transparent" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button className="w-full bg-transparent" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activities</CardTitle>
          <CardDescription>Latest interactions and activities for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <Badge className={getStatusBadge(activity.status)}>{activity.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {activity.date}
                    </p>
                  </div>
                </div>
                {index < mockActivities.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
