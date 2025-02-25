'use client';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel,Form, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY } from '@/lib/api/queryKeys';
import { useSession } from '@/lib/api/useSession';

import { zodResolver } from '@hookform/resolvers/zod';

import { InsertAsset, InsertAssetSchema } from '@repo/api-contract';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

const ModifiedInsertAssetSchema = InsertAssetSchema.omit({ requiresApproval: true, tenantId: true });
type ModifiedInsertAsset = z.infer<typeof ModifiedInsertAssetSchema>;

function AddAssetForm() {
  const {session} = useSession()
  const router = useRouter();
  const { mutate, isPending } = authClient.assets.createAsset.useMutation();
  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({ queryKey: ASSET_TYPE_QUERY_KEY});


  const form = useForm<ModifiedInsertAsset>({
    resolver: zodResolver(ModifiedInsertAssetSchema)
  });
  
  const { isSubmitting } = useFormState({ control: form.control });

  const processform: SubmitHandler<ModifiedInsertAsset> = async (data: ModifiedInsertAsset) => {
    if (session)
      mutate({
        body: { asset: { requiresApproval: false,...data}, tenant: session?.tenants[0]}
      },{
          onSuccess: (response) => {
              console.log('response', response);
              router.push(`/assets/${response.body.id}`)
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
        <Button type="submit" disabled={isPending || session == undefined}>
          {isPending ? 'Adding Asset...' : 'Add Asset'}
        </Button>
      </form>
    </Form>
  );
}

export default AddAssetForm;
