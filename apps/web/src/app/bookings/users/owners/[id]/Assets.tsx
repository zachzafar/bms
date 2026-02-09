'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Assets({ ownerId }: { ownerId: number }) {
  const tenant = StorageService.getTenant();

  // Fetch owner's assigned assets
  const { data: ownerAssetsData, isLoading: ownerAssetsLoading, refetch: refetchOwnerAssets } = authClient.owners.getOwnerAssetsAdmin.useQuery({
    queryKey: ['ownerAssets', ownerId],
    queryData: {
      params: { id: ownerId },
      query: { pageSize: 100 },
    },
    enabled: !!tenant,
  });

  // Fetch all assets for the assign dialog
  const { data: allAssetsData, isLoading: allAssetsLoading, refetch: refetchAllAssets } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets'],
    enabled: !!tenant,
  });

  const { mutate: assignAsset, isPending: isAssigning } = authClient.owners.assignAsset.useMutation();
  const { mutate: unassignAsset } = authClient.owners.unassignAsset.useMutation();

  const ownedAssets = ownerAssetsData?.body.data ?? [];
  const ownedAssetIds = useMemo(() => new Set(ownedAssets.map((a: any) => a.id)), [ownedAssets]);
  const allAssets = allAssetsData?.body.data ?? [];
  const assignableAssets = useMemo(() => allAssets.filter((a: any) => !ownedAssetIds.has(a.id)), [allAssets, ownedAssetIds]);

  const [openAssign, setOpenAssign] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  const selectedAsset = useMemo(
    () => assignableAssets.find((a: any) => a.id === selectedAssetId),
    [assignableAssets, selectedAssetId]
  );

  if (ownerAssetsLoading || allAssetsLoading) return <Loading />;

  const handleAssign = () => {
    if (!selectedAssetId) return;
    assignAsset(
      {
        params: { id: ownerId },
        body: { assetId: selectedAssetId },
      },
      {
        onSuccess: async () => {
          toast.success('Asset assigned');
          setOpenAssign(false);
          setSelectedAssetId('');
          await refetchOwnerAssets();
          await refetchAllAssets();
        },
        onError: () => toast.error('Failed to assign asset'),
      }
    );
  };

  const handleUnassign = (assetId: string) => {
    unassignAsset(
      {
        params: { id: ownerId, assetId },
      },
      {
        onSuccess: async () => {
          toast.success('Asset unassigned');
          await refetchOwnerAssets();
          await refetchAllAssets();
        },
        onError: () => toast.error('Failed to unassign asset'),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Owned Assets</CardTitle>
        <Dialog open={openAssign} onOpenChange={(open) => {
          setOpenAssign(open);
          if (!open) setSelectedAssetId('');
        }}>
          <DialogTrigger asChild>
            <Button size="sm">Assign Asset</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Asset To Owner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search and select an asset</label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      {selectedAsset ? (
                        <span className="truncate">{selectedAsset.name}</span>
                      ) : (
                        <span className="text-muted-foreground">Search assets...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name or ID..." />
                      <CommandList>
                        <CommandEmpty>No assets found.</CommandEmpty>
                        <CommandGroup>
                          {assignableAssets.map((asset: any) => (
                            <CommandItem
                              key={asset.id}
                              value={`${asset.name} ${asset.id}`}
                              onSelect={() => {
                                setSelectedAssetId(asset.id === selectedAssetId ? '' : asset.id);
                                setOpenCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedAssetId === asset.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate font-medium">{asset.name}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  ID: {asset.id}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedAsset && (
                <div className="rounded-md border p-3 bg-muted/50">
                  <div className="text-sm">
                    <p><strong>Name:</strong> {selectedAsset.name}</p>
                    <p><strong>ID:</strong> {selectedAsset.id}</p>
                    {selectedAsset.description && (
                      <p><strong>Description:</strong> {selectedAsset.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpenAssign(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssign} disabled={!selectedAssetId || isAssigning}>
                  {isAssigning ? 'Assigning...' : 'Assign Asset'}
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
  );
}
