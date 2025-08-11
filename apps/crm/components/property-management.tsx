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
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Grid,
  List,
  MapPin,
  Bed,
  Bath,
  DollarSign,
} from "lucide-react"
import { PropertyForm } from "./property-form"
import { PropertyDetail } from "./property-detail"
import { PropertyCard } from "./property-card"

// Mock data - in real app this would come from your database
const mockProperties = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    description: "Luxurious 2-bedroom apartment in the heart of downtown with stunning city views.",
    type: "Rental",
    location: "Downtown, New York, NY",
    price: 3500,
    bedrooms: 2,
    bathrooms: 2,
    createdAt: "2024-01-15",
    status: "Available",
    images: ["/modern-apartment-living.png"],
    features: ["Parking", "Gym", "Pool", "Balcony"],
  },
  {
    id: 2,
    title: "Family House with Garden",
    description: "Spacious 4-bedroom house perfect for families, featuring a large garden and garage.",
    type: "Sale",
    location: "Suburbs, Los Angeles, CA",
    price: 750000,
    bedrooms: 4,
    bathrooms: 3,
    createdAt: "2024-01-10",
    status: "Available",
    images: ["/family-house-garden.png"],
    features: ["Garden", "Garage", "Fireplace", "Storage"],
  },
  {
    id: 3,
    title: "Studio Loft",
    description: "Cozy studio loft in trendy neighborhood, perfect for young professionals.",
    type: "Rental",
    location: "Brooklyn, New York, NY",
    price: 2200,
    bedrooms: 1,
    bathrooms: 1,
    createdAt: "2024-01-05",
    status: "Rented",
    images: ["/studio-loft.png"],
    features: ["High Ceilings", "Exposed Brick", "Hardwood Floors"],
  },
  {
    id: 4,
    title: "Luxury Penthouse",
    description: "Exclusive penthouse with panoramic views and premium amenities.",
    type: "Sale",
    location: "Manhattan, New York, NY",
    price: 2500000,
    bedrooms: 3,
    bathrooms: 3,
    createdAt: "2024-01-12",
    status: "Available",
    images: ["/luxury-penthouse.png"],
    features: ["Terrace", "Concierge", "Gym", "Parking", "City Views"],
  },
]

export function PropertyManagement() {
  const [properties, setProperties] = useState(mockProperties)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProperty, setSelectedProperty] = useState<(typeof mockProperties)[0] | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || property.type === typeFilter
    const matchesStatus = statusFilter === "all" || property.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleAddProperty = (propertyData: any) => {
    const newProperty = {
      id: Math.max(...properties.map((p) => p.id)) + 1,
      ...propertyData,
      createdAt: new Date().toISOString().split("T")[0],
      status: "Available",
      images: ["/diverse-property-showcase.png"],
      features: propertyData.features || [],
    }
    setProperties([...properties, newProperty])
    setIsAddDialogOpen(false)
  }

  const handleEditProperty = (propertyData: any) => {
    setProperties(
      properties.map((property) =>
        property.id === selectedProperty?.id ? { ...property, ...propertyData } : property,
      ),
    )
    setIsEditDialogOpen(false)
    setSelectedProperty(null)
  }

  const handleDeleteProperty = (propertyId: number) => {
    setProperties(properties.filter((property) => property.id !== propertyId))
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Available: "bg-green-100 text-green-800",
      Rented: "bg-blue-100 text-blue-800",
      Sold: "bg-gray-100 text-gray-800",
      "Under Review": "bg-yellow-100 text-yellow-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      Sale: "bg-purple-100 text-purple-800",
      Rental: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="text-sm text-gray-600">Manage your property listings and inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>Enter the property details below.</DialogDescription>
            </DialogHeader>
            <PropertyForm onSubmit={handleAddProperty} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.filter((p) => p.status === "Available").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">For Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.filter((p) => p.type === "Sale").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">For Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.filter((p) => p.type === "Rental").length}</div>
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
                placeholder="Search properties by title, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Rental">Rental</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Rented">Rented</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onView={() => {
                    setSelectedProperty(property)
                    setIsDetailDialogOpen(true)
                  }}
                  onEdit={() => {
                    setSelectedProperty(property)
                    setIsEditDialogOpen(true)
                  }}
                  onDelete={() => handleDeleteProperty(property.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <img
                          src={property.images[0] || "/placeholder.svg"}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {property.location}
                              </p>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <div className="flex space-x-2">
                                <Badge className={getTypeBadge(property.type)}>{property.type}</Badge>
                                <Badge className={getStatusBadge(property.status)}>{property.status}</Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProperty(property)
                                      setIsDetailDialogOpen(true)
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedProperty(property)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProperty(property.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {property.type === "Sale"
                                ? `$${property.price.toLocaleString()}`
                                : `$${property.price}/month`}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Bed className="h-4 w-4 mr-1" />
                              {property.bedrooms} bed
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Bath className="h-4 w-4 mr-1" />
                              {property.bathrooms} bath
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update the property details below.</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <PropertyForm
              initialData={selectedProperty}
              onSubmit={handleEditProperty}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedProperty(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <PropertyDetail
              property={selectedProperty}
              onClose={() => {
                setIsDetailDialogOpen(false)
                setSelectedProperty(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
