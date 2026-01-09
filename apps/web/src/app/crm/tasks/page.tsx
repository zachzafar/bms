'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  User as UserIcon,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

import { TaskForm } from '@/components/crm/task-form'
import { TaskDetail } from '@/components/crm/task-detail'

import { authClient } from '@/lib/api/publicClient'
import { TASKS_QUERY_KEY, USERS_QUERY_KEY } from '@/lib/api/queryKeys'
import { usePagination } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/data-table-pagination'



export default function TaskManagement() {
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10)
  const queryClient = authClient.useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Overdue'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Query params for server
  const serverQuery = useMemo(
    () => ({
      ...queryParams,
      status: statusFilter === 'all' ? undefined : statusFilter,
      userId: assigneeFilter === 'all' ? undefined : assigneeFilter,
    }),
    [statusFilter, assigneeFilter, queryParams]
  )

  const { data: tasksResp, isLoading: tasksLoading } = authClient.crm.tasks.listTasks.useQuery({
    queryKey: [...TASKS_QUERY_KEY, page, pageSize, serverQuery, searchTerm],
    queryData: { query: serverQuery },
  })

  const { data: usersResp } = authClient.users.getUsers.useQuery({ queryKey: USERS_QUERY_KEY })

  const users = useMemo(() => (usersResp?.status === 200 ? (usersResp.body.data ?? usersResp.body) : []), [usersResp])



  const tasks = useMemo(() => (tasksResp?.status === 200 ? (tasksResp.body.data ?? tasksResp.body) : []), [tasksResp])
  const paginationMeta = useMemo(() => (tasksResp?.status === 200 ? tasksResp.body.pagination : undefined), [tasksResp])



  const { mutate: deleteTask, isPending: isDeleting } = authClient.crm.tasks.deleteTask.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Task deleted successfully')
    },
    onError: (e) => toast.error(`Failed to delete task: ${e instanceof Error ? e.message : 'Unknown error'}`),
  })

  const { mutate: completeTask, isPending: isCompleting } = authClient.crm.tasks.completeTask.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Task status updated')
    },
    onError: (e) => toast.error(`Failed to update task status: ${e instanceof Error ? e.message : 'Unknown error'}`),
  })

  // Filters
  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return tasks.filter((task: any) => {
      const matchesSearch =
        !term ||
        task.description?.toLowerCase().includes(term) ||
        task.assignedTo?.toLowerCase().includes(term) ||
        (task.clientName && task.clientName.toLowerCase().includes(term))

      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      return matchesSearch && matchesPriority
    })
  }, [tasks, priorityFilter, searchTerm])

  // Handlers
  const handleDeleteTask = useCallback((id: number) => deleteTask({ params: { id: id }, body: {} }), [deleteTask])
  const handleToggleComplete = useCallback((id: number) => completeTask({ params: { id: id }, body: {} }), [completeTask])

  const getStatusBadge = (status: string) => ({ Pending: 'bg-yellow-100 text-yellow-800', Completed: 'bg-green-100 text-green-800', Overdue: 'bg-red-100 text-red-800' }[status] ?? 'bg-gray-100 text-gray-800')
  const getPriorityBadge = (priority: string) => ({ High: 'bg-red-100 text-red-800', Medium: 'bg-orange-100 text-orange-800', Low: 'bg-gray-100 text-gray-800' }[priority] ?? 'bg-gray-100 text-gray-800')
  const isOverdue = (due: string, status: string) => status !== 'Completed' && new Date(due) < new Date()
  const getTaskIcon = (status: string, overdue: boolean) => status === 'Completed' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : overdue ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-yellow-600" />

  if (tasksLoading) return <div>Loading tasks…</div>

  return (
    <div className="space-y-6">
     {/* <div className="space-y-6"> */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-sm text-muted-foreground">Organize and track your team's tasks and deadlines</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button >
              <Plus className="mr-2 h-4 w-4" />
                Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
            </DialogHeader>
            <TaskForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.filter((t: any) => t.status === 'Pending').length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{tasks.filter((t: any) => isOverdue(t.dueDate, t.status)).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{tasks.filter((t: any) => t.status === 'Completed').length}</div></CardContent></Card>
      </div>

      {/* Filters + List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search tasks by description, assignee, or client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}><SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
              <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v as any)}><SelectTrigger className="w-32"><SelectValue placeholder="Assignee" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem>{users.map((u: any) => (<SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>))}</SelectContent></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.map((task: any) => (
              <Card key={task.id} className={`transition-shadow hover:shadow-md ${isOverdue(task.dueDate, task.status) ? 'border-red-200 bg-red-50' : ''} ${task.status === 'Completed' ? 'opacity-75' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-start space-x-3">
                      <Checkbox checked={task.status === 'Completed'} onCheckedChange={() => handleToggleComplete(task.id)} className="mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.description}</h3>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center"><UserIcon className="mr-1 h-3 w-3" />{task.assignedTo}</div>
                              <div className="flex items-center"><Calendar className="mr-1 h-3 w-3" />Due: {task.dueDate}</div>
                              {task.clientName && (<div>Client: {task.clientName}</div>)}
                              <div className="flex items-center"><Clock className="mr-1 h-3 w-3" />{task.estimatedHours}h</div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            {getTaskIcon(task.status, isOverdue(task.dueDate, task.status))}
                            <Badge className={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                            <Badge className={getStatusBadge(task.status)}>{task.status}</Badge>
                            <Badge variant="secondary">{task.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="ml-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedTask(task); setIsDetailDialogOpen(true) }}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedTask(task); setIsEditDialogOpen(true) }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600" disabled={isDeleting}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {paginationMeta && (
        <DataTablePagination
          pagination={paginationMeta}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details below.</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskForm initialData={selectedTask} />
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
            <TaskDetail task={selectedTask} onClose={() => { setIsDetailDialogOpen(false); setSelectedTask(null) }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
