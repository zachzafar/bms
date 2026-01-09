'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';

export default function Assets({ userId }: { userId: string }) {
  const tenant = StorageService.getTenant();

  const { data: assetsData, isLoading: assetsLoading, refetch } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets'],
    enabled: !!tenant,
  });

  const { mutate: updateAsset } = authClient.assets.updateAsset.useMutation();

  const assets = assetsData?.body.data ?? [];
  const ownedAssets = useMemo(() => assets.filter((a: any) => a.userId === userId), [assets, userId]);
  const unassignedAssets = useMemo(() => assets.filter((a: any) => !a.userId), [assets]);

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  if (assetsLoading) return <Loading />;

  const handleAssign = () => {
    if (!selectedAssetId) return;
    updateAsset(
      {
        params: { id: selectedAssetId },
        body: { userId },
      },
      {
        onSuccess: async () => {
          toast.success('Asset assigned');
          setOpenAssign(false);
          setSelectedAssetId('');
          await refetch();
        },
        onError: () => toast.error('Failed to assign asset'),
      }
    );
  };

  const handleUnassign = (assetId: string) => {
    updateAsset(
      {
        params: { id: assetId },
        body: { userId: null },
      },
      {
        onSuccess: async () => {
          toast.success('Asset unassigned');
          await refetch();
        },
        onError: () => toast.error('Failed to unassign asset'),
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Owned Assets</CardTitle>
          <Dialog open={openAssign} onOpenChange={setOpenAssign}>
            <DialogTrigger asChild>
              <Button size="sm">Assign Asset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Asset To Owner</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="text-sm">Select an unassigned asset</label>
                <select
                  className="border rounded px-2 py-2 w-full"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  <option value="">Choose an asset</option>
                  {unassignedAssets.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleAssign} disabled={!selectedAssetId}>
                    Assign
                  </Button>
                  <Button variant="secondary" onClick={() => setOpenAssign(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Asset ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownedAssets.length > 0 ? (
                ownedAssets.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.id}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.description ?? '-'}</TableCell>
                    <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleUnassign(a.id)}>
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No owned assets found
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