'use client';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel,Form, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY, FORMS_QUERY_KEY } from '@/lib/api/queryKeys';
import { useSession } from '@/lib/api/useSession';

import { zodResolver } from '@hookform/resolvers/zod';

import { InsertAsset, InsertAssetSchema } from '@repo/api-contract';

import { Controller, SubmitHandler, useForm, useFormState } from 'react-hook-form';

function AddAssetForm() {
  const {session} = useSession()
  const { mutate, isPending } = authClient.assets.createAsset.useMutation();
  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({ queryKey: ASSET_TYPE_QUERY_KEY});
  const { data: bookingForms } = authClient.settings.form.getForms.useQuery({ queryKey: FORMS_QUERY_KEY });


  const form = useForm<InsertAsset>({
    resolver: zodResolver(InsertAssetSchema),
  });
  
  const { isSubmitting } = useFormState({ control: form.control });

  const processform: SubmitHandler<InsertAsset> = async (data: Omit<InsertAsset,"tenantId">) => {
    if (session)
      mutate({
        body: { asset: data, tenant: session?.tenants[0]}
      },{
          onSuccess: (response) => {
              console.log('response', response);
          }
      })
      
  };

 
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processform)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="asset-name">Asset Name</FormLabel>
              <Input id="asset-name" placeholder="Enter asset name" {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assetTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="asset-type">Asset Type</FormLabel>
              <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                <FormControl>
                <SelectTrigger id="asset-type">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetTypes?.status === 200 ? assetTypes.body.map((type) => (
                    <SelectItem key={type.name} value={type.id?.toString()}>
                      {type.name}
                    </SelectItem>
                  )): <SelectItem value="No Asset Types Found">No Asset Types Found</SelectItem>}
                </SelectContent>
              </Select>
              <FormDescription>
                Set the way your asset should be described
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

       
          {/* <FormField
            control={form.control}
            name="bookingFormId"
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
          /> */}
       

        <FormField
          control={form.control}
          name="requiresApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2">
              <FormLabel htmlFor="requires-approval">Requires Approval</FormLabel>
              <Controller
                name="requiresApproval"
                control={form.control}
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

        <Button type="submit" disabled={isPending || session == undefined}>
          {isPending ? 'Adding Asset...' : 'Add Asset'}
        </Button>
      </form>
    </Form>
  );
}

export default AddAssetForm;
