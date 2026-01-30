'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pencil, Trash2, Upload, ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authClient, axiosClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY, PROPERTIES_QUERY_KEY } from '@/lib/api/queryKeys';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '@/components/extension/multi-select';
import { z } from 'zod';
import { StorageService } from '@/lib/api/storage';
import Image from 'next/image';

const AssetTypeWithPropertiesSchema = z.object({
  name: z.string(),
  properties: z.array(z.number()),
  forms: z.array(z.number()),
  tags: z.array(z.number())
})

type AssetTypeWithProperties = z.infer<typeof AssetTypeWithPropertiesSchema>;

export default function AssetTypes() {
  const tenant = StorageService.getTenant();
  const [editingAssetTypeId, setEditingAssetType] = useState<number>();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = authClient.useQueryClient();

  const { data: tags, isLoading } = authClient.settings.tags.getTags.useQuery({
      queryKey: ['tags']
    });

  const { data: assetTypes, isLoading: isLoadingAssetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: [ASSET_TYPE_QUERY_KEY]
  });

  const { data: properties, isLoading: isLoadingProperties } = authClient.settings.assetType.getProperties.useQuery({
    queryKey: [PROPERTIES_QUERY_KEY]
  });

  const { data: bookingForms, isLoading: isLoadingForms } = authClient.settings.form.getForms.useQuery({
    queryKey: ['bookingForms']
  });

  const { data: editingAssetType } = authClient.settings.assetType.getAssetType.useQuery({
    queryKey: [ASSET_TYPE_QUERY_KEY, editingAssetTypeId],
    enabled: !!editingAssetTypeId,
    queryData: {
      params: { id: editingAssetTypeId as number}
    }
  });

  const { mutate: addAssetTypeMutation } = authClient.settings.assetType.createAssetType.useMutation({
    onSuccess: () => {
      toast.success('New asset type was added successfully');
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPE_QUERY_KEY] });
      reset();
      setSelectedProperties([]);
      setSelectedForms([]);
      setSelectedTags([]);
    },
    onError: (error) => {
      toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: updateAssetTypeMutation } = authClient.settings.assetType.updateAssetType.useMutation({
    onSuccess: () => {
      toast.success('Asset type was updated successfully');
      setEditingAssetType(undefined);
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPE_QUERY_KEY] });
      reset();
      setSelectedProperties([]);
      setSelectedForms([]);
      setSelectedTags([]);
    },
    onError: (error) => {
      toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const { mutate: deleteAssetTypeMutation } = authClient.settings.assetType.deleteAssetType.useMutation({
    onSuccess: () => {
      toast.success('Asset type was deleted successfully');
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPE_QUERY_KEY] });
    },
    onError: (error) => {
      toast(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const form = useForm<AssetTypeWithProperties>({
    resolver: zodResolver(AssetTypeWithPropertiesSchema),
    defaultValues: {
      name: '',
      properties: [],
      forms: [],
      tags: [],
    }
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (editingAssetType?.status === 200) {
      reset({
        name: editingAssetType.body.assetType.name,
        properties: editingAssetType.body.properties.map(item => item.id),
        forms: editingAssetType.body.forms?.map(item => item.id) || [],
        tags: editingAssetType.body.tags?.map(item => item.id) || []
      });

      // Set selected properties for MultiSelect
      const selectedProps = editingAssetType.body.properties.map(item => {
        const property = properties?.status === 200 &&
          properties.body.data.find(p => p.id === item.id);
        return property ? property.name : '';
      }).filter(Boolean);

      setSelectedProperties(selectedProps);

      // Set selected forms for MultiSelect
      const selectedFormNames = (editingAssetType.body.forms || []).map(item => {
        const form = bookingForms?.status === 200 &&
          bookingForms.body.data.find(f => f.id === item.id);
        return form ? form.name : '';
      }).filter(Boolean);

      setSelectedForms(selectedFormNames);

      // Set selected tags for MultiSelect
      const selectedTagNames = (editingAssetType.body.tags || []).map(item => {
        const tag = tags?.status === 200 &&
          tags.body.data.find(t => t.id === item.id);
        return tag ? tag.name : '';
      }).filter(Boolean);

      setSelectedTags(selectedTagNames);
    }
  }, [editingAssetType, properties, bookingForms, tags, reset]);

  const processForm = (data: AssetTypeWithProperties) => {
    // Convert selected property names to IDs
    const propertyIds = selectedProperties.map(propName => {
      const property = properties?.status === 200 &&
        properties.body.data.find(p => p.name === propName);
      return property ? property.id : null;
    })

    const nonNullPropertyIds = propertyIds.filter(prop => prop !== null);

    // Convert selected form names to IDs
    const formIds = selectedForms.map(formName => {
      const form = bookingForms?.status === 200 &&
        bookingForms.body.data.find(f => f.name === formName);
      return form ? form.id : null;
    })

    const nonNullFormIds = formIds.filter(formId => formId !== null);

    // Convert selected tag names to IDs
    const tagIds = selectedTags.map(tagName => {
      const tag = tags?.status === 200 &&
        tags.body.data.find(t => t.name === tagName);
      return tag ? tag.id : null;
    })

    const nonNullTagIds = tagIds.filter(tagId => tagId !== null);

    if (editingAssetType?.status === 200) {
      updateAssetTypeMutation({
        params: { id: editingAssetType.body.assetType.id },
        body: {
          assetType: { name: data.name },
          properties: nonNullPropertyIds as number[],
          forms: nonNullFormIds as number[],
          tagIds: nonNullTagIds as number[]
        }
      });
    } else {
      addAssetTypeMutation({
        body: {
          assetType: { name: data.name, tenantId: tenant?.id as string },
          properties: nonNullPropertyIds as number[],
          forms: nonNullFormIds as number[],
          tagIds: nonNullTagIds as number[]
        }
      });
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
    setSelectedTags([]);
  };

  const handleImageUpload = async (assetTypeId: number, file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await axiosClient.post(`/asset-type/${assetTypeId}/image`, formData);
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPE_QUERY_KEY] });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
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
                    <Input id="asset-type-name" placeholder="Enter asset type name" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="properties"
                render={() => (
                  <FormItem>
                    <FormLabel>Fields</FormLabel>

                    <MultiSelector
                      values={selectedProperties}
                      onValuesChange={setSelectedProperties}
                    >
                      <MultiSelectorTrigger>
                        <MultiSelectorInput placeholder="Select Fields..." />
                      </MultiSelectorTrigger>
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {properties?.status === 200 &&
                            properties.body.data.map((property) => (
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
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>

                    <MultiSelector
                      values={selectedTags}
                      onValuesChange={setSelectedTags}
                    >
                      <MultiSelectorTrigger>
                        <MultiSelectorInput placeholder="Select Tags..." />
                      </MultiSelectorTrigger>
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {tags?.status === 200 &&
                            tags.body.data.map((tag) => (
                              <MultiSelectorItem
                                key={tag.id}
                                value={tag.name}
                              >
                                {tag.name}
                              </MultiSelectorItem>
                            ))}
                        </MultiSelectorList>
                      </MultiSelectorContent>
                    </MultiSelector>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="forms"
                render={() => (
                  <FormItem>
                    <FormLabel>Booking Forms</FormLabel>

                    <MultiSelector
                      values={selectedForms}
                      onValuesChange={setSelectedForms}
                    >
                      <MultiSelectorTrigger>
                        <MultiSelectorInput placeholder="Select Booking Forms..." />
                      </MultiSelectorTrigger>
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {bookingForms?.status === 200 &&
                            bookingForms.body.data.map((form) => (
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

                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetTypes?.status === 200 ? (
                assetTypes.body.data.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      {type.image ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={type.image}
                            alt={type.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleImageUpload(type.id, file);
                            };
                            input.click();
                          }}
                          disabled={isUploading}
                          title="Upload Image"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAssetType(type.id)}
                          title="Edit Asset Type"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssetType(type.id)}
                          title="Delete Asset Type"
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