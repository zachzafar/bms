"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { InquiryFormSchema, InquiryFormInputs } from "@/lib/schemas"
import { ExtendedSelectInquirySchema } from "@repo/api-contract"
import { authClient } from "@/lib/api/publicClient"
import { CONTACTS_QUERY_KEY, ASSETS_QUERY_KEY, USERS_QUERY_KEY } from "@/lib/api/queryKeys"

type Inquiry = typeof ExtendedSelectInquirySchema._type

interface InquiryFormProps {
  initialData?: Inquiry
  onSubmit: (data: InquiryFormInputs) => void
}

export function InquiryForm({ initialData, onSubmit }: InquiryFormProps) {
  const { data: contactsData } = authClient.crm.contacts.listContacts.useQuery({
    queryKey: CONTACTS_QUERY_KEY,
  })
  const { data: assetsData } = authClient.assets.getAssets.useQuery({
    queryKey: ASSETS_QUERY_KEY,
  })
  const { data: usersData } = authClient.users.getUsers.useQuery({
    queryKey: USERS_QUERY_KEY,
  })

  const contacts = contactsData?.body || []
  const assets = assetsData?.body || []
  const users = usersData?.body || []

  const form = useForm<InquiryFormInputs>({
    resolver: zodResolver(InquiryFormSchema),
    defaultValues: {
      contactId: initialData?.contactId || 0,
      assetId: initialData?.assetId || "",
      inquiryDate: initialData?.inquiryDate ? new Date(initialData.inquiryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: initialData?.status || "New",
      followUpDate: initialData?.followUpDate ? new Date(initialData.followUpDate).toISOString().split('T')[0] : "",
      assignedTo: initialData?.assignedTo || "",
      notes: initialData?.notes || "",
    },
  })

  const handleSubmit = (data: InquiryFormInputs) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactId">Client</Label>
          <Select 
            value={form.watch("contactId").toString()} 
            onValueChange={(value) => form.setValue("contactId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id.toString()}>
                  {contact.firstName} {contact.lastName} ({contact.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.contactId && (
            <p className="text-sm text-red-500">{form.formState.errors.contactId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="assetId">Property</Label>
          <Select 
            value={form.watch("assetId")} 
            onValueChange={(value) => form.setValue("assetId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.assetId && (
            <p className="text-sm text-red-500">{form.formState.errors.assetId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inquiryDate">Inquiry Date</Label>
          <Input
            id="inquiryDate"
            type="date"
            {...form.register("inquiryDate")}
            className={form.formState.errors.inquiryDate ? "border-red-500" : ""}
          />
          {form.formState.errors.inquiryDate && (
            <p className="text-sm text-red-500">{form.formState.errors.inquiryDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="followUpDate">Follow-Up Date</Label>
          <Input
            id="followUpDate"
            type="date"
            {...form.register("followUpDate")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={form.watch("status")} 
            onValueChange={(value) => form.setValue("status", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Follow-Up">Follow-Up</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Select 
            value={form.watch("assignedTo")} 
            onValueChange={(value) => form.setValue("assignedTo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {/* {user.firstName} {user.lastName} */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.assignedTo && (
            <p className="text-sm text-red-500">{form.formState.errors.assignedTo.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Additional notes about the inquiry..."
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : (initialData ? "Update Inquiry" : "Create Inquiry")}
        </Button>
      </div>
    </form>
  )
}
