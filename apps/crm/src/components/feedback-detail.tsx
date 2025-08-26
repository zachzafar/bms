"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, User, Building, Calendar, MessageSquare } from "lucide-react"

interface FeedbackDetailProps {
  feedback: any
  onClose: () => void
}

export function FeedbackDetail({ feedback }: FeedbackDetailProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800"
    if (rating >= 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{feedback.propertyTitle}</h2>
          <p className="text-gray-600">Feedback Details</p>
        </div>
        <Badge className={getRatingBadgeColor(feedback.rating)}>{feedback.rating} ★</Badge>
      </div>

      {/* Rating Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Overall Rating</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < feedback.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className={`text-lg font-semibold ${getRatingColor(feedback.rating)}`}>{feedback.rating}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Client Information</h3>
            </div>
            <p className="text-gray-700">{feedback.clientName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Property</h3>
            </div>
            <p className="text-gray-700">{feedback.propertyTitle}</p>
          </CardContent>
        </Card>
      </div>

      {/* Viewing Date */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Viewing Date</h3>
          </div>
          <p className="text-gray-700">
            {new Date(feedback.viewingDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Comments</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{feedback.comments}</p>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Feedback Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{new Date(feedback.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
