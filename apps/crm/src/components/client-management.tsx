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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MoreHorizontal, Edit, Eye, Trash2, Phone, Mail, MapPin } from "lucide-react"
import { ClientForm } from "./client-form"
import { ClientDetail } from "./client-detail"
import { authClient } from "@/lib/api/publicClient"
import { CLIENT_QUERY_KEY } from "@/lib/api/queryKeys"
import { toast } from "sonner"

const mockClients = [
  {
    id: 1,
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, New York, NY 10001",
    inquirySource: "Website",
    totalInquiries: 3,
    lastContact: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 234-5678",
    address: "456 Oak Ave, Los Angeles, CA 90210",
    inquirySource: "Referral",
    totalInquiries: 1,
    lastContact: "2024-01-14T14:20:00Z",
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: 3,
    firstName: "Mike",
    lastName: "Chen",
    email: "mike.chen@email.com",
    phone: "+1 (555) 345-6789",
    address: "789 Pine St, Chicago, IL 60601",
    inquirySource: "Social Media",
    totalInquiries: 2,
    lastContact: "2024-01-13T09:15:00Z",
    createdAt: "2024-01-10T00:00:00Z",
  },
]

const mockStats = {
  total: 156,
  newThisMonth: 23,
  activeInquiries: 45,
  conversionRate: 18,
}

export function ClientManagement() {
  const { data: clientsData, refetch } = authClient.clients.getClients.useQuery({
    queryKey: CLIENT_QUERY_KEY,
  })
  const { data: statsData } = authClient.clients.getClientStats.useQuery({
    queryKey: [...CLIENT_QUERY_KEY, "stats"],
  })
  const { mutate: createClient } = authClient.clients.createClient.useMutation()
  const { mutate: updateClient } = authClient.clients.updateClient.useMutation()
  const { mutate: deleteClient } = authClient.clients.deleteClient.useMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const clients = clientsData?.body || mockClients
  const stats = statsData?.body || mockStats

  const filteredClients = clients.filter(
    (client: any) =>
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm),
  )

  const handleAddClient = (clientData: any) => {
    createClient(
      { body: clientData },
      {
        onSuccess: () => {
          toast.success("Client added successfully")
          refetch()
          setIsAddDialogOpen(false)
        },
        onError: () => {
          toast.error("Failed to add client")
        },
      },
    )
  }

  const handleEditClient = (clientData: any) => {
    if (!selectedClient) return
    updateClient(
      {
        params: { id: selectedClient.id.toString() },
        body: clientData,
      },
      {
        onSuccess: () => {
          toast.success("Client updated successfully")
          refetch()
          setIsEditDialogOpen(false)
          setSelectedClient(null)
        },
        onError: () => {
          toast.error("Failed to update client")
        },
      },
    )
  }

  const handleDeleteClient = (clientId: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClient(
        { params: { id: clientId.toString() } },
        {
          onSuccess: () => {
            toast.success("Client deleted successfully")
            refetch()
          },
          onError: () => {
            toast.error("Failed to delete client")
          },
        },
      )
    }
  }

  const getInquirySourceBadge = (source: string) => {
    const colors = {
      Website: "bg-blue-100 text-blue-800",
      Referral: "bg-green-100 text-green-800",
      "Social Media": "bg-purple-100 text-purple-800",
      "Walk-in": "bg-orange-100 text-orange-800",
    }
    return colors[source as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-sm text-gray-600">Manage your client database and relationships</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Enter the client's information below.</DialogDescription>
            </DialogHeader>
            <ClientForm onSubmit={handleAddClient} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInquiries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Inquiries</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {client.address?.split(",")[1]?.trim() || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-gray-400" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-gray-400" />
                        {client.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getInquirySourceBadge(client.inquirySource)}>{client.inquirySource}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{client.totalInquiries || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {client.lastContact ? new Date(client.lastContact).toLocaleDateString() : "N/A"}
                    </span>
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
                            setSelectedClient(client)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-red-600">
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
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the client's information below.</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <ClientForm
              initialData={selectedClient}
              onSubmit={handleEditClient}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedClient(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ClientDetail
              client={selectedClient}
              onClose={() => {
                setIsDetailDialogOpen(false)
                setSelectedClient(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
