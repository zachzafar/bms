"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, User, Building, Calendar, Clock, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"

interface InquiryDetailProps {
  inquiry: any
}

// Mock data for inquiry timeline
const mockTimeline = [
  {
    id: 1,
    type: "created",
    title: "Inquiry Created",
    description: "New inquiry received from client",
    date: "2024-01-20",
    time: "10:30 AM",
    user: "System",
  },
  {
    id: 2,
    type: "assigned",
    title: "Assigned to Agent",
    description: "Inquiry assigned to Sarah Wilson",
    date: "2024-01-20",
    time: "11:00 AM",
    user: "Admin",
  },
  {
    id: 3,
    type: "contact",
    title: "Client Contacted",
    description: "Initial phone call made to client",
    date: "2024-01-20",
    time: "2:15 PM",
    user: "Sarah Wilson",
  },
  {
    id: 4,
    type: "followup",
    title: "Follow-up Scheduled",
    description: "Follow-up call scheduled for January 22nd",
    date: "2024-01-20",
    time: "2:30 PM",
    user: "Sarah Wilson",
  },
]

export function InquiryDetail({ inquiry }: InquiryDetailProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      New: "bg-primary/20 text-primary",
      "Follow-Up": "bg-yellow-100 text-yellow-800",
      Closed: "bg-green-500/10 text-green-600",
    }
    return colors[status as keyof typeof colors] || "bg-muted text-foreground"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      High: "bg-destructive/10 text-destructive",
      Medium: "bg-orange-100 text-orange-800",
      Low: "bg-muted text-foreground",
    }
    return colors[priority as keyof typeof colors] || "bg-muted text-foreground"
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "created":
        return <MessageSquare className="h-4 w-4" />
      case "assigned":
        return <User className="h-4 w-4" />
      case "contact":
        return <Phone className="h-4 w-4" />
      case "followup":
        return <Calendar className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const isOverdue = (followUpDate: string | null, status: string) => {
    if (!followUpDate || status === "Closed") return false
    return new Date(followUpDate) < new Date()
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Inquiry Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inquiry #{inquiry.id}</h2>
          <p className="text-muted-foreground mt-1">Created on {inquiry.inquiryDate}</p>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusBadge(inquiry.status)}>{inquiry.status}</Badge>
          <Badge className={getPriorityBadge(inquiry.priority)}>{inquiry.priority}</Badge>
          {isOverdue(inquiry.followUpDate, inquiry.status) && (
            <Badge className="bg-destructive/10 text-destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client & Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Client Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {inquiry.clientName}
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {inquiry.clientEmail}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Property Details</h4>
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    {inquiry.propertyTitle}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-foreground mb-2">Inquiry Source</h4>
                <Badge variant="secondary">{inquiry.source}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes & Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{inquiry.notes}</p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
              <CardDescription>Track of all activities related to this inquiry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeline.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">{getTimelineIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{activity.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {activity.date} at {activity.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">by {activity.user}</p>
                      </div>
                    </div>
                    {index < mockTimeline.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-sm text-muted-foreground">{inquiry.assignedTo}</p>
                </div>
              </div>
              {inquiry.followUpDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Follow-up Date</p>
                    <p
                      className={`text-sm ${isOverdue(inquiry.followUpDate, inquiry.status) ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {inquiry.followUpDate}
                    </p>
                  </div>
                </div>
              )}
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
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Closed
              </Button>
            </CardContent>
          </Card>

          {/* Inquiry Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inquiry Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Days Open</span>
                <span className="font-semibold">
                  {Math.ceil((new Date().getTime() - new Date(inquiry.inquiryDate).getTime()) / (1000 * 3600 * 24))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contacts Made</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="font-semibold">30 min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
