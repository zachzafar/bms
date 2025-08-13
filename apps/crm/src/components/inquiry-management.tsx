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
import { authClient } from "@/lib/api/publicClient"
import { INQUIRY_QUERY_KEY, USER_QUERY_KEY } from "@/lib/api/queryKeys"
import { toast } from "sonner"

export function InquiryManagement() {
  const { data: inquiriesData, refetch } = authClient.inquiries.getInquiries.useQuery({
    queryKey: INQUIRY_QUERY_KEY,
  })
  const { data: statsData } = authClient.inquiries.getInquiryStats.useQuery({
    queryKey: [...INQUIRY_QUERY_KEY, "stats"],
  })
  const { data: agentsData } = authClient.users.getAgents.useQuery({
    queryKey: USER_QUERY_KEY,
  })
  const { mutate: createInquiry } = authClient.inquiries.createInquiry.useMutation()
  const { mutate: updateInquiry } = authClient.inquiries.updateInquiry.useMutation()
  const { mutate: deleteInquiry } = authClient.inquiries.deleteInquiry.useMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const inquiries = inquiriesData?.body || []
  const stats = statsData?.body || { total: 0, new: 0, followUpsDue: 0, closedThisMonth: 0 }
  const agents = agentsData?.body || []

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch =
      inquiry.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter
    const matchesPriority = priorityFilter === "all" || inquiry.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleAddInquiry = (inquiryData: any) => {
    createInquiry(
      { body: inquiryData },
      {
        onSuccess: () => {
          toast.success("Inquiry added successfully")
          refetch()
          setIsAddDialogOpen(false)
        },
        onError: () => {
          toast.error("Failed to add inquiry")
        },
      },
    )
  }

  const handleEditInquiry = (inquiryData: any) => {
    if (!selectedInquiry) return
    updateInquiry(
      {
        params: { id: selectedInquiry.id.toString() },
        body: inquiryData,
      },
      {
        onSuccess: () => {
          toast.success("Inquiry updated successfully")
          refetch()
          setIsEditDialogOpen(false)
          setSelectedInquiry(null)
        },
        onError: () => {
          toast.error("Failed to update inquiry")
        },
      },
    )
  }

  const handleDeleteInquiry = (inquiryId: number) => {
    if (confirm("Are you sure you want to delete this inquiry?")) {
      deleteInquiry(
        { params: { id: inquiryId.toString() } },
        {
          onSuccess: () => {
            toast.success("Inquiry deleted successfully")
            refetch()
          },
          onError: () => {
            toast.error("Failed to delete inquiry")
          },
        },
      )
    }
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
            <InquiryForm onSubmit={handleAddInquiry} onCancel={() => setIsAddDialogOpen(false)} agents={agents} />
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
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Follow-ups Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followUpsDue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Closed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedThisMonth}</div>
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
              {filteredInquiries.map((inquiry: any) => (
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
                      <div className="text-xs text-gray-400 mt-1">
                        Inquiry Date: {inquiry.inquiryDate ? new Date(inquiry.inquiryDate).toLocaleDateString() : "N/A"}
                      </div>
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
                          {new Date(inquiry.followUpDate).toLocaleDateString()}
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
              agents={agents}
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
