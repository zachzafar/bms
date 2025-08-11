"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface PropertyFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

const availableFeatures = [
  "Parking",
  "Gym",
  "Pool",
  "Balcony",
  "Garden",
  "Garage",
  "Fireplace",
  "Storage",
  "High Ceilings",
  "Exposed Brick",
  "Hardwood Floors",
  "Terrace",
  "Concierge",
  "City Views",
  "Pet Friendly",
  "Furnished",
]

export function PropertyForm({ initialData, onSubmit, onCancel }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: initialData?.type || "",
    location: initialData?.location || "",
    price: initialData?.price || "",
    bedrooms: initialData?.bedrooms || "",
    bathrooms: initialData?.bathrooms || "",
    features: initialData?.features || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      price: Number.parseFloat(formData.price),
      bedrooms: Number.parseInt(formData.bedrooms),
      bathrooms: Number.parseInt(formData.bathrooms),
    })
  }

  const handleChange = (field: string, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    const updatedFeatures = checked
      ? [...formData.features, feature]
      : formData.features.filter((f: string) => f !== feature)
    handleChange("features", updatedFeatures)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="title">Property Title</Label>
          <Input id="title" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} required />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Property Type</Label>
          <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sale">For Sale</SelectItem>
              <SelectItem value="Rental">For Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder={formData.type === "Sale" ? "Sale price" : "Monthly rent"}
            required
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="City, State, Country"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={formData.bedrooms}
            onChange={(e) => handleChange("bedrooms", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            step="0.5"
            value={formData.bathrooms}
            onChange={(e) => handleChange("bathrooms", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Features & Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {availableFeatures.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={feature}
                checked={formData.features.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
              />
              <Label htmlFor={feature} className="text-sm">
                {feature}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Update Property" : "Add Property"}</Button>
      </div>
    </form>
  )
}
