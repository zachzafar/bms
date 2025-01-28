'use client';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY, GROUPS_QUERY_KEY } from '@/lib/api/queryKeys';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@radix-ui/react-select';
import { InsertAsset, InsertAssetSchema } from '@repo/api-contract';

import React, { useEffect, useState } from 'react';
import { Controller, Form, SubmitHandler, useForm, useFormState } from 'react-hook-form';

function AddAssetForm() {
  const { mutate, isPending } = authClient.assets.createAsset.useMutation();
  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({ queryKey: ASSET_TYPE_QUERY_KEY});
  const { data: assetGroups } = authClient.settings.group.getGroups.useQuery({ queryKey: GROUPS_QUERY_KEY});


  const form = useForm<InsertAsset>({
    resolver: zodResolver(InsertAssetSchema),
  });

  const { handleSubmit, control } = form;
  const { isSubmitting } = useFormState({ control });

  const processform: SubmitHandler<InsertAsset> = async (data: InsertAsset) => {
      mutate({
        body: data,
      },{
          onSuccess: (response) => {
              console.log('response', response);
          }
      })
  };

 
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(processform)} className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="asset-name">Asset Name</FormLabel>
              <Input id="asset-name" placeholder="Enter asset name" {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="assetTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="asset-type">Asset Type</FormLabel>
              <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                <SelectTrigger id="asset-type">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes?.status === 200 ? assetTypes.body.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  )): <SelectItem value="No Asset Types Found">No Asset Types Found</SelectItem>}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

       
          <FormField
            control={control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="asset-subgroup">Subgroup</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <SelectTrigger id="asset-subgroup">
                    <SelectValue placeholder="Select subgroup" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetGroups?.status === 200 ?  assetGroups.body.map((group) => (
                      <SelectItem key={group.id} value={group.id?.toString()}>
                        {group.name}
                      </SelectItem>)): <SelectItem value="No Subgroups Found">No Subgroups Found</SelectItem>}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
       

        <FormField
          control={control}
          name="available"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="asset-status">Status</FormLabel>
              <Controller
                name="available"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="asset-status"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}/>
                </FormItem>
          )}
        />

        <FormField
          control={control}
          name="requiresApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2">
              <FormLabel htmlFor="requires-approval">Requires Approval</FormLabel>
              <Controller
                name="requiresApproval"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="requires-approval"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding Asset...' : 'Add Asset'}
        </Button>
      </form>
    </Form>
  );
}

export default AddAssetForm;
