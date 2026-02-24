'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '@/components/extension/multi-select';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { SelectAsset } from '@repo/api-contract';
import { QuickCreateAssetType } from '@/components/custom/QuickCreate';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type AssetWithForms = SelectAsset & {
  bookingForms: { id: number; name: string }[];
};

function BasicInfo({ asset, refetch }: { asset: AssetWithForms; refetch: () => void }) {
  const [name, setName] = useState(asset.name ?? '');
  const [slug, setSlug] = useState(asset.slug ?? '');
  const [debouncedSlug, setDebouncedSlug] = useState(asset.slug ?? '');
  const [assetTypeId, setAssetTypeId] = useState<number>(asset.assetTypeId);
  const [selectedForms, setSelectedForms] = useState<string[]>(
    asset.bookingForms?.map((f) => f.name) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial values for comparison
  const [initialValues, setInitialValues] = useState({
    name: asset.name ?? '',
    slug: asset.slug ?? '',
    assetTypeId: asset.assetTypeId,
    forms: asset.bookingForms?.map((f) => f.name) ?? []
  });

  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetType'],
  });

  const { data: bookingForms } = authClient.settings.form.getForms.useQuery({
    queryKey: ['bookingForms']
  });

  const { mutate: updateAsset } = authClient.assets.updateAsset.useMutation({
    onSuccess: async () => {
      toast.success('Asset updated successfully');
      await refetch();
      // Update initial values
      const formNames = selectedForms;
      setInitialValues({
        name,
        slug,
        assetTypeId,
        forms: formNames
      });
      setIsSubmitting(false);
    },
    onError: () => {
      toast.error('Failed to update asset');
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    setName(asset.name ?? '');
    setSlug(asset.slug ?? '');
    setDebouncedSlug(asset.slug ?? '');
    setAssetTypeId(asset.assetTypeId ?? undefined);

    const formNames = asset.bookingForms?.map((f) => f.name) ?? [];
    setSelectedForms(formNames);

    setInitialValues({
      name: asset.name ?? '',
      slug: asset.slug ?? '',
      assetTypeId: asset.assetTypeId ?? undefined,
      forms: formNames
    });
  }, [asset]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(slug), 500);
    return () => clearTimeout(timer);
  }, [slug]);

  const { data: slugCheck, isLoading: isCheckingSlugRaw } = authClient.assets.checkAssetSlug.useQuery({
    queryKey: ['asset-slug-check', debouncedSlug, asset.id],
    queryData: { query: { slug: debouncedSlug, excludeId: asset.id } },
    enabled: !!debouncedSlug,
  });

  const isCheckingSlug = slug !== debouncedSlug || (!!debouncedSlug && isCheckingSlugRaw);
  const slugTaken = !!debouncedSlug && !isCheckingSlug && slugCheck?.status === 200 && !slugCheck.body.available;

  const hasChanges = () => {
    return (
      name !== initialValues.name ||
      slug !== initialValues.slug ||
      assetTypeId !== initialValues.assetTypeId ||
      JSON.stringify(selectedForms) !== JSON.stringify(initialValues.forms)
    );
  };

  const handleSave = () => {
    if (hasChanges()) {
      setIsSubmitting(true);

      // Convert selected form names to IDs
      const formIds = selectedForms.map(formName => {
        const form = bookingForms?.status === 200 &&
          bookingForms.body.data.find(f => f.name === formName);
        return form ? form.id : null;
      }).filter(id => id !== null) as number[];

      updateAsset({
        params: { id: asset.id },
        body: {
          name,
          slug: slug || undefined,
          assetTypeId: assetTypeId ? Number(assetTypeId) : undefined,
          formIds: formIds.length > 0 ? formIds : undefined
        },
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Edit the basic details of your asset.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Asset Name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <div className="relative">
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. beach-villa-1"
              disabled={isSubmitting}
              className={slugTaken ? 'border-destructive pr-9' : slug && !isCheckingSlug ? 'pr-9' : ''}
            />
            {slug && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingSlug ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : slugTaken ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </span>
            )}
          </div>
          {slugTaken ? (
            <p className="text-xs text-destructive">This slug is already in use.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Used in public URLs instead of the asset ID. Only lowercase letters, numbers, and hyphens.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetType">Asset Type</Label>
          <Select
            value={assetTypeId?.toString()}
            onValueChange={(value) => setAssetTypeId(Number(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger id="assetType">
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes?.status === 200 && assetTypes.body.data.length > 0 ? (
                assetTypes.body.data.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">No asset types found</div>
              )}
            </SelectContent>
          </Select>
          <QuickCreateAssetType />
        </div>

        <div className="space-y-2">
          <Label>Booking Forms</Label>
          <MultiSelector
            values={selectedForms}
            onValuesChange={setSelectedForms}
            // disabled={isSubmitting}
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
          {/* <Link href="/bookings/settings/forms" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            <PlusCircle className="h-3 w-3" />
            Create Booking Form
          </Link> */}
        </div>

        {hasChanges() && (
          <Button onClick={handleSave} disabled={isSubmitting || isCheckingSlug || slugTaken}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
