'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import React, {  useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { useToast } from '@/components/ui/use-toast';

import { z } from 'zod';

import { useAddProperty, useDeleteProperty, useProperties, useUpdateProperty } from '../../lib/api/useSettings';
import { AssetProperty, InsertAssetProperty,  insertAssetPropertySchema, PatchAssetProperty } from '@repo/drizzle/src/schema';



export default function Properties() {
  const [editingProperty, setEditingProperty] = useState<AssetProperty | null>(null);
  const { data: properties } = useProperties();
  const addPropertyMutation = useAddProperty();
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();
  const { toast } = useToast();

  const form = useForm<InsertAssetProperty>({
    resolver: zodResolver(insertAssetPropertySchema),
  });

  const { handleSubmit, reset, setValue } = form;

  const processForm = async (data: InsertAssetProperty) => {
    try {
      if (editingProperty) {
        const patchData: PatchAssetProperty = {
          ...editingProperty,
          ...data,
        };
        await updatePropertyMutation.mutateAsync(patchData);
        toast({ description: 'Asset was updated successfully' });
        setEditingProperty(null);
      } else {
        await addPropertyMutation.mutateAsync(data);
        toast({ description: 'New property was added successfully' });
      }
      reset();
    } catch (error) {
      toast({
        description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const editProperty = (property: AssetProperty) => {
    setEditingProperty(property);
    setValue('name', property.name);
    setValue('propertyType', property.propertyType as 'number' | 'date' | 'text' | 'list' | 'truthy' | 'textarea');
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    reset();
  };

  const removeProperty = async (deletedID: number) => {
    try {
      await deletePropertyMutation.mutateAsync(deletedID);
      toast({ description: 'Asset type was deleted' });
    } catch (error) {
      toast({
        description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Properties</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Form {...form}>
            <form onSubmit={handleSubmit(processForm)}>
              <div className='flex space-x-4'>
                <div className='flex-1'>
                  <FormField
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <Input
                          id='propertyName'
                          placeholder='e.g., Address'
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='w-1/3'>
                  <FormField
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor='propertyType'>Property Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger id='propertyType'>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='text'>Text</SelectItem>
                            <SelectItem value='number'>Number</SelectItem>
                            <SelectItem value='list'>List</SelectItem>
                            <SelectItem value='truthy'>Truthy</SelectItem>
                            <SelectItem value='textarea'>Text Area</SelectItem>
                            <SelectItem value='date'>Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button type='submit' disabled={addPropertyMutation.isPending || updatePropertyMutation.isPending}>
                {addPropertyMutation.isPending || updatePropertyMutation.isPending
                  ? editingProperty
                    ? 'Updating Property...'
                    : 'Adding Property...'
                  : editingProperty
                  ? 'Update Property'
                  : 'Add Property'}
              </Button>
              {editingProperty && (
                <Button type='button' variant='outline' onClick={cancelEdit}>
                  Cancel Edit
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className='mt-4'>
        <CardHeader>
          <CardTitle>Existing Asset Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties?.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>{type.propertyType}</TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => editProperty(type)}
                      aria-label='Edit'
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => removeProperty(type.id)}
                      aria-label='Delete'
                      disabled={deletePropertyMutation.isPending}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
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
