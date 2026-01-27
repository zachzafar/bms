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

function BasicInfo({ asset, refetch }: { asset: SelectAsset; refetch: () => void }) {
  const [name, setName] = useState(asset.name ?? '');
  const [assetTypeId, setAssetTypeId] = useState<number | undefined>(asset.assetTypeId ?? undefined);
  const [tagId, setTagId] = useState<number | undefined>(undefined);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial values for comparison
  const [initialValues, setInitialValues] = useState({
    name: asset.name ?? '',
    assetTypeId: asset.assetTypeId ?? undefined,
    tagId: undefined as number | undefined,
    forms: [] as string[]
  });

  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetType'],
  });

  const { data: assetTags } = authClient.settings.tags.getTags.useQuery({
    queryKey: ['tags']
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
        assetTypeId,
        tagId,
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
    setAssetTypeId(asset.assetTypeId ?? undefined);

    setInitialValues({
      name: asset.name ?? '',
      assetTypeId: asset.assetTypeId ?? undefined,
      tagId: undefined,
      forms: []
    });
  }, [asset]);

  const hasChanges = () => {
    return (
      name !== initialValues.name ||
      assetTypeId !== initialValues.assetTypeId ||
      tagId !== initialValues.tagId ||
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
          assetTypeId: assetTypeId ? Number(assetTypeId) : undefined,
          tagIds: tagId ? [tagId] : undefined,
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
              {assetTypes?.status === 200 ? (
                assetTypes.body.data.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-types">No Asset Types Found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tag">Tag</Label>
          <Select
            value={tagId?.toString()}
            onValueChange={(value) => setTagId(Number(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger id="tag">
              <SelectValue placeholder="Select tag" />
            </SelectTrigger>
            <SelectContent>
              {assetTags?.status === 200 ? (
                assetTags.body.data.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-tags">No Tags Found</SelectItem>
              )}
            </SelectContent>
          </Select>
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
        </div>

        {hasChanges() && (
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
