"use client"

import { useState } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MoreHorizontal, Edit, Eye, Trash2, User, Building, Calendar, AlertCircle } from "lucide-react"
import { InquiryForm } from "./inquiry-form"
import { InquiryDetail } from "./inquiry-detail"

// Mock data - in real app this would come from your database
const mockInquiries = [
  {
    id: 1,
    clientId: 1,
    clientName: "John Smith",
    clientEmail: "john.smith@email.com",
    propertyId: 1,
    propertyTitle: "Modern Downtown Apartment",
    inquiryDate: "2024-01-20",
    status: "New",
    followUpDate: "2024-01-22",
    assignedTo: "Sarah Wilson",
    assignedToId: 1,
    notes: "Client interested in viewing the property this weekend. Prefers morning appointments.",
    priority: "High",
    source: "Website",
  },
  {
    id: 2,
    clientId: 2,
    clientName: "Sarah Johnson",
    clientEmail: "sarah.johnson@email.com",
    propertyId: 2,
    propertyTitle: "Family House with Garden",
    inquiryDate: "2024-01-18",
    status: "Follow-Up",
    followUpDate: "2024-01-25",
    assignedTo: "Mike Davis",
    assignedToId: 2,
    notes: "Client has specific requirements for school district. Needs more information about local schools.",
    priority: "Medium",
    source: "Referral",
  },
  {
    id: 3,
    clientId: 3,
    clientName: "Michael Brown",
    clientEmail: "michael.brown@email.com",
    propertyId: 3,
    propertyTitle: "Studio Loft",
    inquiryDate: "2024-01-15",
    status: "Closed",
    followUpDate: null,
    assignedTo: "Sarah Wilson",
    assignedToId: 1,
    notes: "Client decided to rent the property. Lease agreement signed.",
    priority: "Low",
    source: "Social Media",
  },
  {
    id: 4,
    clientId: 4,
    clientName: "Emma Davis",
    clientEmail: "emma.davis@email.com",
    propertyId: 4,
    propertyTitle: "Luxury Penthouse",
    inquiryDate: "2024-01-19",
    status: "Follow-Up",
    followUpDate: "2024-01-21",
    assignedTo: "Mike Davis",
    assignedToId: 2,
    notes: "High-value client. Requires detailed financial information and property history.",
    priority: "High",
    source: "Website",
  },
]

const mockAgents = [
  { id: 1, name: "Sarah Wilson" },
  { id: 2, name: "Mike Davis" },
  { id: 3, name: "Lisa Chen" },
]

export function InquiryManagement() {
  const [inquiries, setInquiries] = useState(mockInquiries)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedInquiry, setSelectedInquiry] = useState<(typeof mockInquiries)[0] | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter
    const matchesPriority = priorityFilter === "all" || inquiry.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleAddInquiry = (inquiryData: any) => {
    const newInquiry = {
      id: Math.max(...inquiries.map((i) => i.id)) + 1,
      ...inquiryData,
      inquiryDate: new Date().toISOString().split("T")[0],
    }
    setInquiries([...inquiries, newInquiry])
    setIsAddDialogOpen(false)
  }

  const handleEditInquiry = (inquiryData: any) => {
    setInquiries(
      inquiries.map((inquiry) => (inquiry.id === selectedInquiry?.id ? { ...inquiry, ...inquiryData } : inquiry)),
    )
    setIsEditDialogOpen(false)
    setSelectedInquiry(null)
  }

  const handleDeleteInquiry = (inquiryId: number) => {
    setInquiries(inquiries.filter((inquiry) => inquiry.id !== inquiryId))
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      New: "bg-blue-100 text-blue-800",
      "Follow-Up": "bg-yellow-100 text-yellow-800",
      Closed: "bg-green-100 text-green-800",
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

  const isOverdue = (followUpDate: string | null, status: string) => {
    if (!followUpDate || status === "Closed") return false
    return new Date(followUpDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiry Management</h1>
          <p className="text-sm text-gray-600">Track and manage client inquiries and follow-ups</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Inquiry</DialogTitle>
              <DialogDescription>Enter the inquiry details below.</DialogDescription>
            </DialogHeader>
            <InquiryForm onSubmit={handleAddInquiry} onCancel={() => setIsAddDialogOpen(false)} agents={mockAgents} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.filter((i) => i.status === "New").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Follow-ups Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inquiries.filter((i) => isOverdue(i.followUpDate, i.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Closed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.filter((i) => i.status === "Closed").length}</div>
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
                placeholder="Search inquiries by client, property, or agent..."
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
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client & Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Follow-up Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.map((inquiry) => (
                <TableRow
                  key={inquiry.id}
                  className={isOverdue(inquiry.followUpDate, inquiry.status) ? "bg-red-50" : ""}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center">
                        {inquiry.clientName}
                        {isOverdue(inquiry.followUpDate, inquiry.status) && (
                          <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Building className="h-3 w-3 mr-1" />
                        {inquiry.propertyTitle}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Inquiry Date: {inquiry.inquiryDate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(inquiry.status)}>{inquiry.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadge(inquiry.priority)}>{inquiry.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <User className="h-3 w-3 mr-2 text-gray-400" />
                      {inquiry.assignedTo}
                    </div>
                  </TableCell>
                  <TableCell>
                    {inquiry.followUpDate ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                        <span
                          className={isOverdue(inquiry.followUpDate, inquiry.status) ? "text-red-600 font-medium" : ""}
                        >
                          {inquiry.followUpDate}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInquiry(inquiry)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInquiry(inquiry)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteInquiry(inquiry.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Inquiry</DialogTitle>
            <DialogDescription>Update the inquiry details below.</DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <InquiryForm
              initialData={selectedInquiry}
              onSubmit={handleEditInquiry}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedInquiry(null)
              }}
              agents={mockAgents}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <InquiryDetail
              inquiry={selectedInquiry}
              onClose={() => {
                setIsDetailDialogOpen(false)
                setSelectedInquiry(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
