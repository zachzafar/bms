"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface TaskFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  users: Array<{ id: number; name: string }>
}

// Mock data for clients - in real app this would come from your database
const mockClients = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Sarah Johnson" },
  { id: 3, name: "Michael Brown" },
  { id: 4, name: "Emma Davis" },
]

const taskCategories = [
  "Follow-up",
  "Marketing",
  "Inspection",
  "Administrative",
  "Documentation",
  "Meeting",
  "Research",
  "Communication",
]

export function TaskForm({ initialData, onSubmit, onCancel, users }: TaskFormProps) {
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    dueDate: initialData?.dueDate || "",
    priority: initialData?.priority || "Medium",
    assignedToId: initialData?.assignedToId || "0", // Updated default value
    assignedTo: initialData?.assignedTo || "",
    clientId: initialData?.clientId || "0", // Updated default value
    clientName: initialData?.clientName || "",
    category: initialData?.category || "Administrative",
    estimatedHours: initialData?.estimatedHours || "1", // Updated default value
    status: initialData?.status || "Pending",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Find selected user and client details
    const selectedUser = users.find((u) => u.id === Number.parseInt(formData.assignedToId))
    const selectedClient = mockClients.find((c) => c.id === Number.parseInt(formData.clientId))

    onSubmit({
      ...formData,
      assignedToId: Number.parseInt(formData.assignedToId),
      clientId: formData.clientId ? Number.parseInt(formData.clientId) : null,
      estimatedHours: Number.parseFloat(formData.estimatedHours) || 1,
      assignedTo: selectedUser?.name || formData.assignedTo,
      clientName: selectedClient?.name || null,
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find((u) => u.id === Number.parseInt(userId))
    setFormData((prev) => ({
      ...prev,
      assignedToId: userId,
      assignedTo: selectedUser?.name || "",
    }))
  }

  const handleClientChange = (clientId: string) => {
    const selectedClient = mockClients.find((c) => c.id === Number.parseInt(clientId))
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selectedClient?.name || "",
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor="description">Task Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          placeholder="Describe what needs to be done..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleChange("dueDate", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            step="0.5"
            min="0.5"
            value={formData.estimatedHours}
            onChange={(e) => handleChange("estimatedHours", e.target.value)}
            placeholder="1.0"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {taskCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignedToId">Assign To</Label>
          <Select value={formData.assignedToId} onValueChange={handleUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId">Related Client (Optional)</Label>
          <Select value={formData.clientId} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No client</SelectItem> {/* Updated value prop */}
              {mockClients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {initialData && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update Task" : "Create Task"}</Button>
      </div>
    </form>
  )
}
