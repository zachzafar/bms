"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface InquiryFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  agents: Array<{ id: number; name: string }>
}

// Mock data for clients and properties - in real app this would come from your database
const mockClients = [
  { id: 1, name: "John Smith", email: "john.smith@email.com" },
  { id: 2, name: "Sarah Johnson", email: "sarah.johnson@email.com" },
  { id: 3, name: "Michael Brown", email: "michael.brown@email.com" },
  { id: 4, name: "Emma Davis", email: "emma.davis@email.com" },
]

const mockProperties = [
  { id: 1, title: "Modern Downtown Apartment" },
  { id: 2, title: "Family House with Garden" },
  { id: 3, title: "Studio Loft" },
  { id: 4, title: "Luxury Penthouse" },
]

export function InquiryForm({ initialData, onSubmit, onCancel, agents }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || "",
    clientName: initialData?.clientName || "",
    clientEmail: initialData?.clientEmail || "",
    propertyId: initialData?.propertyId || "",
    propertyTitle: initialData?.propertyTitle || "",
    status: initialData?.status || "New",
    priority: initialData?.priority || "Medium",
    followUpDate: initialData?.followUpDate || "",
    assignedToId: initialData?.assignedToId || "",
    assignedTo: initialData?.assignedTo || "",
    notes: initialData?.notes || "",
    source: initialData?.source || "Website",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Find selected client and property details
    const selectedClient = mockClients.find((c) => c.id === Number.parseInt(formData.clientId))
    const selectedProperty = mockProperties.find((p) => p.id === Number.parseInt(formData.propertyId))
    const selectedAgent = agents.find((a) => a.id === Number.parseInt(formData.assignedToId))

    onSubmit({
      ...formData,
      clientId: Number.parseInt(formData.clientId),
      propertyId: Number.parseInt(formData.propertyId),
      assignedToId: Number.parseInt(formData.assignedToId),
      clientName: selectedClient?.name || formData.clientName,
      clientEmail: selectedClient?.email || formData.clientEmail,
      propertyTitle: selectedProperty?.title || formData.propertyTitle,
      assignedTo: selectedAgent?.name || formData.assignedTo,
    })
  }

  const handleChange = (field: string, value: string) => {
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

  const handlePropertyChange = (propertyId: string) => {
    const selectedProperty = mockProperties.find((p) => p.id === Number.parseInt(propertyId))
    setFormData((prev) => ({
      ...prev,
      propertyId,
      propertyTitle: selectedProperty?.title || "",
    }))
  }

  const handleAgentChange = (agentId: string) => {
    const selectedAgent = agents.find((a) => a.id === Number.parseInt(agentId))
    setFormData((prev) => ({
      ...prev,
      assignedToId: agentId,
      assignedTo: selectedAgent?.name || "",
    }))
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
          <Label htmlFor="propertyId">Property</Label>
          <Select value={formData.propertyId} onValueChange={handlePropertyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {mockProperties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Follow-Up">Follow-Up</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignedToId">Assigned To</Label>
          <Select value={formData.assignedToId} onValueChange={handleAgentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="followUpDate">Follow-up Date</Label>
          <Input
            id="followUpDate"
            type="date"
            value={formData.followUpDate}
            onChange={(e) => handleChange("followUpDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Inquiry Source</Label>
        <Select value={formData.source} onValueChange={(value) => handleChange("source", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Social Media">Social Media</SelectItem>
            <SelectItem value="Walk-in">Walk-in</SelectItem>
            <SelectItem value="Advertisement">Advertisement</SelectItem>
            <SelectItem value="Phone Call">Phone Call</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={4}
          placeholder="Add any additional notes or comments about this inquiry..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update Inquiry" : "Add Inquiry"}</Button>
      </div>
    </form>
  )
}
