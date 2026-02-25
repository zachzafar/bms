'use client';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, Form, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TAGS_QUERY_KEY, ASSET_TYPE_QUERY_KEY } from '@/lib/api/queryKeys';
import { StorageService } from '@/lib/api/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '@/components/extension/multi-select';
import { useState } from 'react';
import { QuickCreateAssetType } from '@/components/custom/QuickCreate';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

const ModifiedInsertAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  assetTypeId: z.coerce.number().min((1), 'Asset type is required'),
  forms: z.array(z.number()).optional(),
});

type ModifiedInsertAsset = z.infer<typeof ModifiedInsertAssetSchema>;

function AddAssetForm() {
  const tenant = StorageService.getTenant();
  const router = useRouter();
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { mutate, isPending } = authClient.assets.createAsset.useMutation();
  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({ queryKey: ASSET_TYPE_QUERY_KEY });
  const { data: bookingForms } = authClient.settings.form.getForms.useQuery({ queryKey: ['bookingForms'] });
  const { data: tagsData } = authClient.settings.tags.getTags.useQuery({ queryKey: ASSET_TAGS_QUERY_KEY });

  const form = useForm<ModifiedInsertAsset>({
    resolver: zodResolver(ModifiedInsertAssetSchema),
    defaultValues: {
      forms: []
    }
  });

  const processform: SubmitHandler<ModifiedInsertAsset> = async (data) => {
  if (tenant) {
    // Convert selected form names to IDs
    const formIds = selectedForms.map(formName => {
      const form = bookingForms?.status === 200 &&
        bookingForms.body.data.find(f => f.name === formName);
      return form ? form.id : null;
    });

    const nonNullFormIds = formIds.filter(formId => formId !== null);

    const tagIds = selectedTags.map(tagName => {
      const tag = tagsData?.status === 200 && tagsData.body.data.find(t => t.name === tagName);
      return tag ? tag.id : null;
    }).filter(id => id !== null) as number[];

    mutate({
      body: {
        asset: {
          ...data,
          requiresApproval: false,
          assetTypeId: Number(data.assetTypeId),
        },
        tenant: tenant.id,
        formIds: nonNullFormIds as number[],
        tagIds,
      }
    }, {
      onSuccess: (response) => {
        toast.success('Asset added successfully');
        router.push(`assets/${response.body.id}`);
        form.reset();
        setSelectedForms([]);
        setSelectedTags([]);
      },
      onError: (error) => {
        console.error('Error adding asset:', error);
      }
    });
  }
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
              <Select onValueChange={(value) => field.onChange((value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger id="asset-type">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetTypes?.status === 200 && assetTypes.body.data.length > 0 ? assetTypes.body.data.map((type) => (
                    <SelectItem key={type.name} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  )) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">No asset types found</div>
                  )}
                </SelectContent>
              </Select>
              <QuickCreateAssetType />
              <FormDescription>
                Set the way your asset should be described
              </FormDescription>
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
              <FormDescription>Select booking forms for this asset</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <MultiSelector values={selectedTags} onValuesChange={setSelectedTags}>
            <MultiSelectorTrigger>
              <MultiSelectorInput placeholder="Select tags..." />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList>
                {tagsData?.status === 200 && tagsData.body.data.map((tag) => (
                  <MultiSelectorItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        </div>

        <Button type="submit" disabled={isPending || tenant == null}>
          {isPending ? 'Adding Asset...' : 'Add Asset'}
        </Button>
      </form>
    </Form>
  );
}

export default AddAssetForm;
