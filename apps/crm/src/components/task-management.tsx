"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { TaskForm } from "./task-form"
import { TaskDetail } from "./task-detail"
import { authClient } from "@/lib/api/publicClient"
import { queryKeys } from "@/lib/api/queryKeys"
import { toast } from "sonner"

export function TaskManagement() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: queryKeys.tasks.list(`${searchTerm}-${statusFilter}-${priorityFilter}-${assigneeFilter}`),
    queryFn: () => authClient.get("/tasks"),
  })

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: () => authClient.get("/users"),
  })

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => authClient.post("/tasks", taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      setIsAddDialogOpen(false)
      toast.success("Task created successfully")
    },
    onError: () => {
      toast.error("Failed to create task")
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...taskData }: any) => authClient.put(`/tasks/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      setIsEditDialogOpen(false)
      setSelectedTask(null)
      toast.success("Task updated successfully")
    },
    onError: () => {
      toast.error("Failed to update task")
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => authClient.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      toast.success("Task deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete task")
    },
  })

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => authClient.put(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      toast.success("Task status updated")
    },
    onError: () => {
      toast.error("Failed to update task status")
    },
  })

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch =
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.clientName && task.clientName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === "all" || task.assignedToId.toString() === assigneeFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  const handleAddTask = (taskData: any) => {
    createTaskMutation.mutate(taskData)
  }

  const handleEditTask = (taskData: any) => {
    updateTaskMutation.mutate({ id: selectedTask?.id, ...taskData })
  }

  const handleDeleteTask = (taskId: number) => {
    deleteTaskMutation.mutate(taskId)
  }

  const handleToggleComplete = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed"
    toggleCompleteMutation.mutate({ id: taskId, status: newStatus })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Completed: "bg-green-100 text-green-800",
      Overdue: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      High: "bg-red-100 text-red-800",
      Medium: "bg-orange-100 text-orange-800",
      Low: "bg-gray-100 text-gray-800",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "Completed") return false
    return new Date(dueDate) < new Date()
  }

  const getTaskIcon = (status: string, isOverdue: boolean) => {
    if (status === "Completed") return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (isOverdue) return <AlertTriangle className="h-4 w-4 text-red-600" />
    return <Clock className="h-4 w-4 text-yellow-600" />
  }

  if (tasksLoading) {
    return <div>Loading tasks...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-sm text-gray-600">Organize and track your team's tasks and deadlines</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
            </DialogHeader>
            <TaskForm onSubmit={handleAddTask} onCancel={() => setIsAddDialogOpen(false)} users={users} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter((t: any) => t.status === "Pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter((t: any) => isOverdue(t.dueDate, t.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t: any) => t.status === "Completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks by description, assignee, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.map((task: any) => (
              <Card
                key={task.id}
                className={`hover:shadow-md transition-shadow ${
                  isOverdue(task.dueDate, task.status) ? "border-red-200 bg-red-50" : ""
                } ${task.status === "Completed" ? "opacity-75" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={task.status === "Completed"}
                        onCheckedChange={() => handleToggleComplete(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className={`text-sm font-medium ${
                                task.status === "Completed" ? "line-through text-gray-500" : "text-gray-900"
                              }`}
                            >
                              {task.description}
                            </h3>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignedTo}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Due: {task.dueDate}
                              </div>
                              {task.clientName && (
                                <div className="flex items-center">
                                  <span>Client: {task.clientName}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.estimatedHours}h
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {getTaskIcon(task.status, isOverdue(task.dueDate, task.status))}
                            <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                            <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                            <Badge variant="secondary">{task.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTask(task)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTask(task)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details below.</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              initialData={selectedTask}
              onSubmit={handleEditTask}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedTask(null)
              }}
              users={users}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskDetail
              task={selectedTask}
              onClose={() => {
                setIsDetailDialogOpen(false)
                setSelectedTask(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
