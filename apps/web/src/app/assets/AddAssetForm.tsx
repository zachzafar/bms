'use client';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AssetSchema, AssetSchemaInputs } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@radix-ui/react-select';

import React, { useEffect, useState } from 'react';
import { Form, SubmitHandler, useForm, useFormState } from 'react-hook-form';

function AddAssetForm() {
  const form = useForm<AssetSchemaInputs>({
    resolver: zodResolver(AssetSchema),
  });

  const { handleSubmit, control } = form;
  const { isSubmitting } = useFormState({ control });

  const processform: SubmitHandler<AssetSchemaInputs> = async (data) => {};

  // AI code

  const [assetTypes, setAssetTypes] = useState([
    { id: 1, name: 'Car', subgroups: ['Sedan', 'SUV', 'Sports Car'] },
    {
      id: 2,
      name: 'Property',
      subgroups: ['Apartment', 'House', 'Beachfront'],
    },
    { id: 3, name: 'Equipment', subgroups: ['Photography', 'Audio', 'Video'] },
  ]);

  const [newAsset, setNewAsset] = useState({
    name: '',
    type: '',
    subgroup: '',
    status: 'Available',
    requiresApproval: false,
  });

  const [selectedAssetType, setSelectedAssetType] = useState(null);

  useEffect(() => {
    if (selectedAssetType) {
      setNewAsset((prev) => ({ ...prev, subgroup: '' }));
    }
  }, [selectedAssetType]);

  const handleAddAsset = (e) => {
    e.preventDefault();
    const id = assets.length + 1;
    setAssets([...assets, { id, ...newAsset }]);
    setNewAsset({
      name: '',
      type: '',
      subgroup: '',
      status: 'Available',
      requiresApproval: false,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(processform)} className='space-y-4'>
        <div className='space-y-2'>
          <FormField
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='asset-name'>Asset Name</FormLabel>
                <Input
                  id='asset-name'
                  placeholder='Enter asset name'
                  {...field}
                />
              </FormItem>
            )}
            name={'name'}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='asset-type'>Asset Type</Label>
          <Select
            value={newAsset.type}
            onValueChange={(value) => {
              setNewAsset({ ...newAsset, type: value, subgroup: '' });
              setSelectedAssetType(
                assetTypes.find((type) => type.name === value)
              );
            }}
          >
            <SelectTrigger id='asset-type'>
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
        {selectedAssetType && (
          <div className='space-y-2'>
            <Label htmlFor='asset-subgroup'>Subgroup</Label>
            <Select
              value={newAsset.subgroup}
              onValueChange={(value) =>
                setNewAsset({ ...newAsset, subgroup: value })
              }
            >
              <SelectTrigger id='asset-subgroup'>
                <SelectValue placeholder='Select subgroup' />
              </SelectTrigger>
              <SelectContent>
                {selectedAssetType.subgroups.map((subgroup) => (
                  <SelectItem key={subgroup} value={subgroup}>
                    {subgroup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className='space-y-2'>
          <Label htmlFor='asset-status'>Status</Label>
          <Select
            value={newAsset.status}
            onValueChange={(value) =>
              setNewAsset({ ...newAsset, status: value })
            }
          >
            <SelectTrigger id='asset-status'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Available'>Available</SelectItem>
              <SelectItem value='In Use'>In Use</SelectItem>
              <SelectItem value='Maintenance'>Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center space-x-2'>
          <Switch
            id='requires-approval'
            checked={newAsset.requiresApproval}
            onCheckedChange={(checked) =>
              setNewAsset({ ...newAsset, requiresApproval: checked })
            }
          />
          <Label htmlFor='requires-approval'>Requires Approval</Label>
        </div>
        <Button type='submit'>Add Asset</Button>
      </form>
    </Form>
  );
}

export default AddAssetForm;
