"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ContactFormSchema, ContactFormInputs } from "@/lib/schemas"
import { ExtendedSelectContactSchema } from "@repo/api-contract"

type Contact = typeof ExtendedSelectContactSchema._type

interface ClientFormProps {
  initialData?: Contact
  onSubmit: (data: ContactFormInputs) => void
}

export function ClientForm({ initialData, onSubmit }: ClientFormProps) {
  const form = useForm<ContactFormInputs>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      source: initialData?.source || "Website",
    },
  })

  const handleSubmit = (data: ContactFormInputs) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...form.register("firstName")}
            className={form.formState.errors.firstName ? "border-red-500" : ""}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...form.register("lastName")}
            className={form.formState.errors.lastName ? "border-red-500" : ""}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          className={form.formState.errors.email ? "border-red-500" : ""}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          {...form.register("phone")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...form.register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Inquiry Source</Label>
        <Select 
          value={form.watch("source")} 
          onValueChange={(value) => form.setValue("source", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select inquiry source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Walk-In">Walk-In</SelectItem>
            <SelectItem value="Social">Social</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : (initialData ? "Update Client" : "Add Client")}
        </Button>
      </div>
    </form>
  )
}
