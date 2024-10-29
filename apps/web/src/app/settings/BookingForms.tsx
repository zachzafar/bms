'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { XIcon, Table } from 'lucide-react';
import React, { useState } from 'react';

function BookingForms() {
  const [bookingForms, setBookingForms] = useState([
    {
      id: 1,
      name: 'Car Rental Form',
      assetType: 'Car',
      fields: [
        { name: "Driver's License Number", type: 'text', required: true },
        { name: 'Preferred Pickup Time', type: 'time', required: true },
        { name: 'Additional Insurance', type: 'checkbox', required: false },
      ],
    },
    {
      id: 2,
      name: 'Property Booking Form',
      assetType: 'Property',
      fields: [
        { name: 'Number of Guests', type: 'number', required: true },
        { name: 'Special Requests', type: 'textarea', required: false },
        { name: 'Agree to House Rules', type: 'checkbox', required: true },
      ],
    },
  ]);

  const [assetTypes, setAssetTypes] = useState([
    {
      id: 1,
      name: 'Car',
      schema: [
        { name: 'Make', type: 'text' },
        { name: 'Model', type: 'text' },
        { name: 'Year', type: 'number' },
      ],
    },
    {
      id: 2,
      name: 'Property',
      schema: [
        { name: 'Address', type: 'text' },
        { name: 'Bedrooms', type: 'number' },
        { name: 'Bathrooms', type: 'number' },
      ],
    },
  ]);

  const [newBookingForm, setNewBookingForm] = useState({
    name: '',
    assetType: '',
    fields: [],
  });

  const [newFormField, setNewFormField] = useState({
    name: '',
    type: 'text',
    required: false,
  });

  const handleAddBookingForm = (e) => {
    e.preventDefault();
    const id = bookingForms.length + 1;
    setBookingForms([...bookingForms, { id, ...newBookingForm }]);
    setNewBookingForm({ name: '', assetType: '', fields: [] });
  };

  const handleAddFormField = () => {
    setNewBookingForm({
      ...newBookingForm,
      fields: [...newBookingForm.fields, newFormField],
    });
    setNewFormField({ name: '', type: 'text', required: false });
  };

  const handleRemoveFormField = (index) => {
    const updatedFields = newBookingForm.fields.filter((_, i) => i !== index);
    setNewBookingForm({ ...newBookingForm, fields: updatedFields });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create Booking Form</CardTitle>
          <CardDescription>
            Design custom forms for booking requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddBookingForm} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='form-name'>Form Name</Label>
              <Input
                id='form-name'
                placeholder='Enter form name'
                value={newBookingForm.name}
                onChange={(e) =>
                  setNewBookingForm({
                    ...newBookingForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='form-asset-type'>Asset Type</Label>
              <Select
                value={newBookingForm.assetType}
                onValueChange={(value) =>
                  setNewBookingForm({
                    ...newBookingForm,
                    assetType: value,
                  })
                }
              >
                <SelectTrigger id='form-asset-type'>
                  <SelectValue placeholder='Select asset type' />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Form Fields</Label>
              {newBookingForm.fields.map((field, index) => (
                <div key={index} className='flex items-center space-x-2'>
                  <Input value={field.name} readOnly />
                  <Select value={field.type} disabled>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='text'>Text</SelectItem>
                      <SelectItem value='number'>Number</SelectItem>
                      <SelectItem value='date'>Date</SelectItem>
                      <SelectItem value='time'>Time</SelectItem>
                      <SelectItem value='checkbox'>Checkbox</SelectItem>
                      <SelectItem value='textarea'>Textarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label className='flex items-center space-x-2'>
                    <input type='checkbox' checked={field.required} readOnly />
                    <span>Required</span>
                  </Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => handleRemoveFormField(index)}
                  >
                    <XIcon className='h-4 w-4' />
                  </Button>
                </div>
              ))}
              <div className='flex items-center space-x-2'>
                <Input
                  placeholder='Field name'
                  value={newFormField.name}
                  onChange={(e) =>
                    setNewFormField({
                      ...newFormField,
                      name: e.target.value,
                    })
                  }
                />
                <Select
                  value={newFormField.type}
                  onValueChange={(value) =>
                    setNewFormField({ ...newFormField, type: value })
                  }
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='text'>Text</SelectItem>
                    <SelectItem value='number'>Number</SelectItem>
                    <SelectItem value='date'>Date</SelectItem>
                    <SelectItem value='time'>Time</SelectItem>
                    <SelectItem value='checkbox'>Checkbox</SelectItem>
                    <SelectItem value='textarea'>Textarea</SelectItem>
                  </SelectContent>
                </Select>
                <Label className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={newFormField.required}
                    onChange={(e) =>
                      setNewFormField({
                        ...newFormField,
                        required: e.target.checked,
                      })
                    }
                  />
                  <span>Required</span>
                </Label>
                <Button type='button' onClick={handleAddFormField}>
                  Add Field
                </Button>
              </div>
            </div>
            <Button type='submit'>Create Booking Form</Button>
          </form>
        </CardContent>
      </Card>
      <Card className='mt-4'>
        <CardHeader>
          <CardTitle>Existing Booking Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>{form.name}</TableCell>
                  <TableCell>{form.assetType}</TableCell>
                  <TableCell>
                    {form.fields
                      .map(
                        (field) =>
                          `${field.name} (${field.type}${
                            field.required ? ', Required' : ''
                          })`
                      )
                      .join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default BookingForms;
