'use client'

import React, { useState, useEffect, useRef } from 'react'
import { XIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Property {
  id: number
  name: string
  description: string
}

interface Field {
  id: string
  propertyId: number | null
  name: string
  type: string
  isRequired: boolean
}

interface DynamicFieldSelectorProps {
  properties: Property[]
  initialFields?: Field[]
  onFieldsChange: (fields: Field[]) => void
}

const fieldTypes = ['Text', 'Number', 'Date', 'Email', 'Phone', 'URL']

export function DynamicFieldSelector({ properties, initialFields = [], onFieldsChange }: DynamicFieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const [newField, setNewField] = useState<Omit<Field, 'id'> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const filtered = properties.filter(
      (property) =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProperties(filtered)
    setIsDropdownVisible(searchTerm.length > 0 && filtered.length > 0)
  }, [searchTerm, properties])

  useEffect(() => {
    onFieldsChange(fields)
  }, [fields, onFieldsChange])

  const addField = (property?: Property) => {
    if (property) {
      const field: Field = {
        id: Date.now().toString(),
        propertyId: property.id,
        name: property.name,
        type: 'Text',
        isRequired: false,
      }
      setFields([...fields, field])
      setSearchTerm('')
      setIsDropdownVisible(false)
      setNewField(null)
    } else if (newField) {
      const field: Field = {
        id: Date.now().toString(),
        ...newField,
      }
      setFields([...fields, field])
      setNewField(null)
    }
    inputRef.current?.focus()
  }

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (value && !filteredProperties.length) {
      setNewField({
        propertyId: null,
        name: value,
        type: 'Text',
        isRequired: false,
      })
    } else {
      setNewField(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search and add fields..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
          {isDropdownVisible && (
            <ul className="absolute z-10 w-full bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredProperties.map((property) => (
                <li
                  key={property.id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => addField(property)}
                >
                  <div className="font-medium">{property.name}</div>
                  <div className="text-sm text-muted-foreground">{property.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Select
          value={newField?.type || 'Text'}
          onValueChange={(value) => setNewField(prev => prev ? { ...prev, type: value } : null)}
          disabled={!newField}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Checkbox
          checked={newField?.isRequired || false}
          onCheckedChange={(checked) => setNewField(prev => prev ? { ...prev, isRequired: checked as boolean } : null)}
          disabled={!newField}
          aria-label="Required field"
        />
        <Button
          type="button"
          onClick={() => addField()}
          disabled={!newField}
          className="whitespace-nowrap"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Field
        </Button>
      </div>

      {fields.map((field) => (
        <div key={field.id} className="flex items-center space-x-2">
          <div className="flex-grow">{field.name}</div>
          <div className="w-[120px] text-sm text-muted-foreground">{field.type}</div>
          <div className="w-24 text-center">
            {field.isRequired ? (
              <span className="text-sm text-muted-foreground">Required</span>
            ) : (
              <span className="text-sm text-muted-foreground">Optional</span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeField(field.id)}
            aria-label={`Remove ${field.name}`}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

