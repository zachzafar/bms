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
import  InquiryForm  from "@/components/crm/inquiry-form"
import { InquiryDetail } from "@/components/crm/inquiry-detail"
import { authClient } from "@/lib/api/publicClient"
import { INQUIRIES_QUERY_KEY } from "@/lib/api/queryKeys"
import { toast } from "sonner"
import { ExtendedSelectInquirySchema } from "@repo/api-contract"
import { InquiryFormInputs } from "@/lib/schemas"

type Inquiry = typeof ExtendedSelectInquirySchema._type

export default function InquiryManagement() {
  const { data: inquiriesData, refetch } = authClient.crm.inquiries.listInquiries.useQuery({
    queryKey: INQUIRIES_QUERY_KEY,
  })
  const { mutate: createInquiry } = authClient.crm.inquiries.createInquiry.useMutation()
  const { mutate: updateInquiry } = authClient.crm.inquiries.updateInquiry.useMutation()
  const { mutate: deleteInquiry } = authClient.crm.inquiries.deleteInquiry.useMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const inquiries = inquiriesData?.body || []

  const filteredInquiries = inquiries.filter((inquiry: Inquiry) => {
    const matchesSearch =
      inquiry.contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contact.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddInquiry = (inquiryData: InquiryFormInputs) => {
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

  const handleEditInquiry = (inquiryData: InquiryFormInputs) => {
    if (!selectedInquiry) return
    updateInquiry(
      {
        params: { id: selectedInquiry.id },
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
    deleteInquiry(
      { params: { id: inquiryId },
        body: {},
      },
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

  const getStatusBadge = (status: string) => {
    const variants = {
      "New": "default",
      "Follow-Up": "secondary",
      "Closed": "outline",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  const getStatusCount = (status: string) => {
    return inquiries.filter(inquiry => inquiry.status === status).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiry Management</h1>
          <p className="text-muted-foreground">
            Track and manage property inquiries from potential clients
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Inquiry</DialogTitle>
              <DialogDescription>
                Create a new inquiry record for a client interested in a property
              </DialogDescription>
            </DialogHeader>
            <InquiryForm onSubmit={handleAddInquiry} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("New")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-Up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("Follow-Up")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("Closed")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries by client, property, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Inquiry Date</TableHead>
                <TableHead>Follow-Up</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {inquiry.contact.firstName} {inquiry.contact.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {inquiry.contact.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{inquiry.asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{inquiry.assignee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(inquiry.inquiryDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {inquiry.followUpDate ? (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(inquiry.followUpDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
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
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInquiry(inquiry)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteInquiry(inquiry.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
            <DialogDescription>
              Update the inquiry information
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <InquiryForm 
              onSubmit={handleEditInquiry} 
              initialData={selectedInquiry}
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
            <InquiryDetail inquiry={selectedInquiry} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
