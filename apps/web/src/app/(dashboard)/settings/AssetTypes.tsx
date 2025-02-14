'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pencil, Trash2, XIcon } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY, PROPERTIES_QUERY_KEY } from '@/lib/api/queryKeys';
import { AssetTypeWithProperties, AssetTypeWithPropertiesSchema, SelectAssetTypeWithProperties } from '@repo/api-contract';




export default function AssetTypes() {
  const [editingAssetType, setEditingAssetType] = useState<SelectAssetTypeWithProperties | null>(null);
  const { data: assetTypes, isLoading: isLoadingAssetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({ queryKey: ASSET_TYPE_QUERY_KEY });
  const { data: properties, isLoading: isLoadingProperties } = authClient.settings.assetType.getProperties.useQuery({queryKey: PROPERTIES_QUERY_KEY});
  const { mutate: addAssetTypeMutation } = authClient.settings.assetType.createAssetType.useMutation();
  const { mutate: updateAssetTypeMutation } = authClient.settings.assetType.updateAssetType.useMutation();


  const { toast } = useToast();

  const form = useForm<AssetTypeWithProperties>({
    resolver: zodResolver(AssetTypeWithPropertiesSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'properties.newProperties',
  });

  const { handleSubmit, reset, setValue, watch } = form;

  const watchSchema = watch('properties');

  const processForm = async (data: AssetTypeWithProperties) => {
    try {
      if (editingAssetType) {
        updateAssetTypeMutation({
          params: { id: editingAssetType.assetType.id },
          body: data
        });
        toast({ description: 'Asset type was updated successfully' });
        setEditingAssetType(null);
      } else {
        addAssetTypeMutation({ body: data });
        toast({ description: 'New asset type was added successfully' });
      }
      reset();
    } catch (error) {
      toast({
        description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // const handleDeleteAssetType = async (id: number) => {
  //   try {
  //     await deleteAssetTypeMutation.mutateAsync(id);
  //     toast({ description: 'Asset type was deleted' });
  //   } catch (error) {
  //     toast({
  //       description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
  //       variant: 'destructive',
  //     });
  //   }
  // };

  const cancelEdit = () => {
    setEditingAssetType(null);
    reset();
  };

  if (isLoadingAssetTypes || isLoadingProperties) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{editingAssetType ? 'Edit Asset Type' : 'Add New Asset Type'}</CardTitle>
          <CardDescription>
            {editingAssetType ? 'Update the selected asset type.' : 'Define new types of assets and their properties.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(processForm)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type Name</FormLabel>
                    <Input id="asset-type-name" placeholder="Enter asset type name" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Schema</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Select
                      value={field.propertyId.toString()}
                      onValueChange={(value) => setValue(`schema.${index}.propertyId`, Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Checkbox
                      checked={field.isRequired}
                      onCheckedChange={(checked) => setValue(`schema.${index}.isRequired`, checked as boolean)}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => remove(index)}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => append({ propertyId: 0, isRequired: false })}
                >
                  Add field
                </Button>
              </div>
              <Button type="submit" disabled={addAssetTypeMutation.isPending || updateAssetTypeMutation.isPending}>
                {addAssetTypeMutation.isPending || updateAssetTypeMutation.isPending
                  ? editingAssetType
                    ? 'Updating Asset Type...'
                    : 'Adding Asset Type...'
                  : editingAssetType
                  ? 'Update Asset Type'
                  : 'Add Asset Type'}
              </Button>
              {editingAssetType && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel Edit
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="mt-4">
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
              {assetTypes?.status === 200 ? assetTypes.body?.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>
                    {type.schema.map((schemaItem) => {
                      const property = properties?.find(p => p.id === schemaItem.propertyId);
                      return `${property?.name} (${schemaItem.isRequired ? 'Required' : 'Optional'})`;
                    }).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingAssetType(type);
                        reset(type);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      // onClick={() => handleDeleteAssetType(type.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )): <TableRow><TableCell colSpan={3}>No Asset Types Found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}