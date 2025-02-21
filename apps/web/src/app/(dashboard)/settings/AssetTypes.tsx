'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY, PROPERTIES_QUERY_KEY } from '@/lib/api/queryKeys';
import { AssetTypeWithProperties, AssetTypeWithPropertiesSchema } from '@repo/api-contract';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '@/components/extension/multi-select';

export default function AssetTypes() {
  const [editingAssetTypeId, setEditingAssetType] = useState<number>();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: assetTypes, isLoading: isLoadingAssetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({ 
    queryKey: [ASSET_TYPE_QUERY_KEY] 
  });

  const { data: properties, isLoading: isLoadingProperties } = authClient.settings.assetType.getProperties.useQuery({
    queryKey: [PROPERTIES_QUERY_KEY]
  });

  const { data: editingAssetType, isLoading: isLoadingAssetTypeWithProperties } = authClient.settings.assetType.getAssetType.useQuery({
    queryKey: [ASSET_TYPE_QUERY_KEY, editingAssetTypeId],
    enabled: !!editingAssetTypeId,
    queryData: {
      params: { id: editingAssetTypeId as number}
    }
  });

  const { mutate: addAssetTypeMutation } = authClient.settings.assetType.createAssetType.useMutation({
    onSuccess: () => {
      toast({ description: 'New asset type was added successfully' });
      reset();
      setSelectedProperties([]);
    },
    onError: (error) => {
      toast({
        description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  const { mutate: updateAssetTypeMutation } = authClient.settings.assetType.updateAssetType.useMutation({
    onSuccess: () => {
      toast({ description: 'Asset type was updated successfully' });
      setEditingAssetType(undefined);
      reset();
    },
    onError: (error) => {
      toast({
        description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  const { mutate: deleteAssetTypeMutation } = authClient.settings.assetType.deleteAssetType.useMutation({
    onSuccess: () => {
      toast({ description: 'Asset type was deleted successfully' });
    },
    onError: (error) => {
      toast({
        description: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  const form = useForm<AssetTypeWithProperties>({
    resolver: zodResolver(AssetTypeWithPropertiesSchema),
    defaultValues: {
      assetType: { name: '' },
      properties: []
    }
  });

  const { handleSubmit, reset, setValue } = form;

  useEffect(() => {
    if (editingAssetType?.status === 200) {
      reset({
        assetType: { name: editingAssetType.body.assetType.name },
        properties: editingAssetType.body.properties.map(item => item.id)
      });
      
      // Set selected properties for MultiSelect
      const selectedProps = editingAssetType.body.properties.map(item => {

        const property = properties?.status === 200 && 
          properties.body.find(p => p.id === item.id);
        return property ? property.name : '';
      }).filter(Boolean);
      
      setSelectedProperties(selectedProps);
    }
  }, [editingAssetType, properties, reset]);

  const processForm = (data: AssetTypeWithProperties) => {
    // Convert selected property names to IDs and required status
    const propertyIds = selectedProperties.map(propName => {
      const property = properties?.status === 200 && 
        properties.body.find(p => p.name === propName);
      return property ?  property.id
         : null;
    })

    const nonNullPropertyIds = propertyIds.filter(prop => prop !== null);

    const formData = {
      ...data,
      properties: nonNullPropertyIds
    };

    if (editingAssetType?.status === 200) {
      updateAssetTypeMutation({
        params: { id: editingAssetType.body.assetType.id },
        body: formData
      });
    } else {
      addAssetTypeMutation({ body: formData });
    }
  };

  const handleDeleteAssetType = (id: number) => {
    deleteAssetTypeMutation({ params: { id } });
  };

  const cancelEdit = () => {
    setEditingAssetType(undefined);
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
                name="assetType.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type Name</FormLabel>
                    <Input id="asset-type-name" placeholder="Enter asset type name" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Properties</FormLabel>
                <MultiSelector
                  values={selectedProperties}
                  onValuesChange={setSelectedProperties}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Select properties..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {properties?.status === 200 && properties.body.map((property) => (
                        <MultiSelectorItem
                          key={property.id}
                          value={property.name}
                        >
                          {property.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
                <FormMessage />
              </FormItem>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingAssetType ? 'Update Asset Type' : 'Add Asset Type'}
                </Button>
                {editingAssetType && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
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
                <TableHead>Properties</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetTypes?.status === 200 ? (
                assetTypes.body.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingAssetType(type.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAssetType(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No Asset Types Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}