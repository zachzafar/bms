// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import {
//   Plus,
//   Search,
//   MoreHorizontal,
//   Edit,
//   Eye,
//   Trash2,
//   Grid,
//   List,
//   MapPin,
//   Bed,
//   Bath,
//   DollarSign,
// } from "lucide-react"
// import { PropertyForm } from "@/components/property-form"
// import { PropertyDetail } from "@/components/property-detail"
// import { PropertyCard } from "@/components/property-card"
// import { authClient } from "@/lib/api/publicClient"
// import { PROPERTY_QUERY_KEY } from "@/lib/api/queryKeys"
// import { toast } from "sonner"

// export default function PropertyManagement() {
//   const { data: propertiesData, refetch } = authClient.properties.getProperties.useQuery({
//     queryKey: PROPERTY_QUERY_KEY,
//   })
//   const { data: statsData } = authClient.properties.getPropertyStats.useQuery({
//     queryKey: [...PROPERTY_QUERY_KEY, "stats"],
//   })
//   const { mutate: createProperty } = authClient.properties.createProperty.useMutation()
//   const { mutate: updateProperty } = authClient.properties.updateProperty.useMutation()
//   const { mutate: deleteProperty } = authClient.properties.deleteProperty.useMutation()

//   const [searchTerm, setSearchTerm] = useState("")
//   const [typeFilter, setTypeFilter] = useState("all")
//   const [statusFilter, setStatusFilter] = useState("all")
//   const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
//   const [selectedProperty, setSelectedProperty] = useState<any>(null)
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
//   const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

//   const properties = propertiesData?.body || []
//   const stats = statsData?.body || { total: 0, available: 0, forSale: 0, forRent: 0 }

//   const filteredProperties = properties.filter((property: any) => {
//     const matchesSearch =
//       property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       property.description.toLowerCase().includes(searchTerm.toLowerCase())

//     const matchesType = typeFilter === "all" || property.type === typeFilter
//     const matchesStatus = statusFilter === "all" || property.status === statusFilter

//     return matchesSearch && matchesType && matchesStatus
//   })

//   const handleAddProperty = (propertyData: any) => {
//     createProperty(
//       { body: propertyData },
//       {
//         onSuccess: () => {
//           toast.success("Property added successfully")
//           refetch()
//           setIsAddDialogOpen(false)
//         },
//         onError: () => {
//           toast.error("Failed to add property")
//         },
//       },
//     )
//   }

//   const handleEditProperty = (propertyData: any) => {
//     if (!selectedProperty) return
//     updateProperty(
//       {
//         params: { id: selectedProperty.id.toString() },
//         body: propertyData,
//       },
//       {
//         onSuccess: () => {
//           toast.success("Property updated successfully")
//           refetch()
//           setIsEditDialogOpen(false)
//           setSelectedProperty(null)
//         },
//         onError: () => {
//           toast.error("Failed to update property")
//         },
//       },
//     )
//   }

//   const handleDeleteProperty = (propertyId: number) => {
//     if (confirm("Are you sure you want to delete this property?")) {
//       deleteProperty(
//         { params: { id: propertyId.toString() } },
//         {
//           onSuccess: () => {
//             toast.success("Property deleted successfully")
//             refetch()
//           },
//           onError: () => {
//             toast.error("Failed to delete property")
//           },
//         },
//       )
//     }
//   }

//   const getStatusBadge = (status: string) => {
//     const colors = {
//       Available: "bg-green-100 text-green-800",
//       Rented: "bg-blue-100 text-blue-800",
//       Sold: "bg-gray-100 text-gray-800",
//       "Under Review": "bg-yellow-100 text-yellow-800",
//     }
//     return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
//   }

//   const getTypeBadge = (type: string) => {
//     const colors = {
//       Sale: "bg-purple-100 text-purple-800",
//       Rental: "bg-orange-100 text-orange-800",
//     }
//     return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
//           <p className="text-sm text-gray-600">Manage your property listings and inventory</p>
//         </div>
//         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//           <DialogTrigger asChild>
//             <Button>
//               <Plus className="h-4 w-4 mr-2" />
//               Add Property
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-3xl">
//             <DialogHeader>
//               <DialogTitle>Add New Property</DialogTitle>
//               <DialogDescription>Enter the property details below.</DialogDescription>
//             </DialogHeader>
//             <PropertyForm onSubmit={handleAddProperty} onCancel={() => setIsAddDialogOpen(false)} />
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">Total Properties</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.total}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.available}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">For Sale</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.forSale}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">For Rent</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.forRent}</div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Search and Filters */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//               <Input
//                 placeholder="Search properties by title, location, or description..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <div className="flex gap-2">
//               <Select value={typeFilter} onValueChange={setTypeFilter}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue placeholder="Type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Types</SelectItem>
//                   <SelectItem value="Sale">Sale</SelectItem>
//                   <SelectItem value="Rental">Rental</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue placeholder="Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="Available">Available</SelectItem>
//                   <SelectItem value="Rented">Rented</SelectItem>
//                   <SelectItem value="Sold">Sold</SelectItem>
//                 </SelectContent>
//               </Select>
//               <div className="flex border rounded-md">
//                 <Button
//                   variant={viewMode === "grid" ? "default" : "ghost"}
//                   size="sm"
//                   onClick={() => setViewMode("grid")}
//                   className="rounded-r-none"
//                 >
//                   <Grid className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant={viewMode === "list" ? "default" : "ghost"}
//                   size="sm"
//                   onClick={() => setViewMode("list")}
//                   className="rounded-l-none"
//                 >
//                   <List className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {viewMode === "grid" ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredProperties.map((property: any) => (
//                 <PropertyCard
//                   key={property.id}
//                   property={property}
//                   onView={() => {
//                     setSelectedProperty(property)
//                     setIsDetailDialogOpen(true)
//                   }}
//                   onEdit={() => {
//                     setSelectedProperty(property)
//                     setIsEditDialogOpen(true)
//                   }}
//                   onDelete={() => handleDeleteProperty(property.id)}
//                 />
//               ))}
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {filteredProperties.map((property: any) => (
//                 <Card key={property.id} className="hover:shadow-md transition-shadow">
//                   <CardContent className="p-6">
//                     <div className="flex items-start justify-between">
//                       <div className="flex space-x-4">
//                         <img
//                           src={property.images?.[0] || "/placeholder.svg"}
//                           alt={property.title}
//                           className="w-24 h-24 object-cover rounded-lg"
//                         />
//                         <div className="flex-1">
//                           <div className="flex items-start justify-between">
//                             <div>
//                               <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
//                               <p className="text-sm text-gray-600 flex items-center mt-1">
//                                 <MapPin className="h-3 w-3 mr-1" />
//                                 {property.location}
//                               </p>
//                               <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>
//                             </div>
//                             <div className="flex flex-col items-end space-y-2">
//                               <div className="flex space-x-2">
//                                 <Badge className={getTypeBadge(property.type)}>{property.type}</Badge>
//                                 <Badge className={getStatusBadge(property.status)}>{property.status}</Badge>
//                               </div>
//                               <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                   <Button variant="ghost" size="sm">
//                                     <MoreHorizontal className="h-4 w-4" />
//                                   </Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent align="end">
//                                   <DropdownMenuItem
//                                     onClick={() => {
//                                       setSelectedProperty(property)
//                                       setIsDetailDialogOpen(true)
//                                     }}
//                                   >
//                                     <Eye className="h-4 w-4 mr-2" />
//                                     View Details
//                                   </DropdownMenuItem>
//                                   <DropdownMenuItem
//                                     onClick={() => {
//                                       setSelectedProperty(property)
//                                       setIsEditDialogOpen(true)
//                                     }}
//                                   >
//                                     <Edit className="h-4 w-4 mr-2" />
//                                     Edit
//                                   </DropdownMenuItem>
//                                   <DropdownMenuItem
//                                     onClick={() => handleDeleteProperty(property.id)}
//                                     className="text-red-600"
//                                   >
//                                     <Trash2 className="h-4 w-4 mr-2" />
//                                     Delete
//                                   </DropdownMenuItem>
//                                 </DropdownMenuContent>
//                               </DropdownMenu>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-4 mt-3">
//                             <div className="flex items-center text-sm text-gray-600">
//                               <DollarSign className="h-4 w-4 mr-1" />
//                               {property.type === "Sale"
//                                 ? `$${property.price?.toLocaleString()}`
//                                 : `$${property.price}/month`}
//                             </div>
//                             <div className="flex items-center text-sm text-gray-600">
//                               <Bed className="h-4 w-4 mr-1" />
//                               {property.bedrooms} bed
//                             </div>
//                             <div className="flex items-center text-sm text-gray-600">
//                               <Bath className="h-4 w-4 mr-1" />
//                               {property.bathrooms} bath
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Edit Dialog */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="max-w-3xl">
//           <DialogHeader>
//             <DialogTitle>Edit Property</DialogTitle>
//             <DialogDescription>Update the property details below.</DialogDescription>
//           </DialogHeader>
//           {selectedProperty && (
//             <PropertyForm
//               initialData={selectedProperty}
//               onSubmit={handleEditProperty}
//               onCancel={() => {
//                 setIsEditDialogOpen(false)
//                 setSelectedProperty(null)
//               }}
//             />
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Detail Dialog */}
//       <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
//         <DialogContent className="max-w-5xl">
//           <DialogHeader>
//             <DialogTitle>Property Details</DialogTitle>
//           </DialogHeader>
//           {selectedProperty && (
//             <PropertyDetail
//               property={selectedProperty}
//               onClose={() => {
//                 setIsDetailDialogOpen(false)
//                 setSelectedProperty(null)
//               }}
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }
