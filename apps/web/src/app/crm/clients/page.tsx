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
import { ClientForm } from "@/components/crm/client-form"
import { ClientDetail } from "@/components/crm/client-detail"
import { authClient } from "@/lib/api/publicClient"
import { CONTACTS_QUERY_KEY } from "@/lib/api/queryKeys"
import { toast } from "sonner"
import { ExtendedSelectContactSchema } from "@repo/api-contract"
import { ContactFormInputs } from "@/lib/schemas"
import { usePagination } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

type Contact = typeof ExtendedSelectContactSchema._type

export default function ClientManagement() {
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10)
  const { data: clientsData, refetch } = authClient.crm.contacts.listContacts.useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, page, pageSize],
    queryData: {query: queryParams},
  })
  const { mutate: createClient } = authClient.crm.contacts.createContact.useMutation()
  const { mutate: updateClient } = authClient.crm.contacts.updateContact.useMutation()
  const { mutate: deleteClient } = authClient.crm.contacts.deleteContact.useMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const clients = clientsData?.status === 200 ? clientsData.body.data : []
  const paginationMeta = clientsData?.status === 200 ? clientsData.body.pagination : undefined

  const filteredClients = clients.filter(
    (client: Contact) =>
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm)),
  )

  const handleAddClient = (clientData: ContactFormInputs) => {
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

  const handleEditClient = (clientData: ContactFormInputs) => {
    if (!selectedClient) return
    updateClient(
      {
        params: { id: selectedClient.id },
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
    deleteClient(
      { params: { id: clientId },
        body: {},
      },
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

  const getStatusBadge = (client: Contact) => {
    if (client.customerProfile) {
      return <Badge variant="default">Customer</Badge>
    }
    if (client.ownerProfile) {
      return <Badge variant="secondary">Owner</Badge>
    }
    return <Badge variant="outline">Lead</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage your contacts, customers, and property owners
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new contact record for your CRM system
              </DialogDescription>
            </DialogHeader>
            <ClientForm onSubmit={handleAddClient} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.customerProfile).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.ownerProfile).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => !c.customerProfile && !c.ownerProfile).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.firstName} {client.lastName}
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone || "—"}</TableCell>
                  <TableCell>{client.source}</TableCell>
                  <TableCell>{getStatusBadge(client)}</TableCell>
                  <TableCell>
                    {new Date(client.createdAt).toLocaleDateString()}
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
                            setSelectedClient(client)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClient(client.id)}
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
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <ClientForm 
              onSubmit={handleEditClient} 
              initialData={selectedClient}
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
            <ClientDetail client={selectedClient} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
