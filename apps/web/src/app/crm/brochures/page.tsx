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
import { Plus, Search, MoreHorizontal, Edit, Eye, Trash2, FileText, Calendar } from "lucide-react"
import { BrochureForm } from "@/components/crm/brochure-form"
import { toast } from "sonner"
import { format } from "date-fns"

// Fake data for brochures
const fakeBrochures = [
  {
    id: 1,
    type: "property",
    content: "Luxury waterfront property with stunning ocean views. 4 bedrooms, 3 bathrooms, modern kitchen.",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
    tenantId: 1
  },
  {
    id: 2,
    type: "company",
    content: "Premier real estate agency specializing in luxury properties and commercial investments.",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T16:20:00Z",
    tenantId: 1
  },
  {
    id: 3,
    type: "service",
    content: "Comprehensive property management services including maintenance, tenant screening, and rent collection.",
    createdAt: "2024-01-08T11:00:00Z",
    updatedAt: "2024-01-22T13:30:00Z",
    tenantId: 1
  },
  {
    id: 4,
    type: "marketing",
    content: "Spring 2024 property showcase featuring our newest listings and investment opportunities.",
    createdAt: "2024-01-05T08:45:00Z",
    updatedAt: "2024-01-25T10:15:00Z",
    tenantId: 1
  }
]

type Brochure = typeof fakeBrochures[0]

export default function BrochuresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBrochure, setSelectedBrochure] = useState<Brochure | null>(null)

  const [brochures, setBrochures] = useState(fakeBrochures)

  // Filter brochures based on search term
  const filteredBrochures = brochures.filter((brochure) =>
    brochure.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brochure.content?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    // In a real app, this would refetch data
    toast.success("Brochure created successfully")
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setSelectedBrochure(null)
    // In a real app, this would refetch data
    toast.success("Brochure updated successfully")
  }

  const handleEdit = (brochure: Brochure) => {
    setSelectedBrochure(brochure)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (brochure: Brochure) => {
    if (window.confirm("Are you sure you want to delete this brochure?")) {
      // Remove from fake data
      setBrochures(prev => prev.filter(b => b.id !== brochure.id))
      toast.success("Brochure deleted successfully")
    }
  }

  const getBrochureTypeBadgeColor = (type: string) => {
    switch (type) {
      case "property":
        return "bg-primary/10 text-primary"
      case "company":
        return "bg-primary/10 text-primary"
      case "service":
        return "bg-purple-100 text-purple-800"
      case "marketing":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-muted text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brochures</h1>
          <p className="text-muted-foreground">
            Manage and create brochures for your contacts and properties.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Brochure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Brochure</DialogTitle>
              <DialogDescription>
                Create a new brochure for your contacts or properties.
              </DialogDescription>
            </DialogHeader>
            <BrochureForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Brochures</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brochures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Content Preview</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrochures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "No brochures found matching your search." : "No brochures created yet."}
                      </p>
                      {!searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first brochure
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrochures.map((brochure) => (
                  <TableRow key={brochure.id}>
                    <TableCell>
                      <Badge className={getBrochureTypeBadgeColor(brochure.type)}>
                        {brochure.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">
                        {brochure.content || "No content"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(brochure.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(brochure.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(brochure)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(brochure)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Brochure</DialogTitle>
            <DialogDescription>
              Update the brochure information.
            </DialogDescription>
          </DialogHeader>
          {selectedBrochure && (
            <BrochureForm
              brochure={selectedBrochure}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedBrochure(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}