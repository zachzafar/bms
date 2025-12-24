"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/api/publicClient'
import { CONTACTS_QUERY_KEY, USERS_QUERY_KEY, TASKS_QUERY_KEY } from '@/lib/api/queryKeys'
import { InsertTask, InsertTaskSchema } from '@/lib/api-contract'

interface TaskFormProps {
  taskId?: number
  initialData?: Partial<InsertTask>
  onSuccess?: () => void
}

const categoryOptions = ['Follow-up','Marketing','Inspection','Administrative','Documentation','Meeting','Research','Communication']

const priorityOptions = ['Low', 'Medium', 'High']

const statusOptions = ['Pending','Completed',"Overdue"]


export function TaskForm({ taskId, initialData, onSuccess }: TaskFormProps) {
  const queryClient = authClient.useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InsertTask>({
    resolver: zodResolver(InsertTaskSchema),
    defaultValues: {
      userId: initialData?.userId || '',
      contactId: initialData?.contactId || undefined,
      description: initialData?.description || '',
      dueDate: initialData?.dueDate || new Date(),
      category: initialData?.category || 'Follow-up',
      priority: initialData?.priority || 'Medium',
      status: initialData?.status || 'Pending',
    },
  })

  // Fetch contacts and users
  const { data: contactsResp, isLoading: contactsLoading } = authClient.crm.contacts.listContacts.useQuery({
    queryKey: CONTACTS_QUERY_KEY,
  })

  const { data: usersResp, isLoading: usersLoading } = authClient.users.getUsers.useQuery({
    queryKey: USERS_QUERY_KEY,
  })

  const contacts = contactsResp?.status === 200 ? contactsResp.body : []
  const users = usersResp?.status === 200 ? usersResp.body : []


  // Create task mutation
  const createTaskMutation = authClient.crm.tasks.createTask.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Task created successfully')
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    },
  })

  // Update task mutation
  const updateTaskMutation = authClient.crm.tasks.updateTask.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Task updated successfully')
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    },
  })

  const onSubmit = async (data: InsertTask) => {
    setIsSubmitting(true)
    try {
      if (taskId) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          params: { id: taskId.toString() },
          body: {
            ...data,
            dueDate: data.dueDate.toISOString(),
          },
        })
      } else {
        // Create new task
        await createTaskMutation.mutateAsync({
          body: {
            ...data,
            dueDate: data.dueDate.toISOString(),
          },
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter task description..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ? field.value : categoryOptions[0]}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading users...
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Contact (Optional)</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contactsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading contacts...
                      </SelectItem>
                    ) : (
                      contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {taskId && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting || contactsLoading || usersLoading}
          >
            {isSubmitting ? 'Saving...' : taskId ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
