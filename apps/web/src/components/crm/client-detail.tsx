"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Calendar, MessageSquare, FileText, User, Building } from "lucide-react"
import { ExtendedSelectContactSchema } from "@/lib/api-contract"
import { authClient } from "@/lib/api/publicClient"
import { CONTACT_INQUIRIES_QUERY_KEY, CONTACT_COMMUNICATIONS_QUERY_KEY, CONTACT_FEEDBACK_QUERY_KEY } from "@/lib/api/queryKeys"

type Contact = typeof ExtendedSelectContactSchema._type

interface ClientDetailProps {
  client: Contact
}

export function ClientDetail({ client }: ClientDetailProps) {
  const { data: inquiriesData } = authClient.crm.inquiries.listInquiries.useQuery({
    queryKey: CONTACT_INQUIRIES_QUERY_KEY,
    query: { contactId: client.id.toString() }
  })
  const { data: communicationsData } = authClient.crm.communications.listComms.useQuery({
    queryKey: CONTACT_COMMUNICATIONS_QUERY_KEY,
    query: { contactId: client.id.toString() }
  })
  const { data: feedbackData } = authClient.crm.feedback.listFeedback.useQuery({
    queryKey: CONTACT_FEEDBACK_QUERY_KEY,
    query: { contactId: client.id.toString() }
  })

  const inquiries = inquiriesData?.body || []
  const communications = communicationsData?.body || []
  const feedback = feedbackData?.body || []

  const getStatusBadge = (client: Contact) => {
    if (client.customerProfile) {
      return <Badge variant="default">Customer</Badge>
    }
    if (client.ownerProfile) {
      return <Badge variant="secondary">Owner</Badge>
    }
    return <Badge variant="outline">Lead</Badge>
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "inquiry":
        return <MessageSquare className="h-4 w-4" />
      case "communication":
        return <Phone className="h-4 w-4" />
      case "feedback":
        return <FileText className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {client.firstName[0]}
              {client.lastName[0]}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {client.firstName} {client.lastName}
            </h2>
            <p className="text-muted-foreground">
              Contact since {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {getStatusBadge(client)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{client.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Source</p>
                <p className="text-sm text-muted-foreground">{client.source}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.customerProfile && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Customer Profile</p>
                <p className="text-xs text-green-600">Active customer account</p>
              </div>
            )}
            {client.ownerProfile && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Property Owner</p>
                <p className="text-xs text-blue-600">Owns properties in the system</p>
              </div>
            )}
            {!client.customerProfile && !client.ownerProfile && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800">Lead</p>
                <p className="text-xs text-gray-600">Potential customer</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{inquiries.length}</p>
              <p className="text-sm text-muted-foreground">Total Inquiries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{communications.length}</p>
              <p className="text-sm text-muted-foreground">Communications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{feedback.length}</p>
              <p className="text-sm text-muted-foreground">Feedback</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inquiries.slice(0, 5).map((inquiry) => (
              <div key={inquiry.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                {getActivityIcon("inquiry")}
                <div className="flex-1">
                  <p className="text-sm font-medium">Property Inquiry</p>
                  <p className="text-xs text-muted-foreground">
                    Inquired about {inquiry.asset.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(inquiry.inquiryDate).toLocaleDateString()}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {inquiry.status}
                  </Badge>
                </div>
              </div>
            ))}
            {communications.slice(0, 5).map((comm) => (
              <div key={comm.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                {getActivityIcon("communication")}
                <div className="flex-1">
                  <p className="text-sm font-medium">{comm.type}</p>
                  <p className="text-xs text-muted-foreground">{comm.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(comm.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {feedback.slice(0, 5).map((fb) => (
              <div key={fb.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                {getActivityIcon("feedback")}
                <div className="flex-1">
                  <p className="text-sm font-medium">Property Feedback</p>
                  <p className="text-xs text-muted-foreground">
                    {fb.asset.name} - Rating: {fb.rating}/5
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(fb.viewingDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {inquiries.length === 0 && communications.length === 0 && feedback.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
