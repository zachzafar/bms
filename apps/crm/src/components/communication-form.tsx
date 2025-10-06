"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { SelectContactType } from "@repo/api-contract"

interface CommunicationFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  users: Array<SelectContactType>
}

// Mock data for clients - in real app this would come from your database
const mockClients = [
  { id: 1, name: "John Smith", email: "john.smith@email.com" },
  { id: 2, name: "Sarah Johnson", email: "sarah.johnson@email.com" },
  { id: 3, name: "Michael Brown", email: "michael.brown@email.com" },
  { id: 4, name: "Emma Davis", email: "emma.davis@email.com" },
]

const predefinedTags = [
  "Property Viewing",
  "Follow-up Required",
  "Property Information",
  "Documentation",
  "Contract Signing",
  "Lease Agreement",
  "Initial Consultation",
  "High Value Client",
  "Property Photos",
  "Negotiation",
  "Pricing Discussion",
  "Maintenance Request",
]

export function CommunicationForm({ initialData, onSubmit, onCancel, users }: CommunicationFormProps) {
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || "",
    clientName: initialData?.clientName || "",
    clientEmail: initialData?.clientEmail || "",
    userId: initialData?.userId || "",
    userName: initialData?.userName || "",
    type: initialData?.type || "Phone Call",
    summary: initialData?.summary || "",
    duration: initialData?.duration || "",
    outcome: initialData?.outcome || "Neutral",
    followUpRequired: initialData?.followUpRequired || false,
    followUpDate: initialData?.followUpDate || "",
    tags: initialData?.tags || [],
  })

  const [newTag, setNewTag] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Find selected client and user details
    const selectedClient = mockClients.find((c) => c.id === Number.parseInt(formData.clientId))
    const selectedUser = users.find((u) => u.id === Number.parseInt(formData.userId))

    onSubmit({
      ...formData,
      clientId: Number.parseInt(formData.clientId),
      userId: Number.parseInt(formData.userId),
      duration: formData.duration ? Number.parseInt(formData.duration) : null,
      clientName: selectedClient?.name || formData.clientName,
      clientEmail: selectedClient?.email || formData.clientEmail,
      userName: selectedUser?.firstName + " " + selectedUser?.lastName || formData.userName,
    })
  }

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClientChange = (clientId: string) => {
    const selectedClient = mockClients.find((c) => c.id === Number.parseInt(clientId))
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selectedClient?.name || "",
      clientEmail: selectedClient?.email || "",
    }))
  }

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find((u) => u.id === Number.parseInt(userId))
    setFormData((prev) => ({
      ...prev,
      userId,
      userName: selectedUser?.firstName + " " + selectedUser?.lastName || "",
    }))
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleChange("tags", [...formData.tags, tag])
    }
    setNewTag("")
  }

  const removeTag = (tagToRemove: string) => {
    handleChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          <Select value={formData.clientId} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {mockClients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId">User</Label>
          <Select value={formData.userId} onValueChange={handleUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.firstName + " " + user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Communication Type</Label>
          <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Phone Call">Phone Call</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Text Message">Text Message</SelectItem>
              <SelectItem value="Video Call">Video Call</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="Optional for calls/meetings"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => handleChange("summary", e.target.value)}
          rows={4}
          placeholder="Describe the communication details, key points discussed, and any outcomes..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outcome">Outcome</Label>
        <Select value={formData.outcome} onValueChange={(value) => handleChange("outcome", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Neutral">Neutral</SelectItem>
            <SelectItem value="Negative">Negative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="followUpRequired"
            checked={formData.followUpRequired}
            onCheckedChange={(checked) => handleChange("followUpRequired", checked as boolean)}
          />
          <Label htmlFor="followUpRequired">Follow-up required</Label>
        </div>

        {formData.followUpRequired && (
          <div className="space-y-2">
            <Label htmlFor="followUpDate">Follow-up Date</Label>
            <Input
              id="followUpDate"
              type="date"
              value={formData.followUpDate}
              onChange={(e) => handleChange("followUpDate", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag(newTag)
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => addTag(newTag)}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {predefinedTags
            .filter((tag) => !formData.tags.includes(tag))
            .map((tag) => (
              <Button
                key={tag}
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => addTag(tag)}
              >
                + {tag}
              </Button>
            ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update Communication" : "Log Communication"}</Button>
      </div>
    </form>
  )
}
