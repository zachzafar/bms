"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { BrochureFormSchema, BrochureFormInputs } from "@/lib/schemas"
// Fake data for contacts
const fakeContacts = [
  { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@example.com" },
  { id: 2, firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com" },
  { id: 3, firstName: "Mike", lastName: "Johnson", email: "mike.johnson@example.com" },
  { id: 4, firstName: "Sarah", lastName: "Wilson", email: "sarah.wilson@example.com" }
]

// Fake data for assets
const fakeAssets = [
  { id: "1", name: "Property Photos - Oceanview Villa", type: "image" },
  { id: "2", name: "Floor Plans - Downtown Condo", type: "document" },
  { id: "3", name: "Virtual Tour - Luxury Estate", type: "video" },
  { id: "4", name: "Brochure Template - Modern", type: "template" }
]
import { toast } from "sonner"
import { useState } from "react"

type Brochure = {
  id: number
  type: string
  content: string
  createdAt: string
  updatedAt: string
  tenantId: number
}

interface BrochureFormProps {
  brochure?: Brochure
  onSuccess?: () => void
  onCancel?: () => void
}

export function BrochureForm({ brochure, onSuccess, onCancel }: BrochureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BrochureFormInputs>({
    resolver: zodResolver(BrochureFormSchema),
    defaultValues: {
      contactId: brochure ? brochure.id : 1,
      assetIds: []
    }
  })



  const onSubmit = async (data: BrochureFormInputs) => {
    setIsSubmitting(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (brochure) {
        toast.success("Brochure updated successfully")
      } else {
        toast.success("Brochure created successfully")
        form.reset()
      }
      onSuccess?.()
    } catch (error) {
      toast.error(brochure ? "Failed to update brochure" : "Failed to create brochure")
      console.error("Brochure form error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {fakeContacts.map((contact) => (
                      <SelectItem key={contact.id} value={String(contact.id)}>
                        {contact.firstName} {contact.lastName} - {contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assetIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Assets</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select the assets to include in this brochure.
                </p>
              </div>
              {fakeAssets.map((asset) => (
                <FormField
                  key={asset.id}
                  control={form.control}
                  name="assetIds"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={asset.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(asset.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, asset.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== asset.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {asset.name} ({asset.type})
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : brochure ? "Update Brochure" : "Create Brochure"}
          </Button>
        </div>
      </form>
    </Form>
  )
}