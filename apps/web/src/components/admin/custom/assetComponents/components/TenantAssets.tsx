'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon, Pencil, Trash2 as TrashIcon, Upload } from 'lucide-react'

import AddAssetForm from '../components/assets/AddAssetForm'
import BulkUploadForm from '../components/assets/BulkUploadForm'
import { authClient } from '@/lib/api/publicClient'
import { SelectAsset } from '@repo/api-contract'
import Link from 'next/link'
import { StorageService } from '@/lib/api/storage'
import { toast } from 'sonner'

export default function AssetsPage({tenantId}: {tenantId: string}) {
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const { data: assets, refetch } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets'],
    enabled: !!tenantId,
  })
  const { mutate: deleteAsset } = (authClient.assets as any).deleteAsset.useMutation();

  const { data: assetType } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetType']
  })

  const handleBulkUploadSuccess = () => {
    refetch();
    setIsBulkUploadOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-lg md:text-2xl">Assets</h1>
        <div className="ml-auto flex gap-2">
          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Upload Assets</DialogTitle>
                <DialogDescription>
                  Upload multiple assets at once using a JSON or CSV file.
                </DialogDescription>
              </DialogHeader>
              <BulkUploadForm tenantId={tenantId} onSuccess={handleBulkUploadSuccess} />
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  <AddAssetForm />
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="border shadow-sm rounded-lg mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requires Approval</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets?.status === 200 ? (
              assets.body.data.map((asset) => (
                <Row key={asset.id} asset={asset} refetch={refetch} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No assets found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export const Row = ({
  asset,
  refetch,
}: {
  asset: SelectAsset;
  refetch: () => void;
}) => {
  const { mutate: deleteAsset, isPending } = authClient.assets.deleteAsset.useMutation({
    onSuccess: () => {
      toast.success(`Asset "${asset.name}" deleted.`);  
      refetch();
    },
    onError: () => {
      toast.error(`Failed to delete "${asset.name}".`);
    },
  });

  const handleDelete = () => {
    const confirmed = confirm(`Delete asset "${asset.name}"?`);
    if (confirmed) {
      deleteAsset({ params: { id: String(asset.id) }, body:{} }); // Ensure `id` is a string
    }
  };

  const { data: assetType } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetType']
  })

  const assetTypeMap: Record<number, string | undefined> =
  assetType?.body?.data.reduce((acc, type) => {
    acc[type.id] = type.name;
    return acc;
  }, {} as Record<number, string | undefined>) ?? {};

  return (
    <tr>
  <td>{asset.id}</td>
  <td>{asset.name}</td>
  <td>
    {asset.assetTypeId != null
      ? assetTypeMap?.[asset.assetTypeId] ?? "Unknown"
      : "Unknown"}
  </td>
  <td>{asset.requiresApproval ? "Yes" : "No"}</td>
  <td className="flex justify-end gap-2">
    <Link href={`/assets/${asset.id}`}>
      <Button variant="ghost" size="sm">
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
    </Link>
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      <TrashIcon className="h-4 w-4 text-destructive" />
    </Button>
  </td>
</tr>
  );
};

