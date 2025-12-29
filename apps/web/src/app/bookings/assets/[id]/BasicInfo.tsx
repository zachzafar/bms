'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { SelectAsset } from '@repo/api-contract';

function BasicInfo({ asset, refetch }: { asset: SelectAsset; refetch: () => void }) {
  const [name, setName] = useState(asset.name ?? '');
  const [initialName, setInitialName] = useState(asset.name ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: assetTypes } = authClient.settings.assetType.getAssetTypes.useQuery({
  queryKey: ['assetType'],
});

const assetTypeMap: Record<number, string | undefined> =
  assetTypes?.body?.reduce((acc, type) => {
    acc[type.id] = type.name;
    return acc;
  }, {} as Record<number, string | undefined>) ?? {};


  const { mutate: updateAssetName } = authClient.assets.updateAsset.useMutation({
    onSuccess: async () => {
      toast.success('Asset name updated');
      await refetch();
      setInitialName(name); // update initial name so we know it's saved
      setIsSubmitting(false)
    },
    onError: () => {
      toast.error('Failed to update asset name');
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    setName(asset.name ?? '');
    setInitialName(asset.name ?? '');
  }, [asset.name]);

  const handleSave = () => {
    if (name !== initialName) {
      setIsSubmitting(true);
      updateAssetName({
        params: { id: asset.id },
        body: { name },
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
          <Label htmlFor="type">Asset Type</Label>
          <Input
            id="type"
            name="type"
            value={assetTypeMap[asset.assetTypeId!] ?? "Unknown"}
            readOnly
          />
        </div>
        {name !== initialName && (
          <Button onClick={handleSave} disabled={isSubmitting}>
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
