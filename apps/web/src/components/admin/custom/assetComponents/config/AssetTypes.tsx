'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/api/publicClient';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '@/components/extension/multi-select';
import { z } from 'zod';

const AssetTypeWithPropertiesSchema = z.object({
  name: z.string(),
  properties: z.array(z.number()),
  forms: z.array(z.number()),
})

type AssetTypeWithProperties = z.infer<typeof AssetTypeWithPropertiesSchema>;

export default function AssetTypes({ tenantId }: { tenantId: string }) {
  
  const [editingAssetTypeId, setEditingAssetType] = useState<number>();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const queryClient = authClient.useQueryClient();

  const { data: assetTypes, isLoading: isLoadingAssetTypes } = authClient.systemAdmin.getAssetTypes.useQuery({ 
    queryKey: ['assetTypes'],
    queryData: {
      params: { tenantId }
    }
  });

  const { data: properties, isLoading: isLoadingProperties } = authClient.systemAdmin.getProperties.useQuery({
    queryKey: ['properties'],
    queryData: {
      params: { tenantId }
    }
  });

  const { data: forms, isLoading: isLoadingForms } = authClient.systemAdmin.getForms.useQuery({
    queryKey: ['forms'],
    queryData: {
      query: {}
    }
  });

  const { data: editingAssetType } = authClient.systemAdmin.getAssetType.useQuery({
    queryKey: ['assetType', editingAssetTypeId],
    enabled: !!editingAssetTypeId,
    queryData: {
      params: { id: editingAssetTypeId as number}
    }
  });

  const { mutate: addAssetTypeMutation } = authClient.systemAdmin.createAssetType.useMutation({
    onSuccess: () => {
      toast.success('New asset type was added successfully');
      queryClient.invalidateQueries({ queryKey: ['assetTypes']});
      reset();
      setSelectedProperties([]);
      setSelectedForms([]);
    },
    onError: (error) => {
      toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: updateAssetTypeMutation } = authClient.systemAdmin.updateAssetType.useMutation({
    onSuccess: () => {
      toast.success('Asset type was updated successfully');
      setEditingAssetType(undefined);
      queryClient.invalidateQueries({ queryKey: ['assetTypes']});
      reset();
    },
    onError: (error) => {
      toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: deleteAssetTypeMutation } = authClient.systemAdmin.deleteAssetType.useMutation({
    onSuccess: () => {
      toast.success('Asset type was deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['assetTypes']});
    },
    onError: (error) => {
      toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const form = useForm<AssetTypeWithProperties>({
    resolver: zodResolver(AssetTypeWithPropertiesSchema),
    defaultValues: {
       name: '' ,
      properties: [],
      forms: []
    }
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (editingAssetType?.status === 200) {
      reset({
        name: editingAssetType.body.assetType.name,
        properties: editingAssetType.body.properties.map(item => item.id),
        forms: editingAssetType.body.forms.map(item => item.id)
      });

      // Set selected properties for MultiSelect
      const selectedProps = editingAssetType.body.properties.map(item => {

        const property = properties?.status === 200 &&
          properties.body.data.find(p => p.id === item.id);
        return property ? property.name : '';
      }).filter(Boolean);

      setSelectedProperties(selectedProps);

      // Set selected forms for MultiSelect
      const selectedFormItems = editingAssetType.body.forms.map(item => {
        const form = forms?.status === 200 &&
          forms.body.data.find(f => f.id === item.id);
        return form ? form.name : '';
      }).filter(Boolean);

      setSelectedForms(selectedFormItems);
    }
  }, [editingAssetType, properties, forms, reset]);

  const processForm = (data: AssetTypeWithProperties) => {
    // Convert selected property names to IDs
    const propertyIds = selectedProperties.map(propName => {
      const property = properties?.status === 200 &&
        properties.body.data.find(p => p.name === propName);
      return property ?  property.id
         : null;
    })

    const nonNullPropertyIds = propertyIds.filter(prop => prop !== null);

    // Convert selected form names to IDs
    const formIds = selectedForms.map(formName => {
      const form = forms?.status === 200 &&
        forms.body.data.find(f => f.name === formName);
      return form ? form.id : null;
    })

    const nonNullFormIds = formIds.filter(formId => formId !== null);

    const formData = {
      ...data,
      properties: nonNullPropertyIds,
      forms: nonNullFormIds
    };

    if (editingAssetType?.status === 200) {
      updateAssetTypeMutation({
        params: { id: editingAssetType.body.assetType.id },
        body: {...formData, assetType: { name: formData.name}}
      });
    } else {
      addAssetTypeMutation({ body: { assetType: { name:formData.name, tenantId }, properties: formData.properties as number[], forms: formData.forms as number[] }});
    }
  };

  const handleDeleteAssetType = (id: number) => {
    deleteAssetTypeMutation({
      params: { id },
      body: undefined
    });
  };

  const cancelEdit = () => {
    setEditingAssetType(undefined);
    reset();
    setSelectedProperties([]);
    setSelectedForms([]);
  };

  if (isLoadingAssetTypes || isLoadingProperties || isLoadingForms) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>{editingAssetType ? 'Edit Asset Type' : 'Add New Asset Type'}</CardTitle>
          <CardDescription>
            {editingAssetType ? 'Update the selected asset type.' : 'Define new types of assets and their fields.'}
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
                    <FormControl>
                      <Input id="asset-type-name" placeholder="Enter asset type name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Fields</Label>
                <MultiSelector
                  values={selectedProperties}
                  onValuesChange={setSelectedProperties}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Select Fields..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {properties?.status === 200 && properties.body.data.map((property) => (
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
              </div>
              <div className="space-y-2">
                <Label>Forms</Label>
                <MultiSelector
                  values={selectedForms}
                  onValuesChange={setSelectedForms}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Select Forms..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {forms?.status === 200 && forms.body.data.map((form) => (
                        <MultiSelectorItem
                          key={form.id}
                          value={form.name}
                        >
                          {form.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>
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
                <TableHead>Fields</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetTypes?.status === 200 ? (
                assetTypes.body.data.map((type) => (
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
    </div>
  );
}