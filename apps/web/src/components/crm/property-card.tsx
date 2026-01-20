"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MapPin, Bed, Bath, DollarSign, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"

interface PropertyCardProps {
  property: any
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PropertyCard({ property, onView, onEdit, onDelete }: PropertyCardProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      Available: "bg-green-500/10 text-green-600",
      Rented: "bg-primary/20 text-primary",
      Sold: "bg-muted text-foreground",
      "Under Review": "bg-yellow-100 text-yellow-800",
    }
    return colors[status as keyof typeof colors] || "bg-muted text-foreground"
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      Sale: "bg-purple-500/10 text-purple-500",
      Rental: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-muted text-foreground"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative">
        <img
          src={property.images[0] || "/placeholder.svg"}
          alt={property.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <Badge className={getTypeBadge(property.type)}>{property.type}</Badge>
          <Badge className={getStatusBadge(property.status)}>{property.status}</Badge>
        </div>
        <div className="absolute top-2 left-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground line-clamp-1">{property.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {property.location}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {property.bedrooms}
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                {property.bathrooms}
              </div>
            </div>
            <div className="flex items-center text-lg font-bold text-foreground">
              <DollarSign className="h-4 w-4" />
              {property.type === "Sale" ? `${property.price.toLocaleString()}` : `${property.price}/mo`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
