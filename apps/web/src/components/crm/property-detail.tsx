"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MapPin, Bed, Bath, DollarSign, Calendar, Star, MessageSquare, Eye, Share } from "lucide-react"

interface PropertyDetailProps {
  property: any
  onClose: () => void
}

// Mock data for property inquiries and viewings
const mockInquiries = [
  {
    id: 1,
    clientName: "John Smith",
    date: "2024-01-20",
    status: "Open",
    message: "Interested in scheduling a viewing for this weekend.",
  },
  {
    id: 2,
    clientName: "Sarah Johnson",
    date: "2024-01-18",
    status: "Follow-up",
    message: "Would like more information about the neighborhood.",
  },
]

const mockViewings = [
  {
    id: 1,
    clientName: "Michael Brown",
    date: "2024-01-22",
    time: "2:00 PM",
    status: "Scheduled",
  },
  {
    id: 2,
    clientName: "Emma Davis",
    date: "2024-01-19",
    time: "10:00 AM",
    status: "Completed",
    rating: 4,
    feedback: "Great property, very interested!",
  },
]

export function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      Available: "bg-green-500/10 text-green-600",
      Rented: "bg-primary/20 text-primary",
      Sold: "bg-muted text-foreground",
      "Under Review": "bg-yellow-100 text-yellow-800",
      Open: "bg-primary/20 text-primary",
      "Follow-up": "bg-yellow-100 text-yellow-800",
      Scheduled: "bg-green-500/10 text-green-600",
      Completed: "bg-muted text-foreground",
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
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Property Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{property.title}</h2>
            <p className="text-muted-foreground flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {property.location}
            </p>
          </div>
          <div className="flex space-x-2">
            <Badge className={getTypeBadge(property.type)}>{property.type}</Badge>
            <Badge className={getStatusBadge(property.status)}>{property.status}</Badge>
          </div>
        </div>

        {/* Property Image */}
        <div className="relative">
          <img
            src={property.images[0] || "/placeholder.svg"}
            alt={property.title}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-lg shadow-md">
            <span className="text-lg font-bold text-foreground flex items-center">
              <DollarSign className="h-4 w-4" />
              {property.type === "Sale" ? `${property.price.toLocaleString()}` : `${property.price}/month`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-muted-foreground">
                  <Bed className="h-5 w-5 mr-2" />
                  <span className="font-medium">{property.bedrooms}</span>
                  <span className="ml-1">Bedrooms</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Bath className="h-5 w-5 mr-2" />
                  <span className="font-medium">{property.bathrooms}</span>
                  <span className="ml-1">Bathrooms</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Listed {property.createdAt}</span>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-muted-foreground">{property.description}</p>
              </div>
              {property.features && property.features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Features & Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature: string) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Inquiries
              </CardTitle>
              <CardDescription>Latest client inquiries for this property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInquiries.map((inquiry, index) => (
                  <div key={inquiry.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{inquiry.clientName}</p>
                          <Badge className={getStatusBadge(inquiry.status)}>{inquiry.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{inquiry.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {inquiry.date}
                        </p>
                      </div>
                    </div>
                    {index < mockInquiries.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-transparent" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Schedule Viewing
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Inquirer
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <Share className="h-4 w-4 mr-2" />
                Share Property
              </Button>
            </CardContent>
          </Card>

          {/* Property Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Views</span>
                <span className="font-semibold">247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Inquiries</span>
                <span className="font-semibold">{mockInquiries.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Viewings</span>
                <span className="font-semibold">{mockViewings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Days on Market</span>
                <span className="font-semibold">12</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Viewings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Viewings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockViewings.map((viewing) => (
                  <div key={viewing.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{viewing.clientName}</p>
                      <Badge className={getStatusBadge(viewing.status)}>{viewing.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viewing.date} at {viewing.time}
                    </p>
                    {viewing.feedback && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < (viewing.rating || 0) ? "text-yellow-500 fill-current" : "text-muted-foreground/50"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{viewing.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
