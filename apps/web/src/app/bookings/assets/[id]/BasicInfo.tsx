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

type AssetWithForms = SelectAsset & {
  bookingForms: { id: number; name: string }[];
};

function BasicInfo({ asset, refetch }: { asset: AssetWithForms; refetch: () => void }) {
  const [name, setName] = useState(asset.name ?? '');
  const [assetTypeId, setAssetTypeId] = useState<number>(asset.assetTypeId);
  const [selectedForms, setSelectedForms] = useState<string[]>(
    asset.bookingForms?.map((f) => f.name) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial values for comparison
  const [initialValues, setInitialValues] = useState({
    name: asset.name ?? '',
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
    setAssetTypeId(asset.assetTypeId ?? undefined);

    const formNames = asset.bookingForms?.map((f) => f.name) ?? [];
    setSelectedForms(formNames);

    setInitialValues({
      name: asset.name ?? '',
      assetTypeId: asset.assetTypeId ?? undefined,
      forms: formNames
    });
  }, [asset]);

  const hasChanges = () => {
    return (
      name !== initialValues.name ||
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
