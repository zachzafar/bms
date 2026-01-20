"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, Clock, AlertTriangle, CheckCircle2, FileText, MessageSquare } from "lucide-react"

interface TaskDetailProps {
  task: any
  onClose: () => void
}

// Mock data for task activity
const mockActivity = [
  {
    id: 1,
    type: "created",
    title: "Task Created",
    description: "Task was created and assigned",
    date: "2024-01-20",
    time: "10:30 AM",
    user: "Admin",
  },
  {
    id: 2,
    type: "comment",
    title: "Comment Added",
    description: "Client confirmed availability for weekend viewing",
    date: "2024-01-20",
    time: "2:15 PM",
    user: "Sarah Wilson",
  },
  {
    id: 3,
    type: "update",
    title: "Priority Updated",
    description: "Priority changed from Medium to High",
    date: "2024-01-21",
    time: "9:00 AM",
    user: "Sarah Wilson",
  },
]

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Completed: "bg-green-500/10 text-green-600",
      Overdue: "bg-destructive/10 text-destructive",
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

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "Completed") return false
    return new Date(dueDate) < new Date()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return <FileText className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "update":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getDaysRemaining = (dueDate: string, status: string) => {
    if (status === "Completed") return null
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining(task.dueDate, task.status)

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Task Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Task #{task.id}</h2>
          <p className="text-muted-foreground mt-1">{task.description}</p>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
          <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
          <Badge variant="secondary">{task.category}</Badge>
          {isOverdue(task.dueDate, task.status) && (
            <Badge className="bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Assignment</h4>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {task.assignedTo}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Due Date</h4>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className={isOverdue(task.dueDate, task.status) ? "text-destructive font-medium" : ""}>
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Estimated Time</h4>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {task.estimatedHours} hours
                  </div>
                </div>
                {task.clientName && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Related Client</h4>
                    <div className="text-sm">{task.clientName}</div>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-foreground mb-2">Created</h4>
                <div className="text-sm text-muted-foreground">{task.createdAt}</div>
              </div>
              {task.completedAt && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Completed</h4>
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {task.completedAt}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
              <CardDescription>Track of all activities related to this task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivity.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
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
                    {index < mockActivity.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysRemaining !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days Remaining</span>
                  <span
                    className={`font-semibold ${
                      daysRemaining < 0 ? "text-destructive" : daysRemaining <= 1 ? "text-orange-500" : "text-green-600"
                    }`}
                  >
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : `${daysRemaining} days`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Hours</span>
                <span className="font-semibold">{task.estimatedHours}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time Logged</span>
                <span className="font-semibold">0h</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.status !== "Completed" ? (
                <Button className="w-full bg-transparent" variant="outline">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              ) : (
                <Button className="w-full bg-transparent" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Reopen Task
                </Button>
              )}
              <Button className="w-full bg-transparent" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            </CardContent>
          </Card>

          {/* Task Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Days Open</span>
                <span className="font-semibold">
                  {Math.ceil((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comments</span>
                <span className="font-semibold">{mockActivity.filter((a) => a.type === "comment").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Updates</span>
                <span className="font-semibold">{mockActivity.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
