"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Phone, Mail, Calendar, User, Clock, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"

interface CommunicationDetailProps {
  communication: any
  onClose: () => void
}

// Mock data for related communications
const mockRelatedCommunications = [
  {
    id: 6,
    date: "2024-01-15",
    type: "Email",
    summary: "Initial property inquiry received",
    outcome: "Neutral",
  },
  {
    id: 7,
    date: "2024-01-16",
    type: "Phone Call",
    summary: "First contact call to discuss requirements",
    outcome: "Positive",
  },
]

export function CommunicationDetail({ communication, onClose }: CommunicationDetailProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Phone Call":
        return <Phone className="h-5 w-5" />
      case "Email":
        return <Mail className="h-5 w-5" />
      case "Meeting":
        return <Calendar className="h-5 w-5" />
      default:
        return <MessageSquare className="h-5 w-5" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      "Phone Call": "bg-blue-100 text-blue-800",
      Email: "bg-green-100 text-green-800",
      Meeting: "bg-purple-100 text-purple-800",
      "Text Message": "bg-orange-100 text-orange-800",
      "Video Call": "bg-indigo-100 text-indigo-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getOutcomeBadge = (outcome: string) => {
    const colors = {
      Positive: "bg-green-100 text-green-800",
      Neutral: "bg-yellow-100 text-yellow-800",
      Negative: "bg-red-100 text-red-800",
    }
    return colors[outcome as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Communication Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">{getTypeIcon(communication.type)}</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{communication.type}</h2>
            <p className="text-gray-600">
              {communication.date} at {communication.time}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge className={getTypeBadge(communication.type)}>{communication.type}</Badge>
          <Badge className={getOutcomeBadge(communication.outcome)}>{communication.outcome}</Badge>
          {communication.followUpRequired && (
            <Badge className="bg-orange-100 text-orange-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Follow-up Required
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Communication Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communication Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{communication.summary}</p>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {communication.clientName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {communication.clientEmail}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Team Member</h4>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {communication.userName}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {communication.tags && communication.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {communication.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Communications</CardTitle>
              <CardDescription>Other communications with this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRelatedCommunications.map((relComm, index) => (
                  <div key={relComm.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">{getTypeIcon(relComm.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{relComm.summary}</p>
                          <p className="text-xs text-gray-500 mt-1">{relComm.date}</p>
                        </div>
                      </div>
                      <Badge className={getOutcomeBadge(relComm.outcome)} variant="secondary">
                        {relComm.outcome}
                      </Badge>
                    </div>
                    {index < mockRelatedCommunications.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Communication Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communication Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {communication.date} at {communication.time}
                  </p>
                </div>
              </div>
              {communication.duration && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-600">{communication.duration} minutes</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Outcome</p>
                  <Badge className={getOutcomeBadge(communication.outcome)}>{communication.outcome}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Info */}
          {communication.followUpRequired && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follow-up Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Follow-up Date</p>
                    <p className="text-sm text-gray-600">{communication.followUpDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-transparent" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Client
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              {communication.followUpRequired && (
                <Button className="w-full bg-transparent" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Follow-up Complete
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Communication Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Communication Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Communications</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="font-semibold">2.5h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Contact</span>
                <span className="font-semibold">{communication.date}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
