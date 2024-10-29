'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Pencil, Trash2, XIcon } from 'lucide-react';
import { SubmitHandler, useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetTypeSchema, AssetTypeSchemaInputs } from '@/lib/schemas';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
  addAssetTypeWithProperties,
  deleteAssetType,
  updateAssetType,
} from '../_settingActions';
import {
  AssetProperty,
  AssetType,
  AssetTypeHasProperties,
} from '@prisma/client';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getAssetTypesWithProperties, getProperties } from '@/lib/db';
import { AssetTypeWithProperties } from '@/types';

export default function AssetTypes({ isActive }: { isActive: boolean }) {
  const [assetTypes, setAssetTypes] = useState<AssetTypeWithProperties[]>([]);

  const [properties, setProperties] = useState<AssetProperty[]>([]);

  const [editingAssetType, setEditingAssetType] =
    useState<AssetTypeWithProperties | null>(null);

  const { toast } = useToast();
  const form = useForm<AssetTypeSchemaInputs>({
    resolver: zodResolver(AssetTypeSchema),
    defaultValues: {
      name: '',
      schema: [],
    },
  });

  const { watch, setValue, handleSubmit, reset, control } = form;
  const { isSubmitting } = useFormState({ control });

  const schema = watch('schema');

  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null
  );
  const [isRequired, setIsRequired] = useState<boolean>(false);

  const handleRemoveSchemaField = (index: number) => {
    const updatedSchema = schema.filter((_, i) => i !== index);
    setValue('schema', updatedSchema);
  };

  const handleAddSchemaField = () => {
    if (selectedPropertyId !== null) {
      setValue('schema', [
        ...schema,
        { propertyId: selectedPropertyId, isRequired },
      ]);
      setSelectedPropertyId(null); // Clear selection after adding
      setIsRequired(false); // Reset required checkbox
    }
  };

  const processForm: SubmitHandler<AssetTypeSchemaInputs> = async (data) => {
    if (editingAssetType) {
      const response = await updateAssetType(editingAssetType.id, data);
      if (response.success && response.data) {
        toast({
          description: 'Asset type was updated successfully',
        });

        setAssetTypes(
          assetTypes.map((assetType) =>
            assetType.id === editingAssetType.id ? response.data : assetType
          )
          // assetType.id === editingAssetType.id ? response.data : assetType
        );
        setEditingAssetType(null);
        reset();
      } else {
        toast({
          description: 'Error occurred while updating asset type',
          variant: 'destructive',
        });
      }
    } else {
      const response = await addAssetTypeWithProperties(data);
      if (response.success && response.data) {
        toast({
          description: 'New asset type was added successfully',
        });
        setAssetTypes([...assetTypes, response.data]);
        reset();
      } else {
        toast({
          description: 'Error occurred while adding new asset type',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteAssetType = async (id: number) => {
    const response = await deleteAssetType(id);
    if (response.success && response.data) {
      toast({
        description: `${response.data.name} asset type was deleted`,
      });
      handleRemoveAssetType(id);
      reset();
    } else {
      toast({
        description: 'Error occurred while deleting asset type',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAssetType = (deletedID: number) => {
    const updatedAssetTypes = assetTypes.filter(({ id }) => id !== deletedID);
    setAssetTypes(updatedAssetTypes);
  };

  const cancelEdit = () => {
    setEditingAssetType(null);
    reset();
  };

  useEffect(() => {
    if (isActive) {
      refreshProperties();
      refreshAssetTypes();
    }
  }, [isActive]);

  const refreshProperties = async () => {
    try {
      const updatedProperties = await getProperties();
      if (updatedProperties) setProperties(updatedProperties);
    } catch (error) {
      console.error('Failed to refresh properties:', error);
    }
  };

  const refreshAssetTypes = async () => {
    try {
      const updatedAssetTypes =
        (await getAssetTypesWithProperties()) as AssetTypeWithProperties[];

      setAssetTypes(updatedAssetTypes);
    } catch (error) {
      console.error('Failed to refresh asset types:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {editingAssetType ? 'Edit Asset Type' : 'Add New Asset Type'}
          </CardTitle>
          <CardDescription>
            {editingAssetType
              ? 'Update the selected asset type.'
              : 'Define new types of assets and their properties.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(processForm)} className='space-y-4'>
              <FormField
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type Name</FormLabel>
                    <Input
                      id='asset-type-name'
                      placeholder='Enter asset type name'
                      {...field}
                    />
                  </FormItem>
                )}
              />
              <div className='space-y-2'>
                <Label>Schema</Label>
                {schema.map((field, index) => {
                  const property = properties.find(
                    (p) => p.id === field.propertyId
                  );
                  return (
                    <div key={index} className='flex items-center space-x-2'>
                      <Input value={property?.name || ''} readOnly />
                      <Checkbox checked={field.isRequired} disabled />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => handleRemoveSchemaField(index)}
                      >
                        <XIcon className='h-4 w-4' />
                      </Button>
                    </div>
                  );
                })}
                <div className='flex items-center space-x-2'>
                  <Select
                    onValueChange={(value) =>
                      setSelectedPropertyId(Number(value))
                    }
                  >
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Select property' />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem
                          key={property.id}
                          value={property.id.toString()}
                        >
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Checkbox
                    id='required'
                    checked={isRequired}
                    onCheckedChange={(checked) =>
                      setIsRequired(checked as boolean)
                    }
                  />
                  <label
                    htmlFor='required'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Required
                  </label>
                  <Button type='button' onClick={handleAddSchemaField}>
                    Add field
                  </Button>
                </div>
              </div>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting
                  ? editingAssetType
                    ? 'Updating Asset type...'
                    : 'Adding Asset type...'
                  : editingAssetType
                  ? 'Update Asset Type'
                  : 'Add Asset Type'}
              </Button>
              {editingAssetType && (
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
                <TableHead>Schema</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>
                    {type.AssetTypeHasProperties.map((value) => {
                      const property = properties.find(
                        (p) => p.id === value.id
                      );
                      return `${property?.name} (${
                        value.required ? 'Required' : 'Optional'
                      })`;
                    }).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setEditingAssetType(type);
                        reset({
                          name: type.name,
                          schema: type.AssetTypeHasProperties.map((value) => ({
                            propertyId: value.assetPropertyId,
                            isRequired: value.required,
                          })),
                        });
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDeleteAssetType(type.id)}
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
