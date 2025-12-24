"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Star, Loader2 } from "lucide-react"
import { authClient } from "@/lib/api/publicClient"
import { CONTACTS_QUERY_KEY, ASSETS_QUERY_KEY, FEEDBACK_QUERY_KEY } from "@/lib/api/queryKeys"
import { toast } from "sonner"
import { StorageService } from "@/lib/api/storage"
import { useRouter } from "next/navigation"
import { 
  InsertFeedback, 
  InsertFeedbackSchema, 
  SelectFeedback,
} from "@/lib/api-contract"
import { useQueryClient } from "@tanstack/react-query"

interface FeedbackFormProps {
  feedback?: SelectFeedback
  onClose: () => void
}

export function FeedbackForm({ feedback, onClose }: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const router = useRouter()
  const tenant = StorageService.getTenant()
  const queryClient = useQueryClient()

  const form = useForm<InsertFeedback>({
    resolver: zodResolver(InsertFeedbackSchema),
    defaultValues: {
      contactId: 0,
      assetId: "",
      // viewingDate should be a string for the form
      viewingDate: new Date().toISOString(),
      rating: 0,
      comments: "",
    },
  })

  // Fetch contacts using proper query key
  const { data: contacts } = authClient.crm.contacts.listContacts.useQuery({
    queryKey: CONTACTS_QUERY_KEY,
  })

  // Fetch assets using proper query key
  const { data: assets } = authClient.assets.getAssets.useQuery({
    queryKey: ASSETS_QUERY_KEY,
  })

  // Create/Update feedback mutation following web folder pattern
  const { mutate: createFeedback, isPending } = authClient.crm.feedback.createFeedback.useMutation()
  const { mutate: updateFeedback, isPending: isUpdating } = authClient.crm.feedback.updateFeedback.useMutation()

  const isSubmitting = isPending || isUpdating

  useEffect(() => {
    if (feedback) {
      form.setValue("contactId", feedback.contactId)
      form.setValue("assetId", feedback.assetId)
      // Convert existing Date to ISO string for the form
      form.setValue("viewingDate", new Date(feedback.viewingDate).toISOString())
      form.setValue("rating", feedback.rating)
      form.setValue("comments", feedback.comments || "")
      setRating(feedback.rating)
    }
  }, [feedback, form])

  const processForm: SubmitHandler<InsertFeedback > = async (data) => {
    console.log("processing")
    const feedbackData = {
      ...data,
      rating,
    }

    if (feedback?.id) {
      // Build update payload using strings for dates
      const updateData = {
        id: feedback.id,
        contactId: feedbackData.contactId,
        assetId: feedbackData.assetId,
        viewingDate: feedbackData.viewingDate,
        rating: feedbackData.rating,
        comments: feedbackData.comments ?? null,
      }

      updateFeedback(
        {
          params: { id: feedback.id.toString() },
          body: updateData,
        },
        {
          onSuccess: () => {
            toast.success("Feedback updated successfully")
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            onClose()
            form.reset()
          },
          onError: (error: any) => {
            console.error("Error updating feedback:", error)
            toast.error("Failed to update feedback")
          },
        }
      )
    } else {
      createFeedback(
        {
          body: feedbackData,
        },
        {
          onSuccess: () => {
            toast.success("Feedback created successfully")
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            onClose()
            form.reset()
          },
          onError: (error: any) => {
            console.error("Error creating feedback:", error)
            toast.error("Failed to create feedback")
          },
        }
      )
    }
  }

  const handleRatingClick = (value: number) => {
    setRating(value)
    form.setValue("rating", value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contacts?.body?.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.firstName} {contact.lastName}
                      </SelectItem>
                    )) || (
                      <SelectItem value="no-contacts" disabled>
                        No contacts found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assetId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assets?.body?.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.title || asset.name}
                      </SelectItem>
                    )) || (
                      <SelectItem value="no-assets" disabled>
                        No assets found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="viewingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Viewing Date</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local"
                  // datetime-local expects "YYYY-MM-DDTHH:mm"
                  value={typeof field.value === "string" ? field.value.slice(0, 16) : ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRatingClick(value)}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          value <= (hoveredRating || rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating > 0 ? `${rating}/5` : "Select rating"}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts about the property..."
                  rows={4}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {feedback?.id ? "Update Feedback" : "Create Feedback"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
