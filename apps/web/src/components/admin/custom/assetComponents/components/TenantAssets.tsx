'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePagination } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
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
import { PlusIcon, Pencil, Trash2 as TrashIcon, Upload, Search } from 'lucide-react'

import AddAssetForm from '../components/assets/AddAssetForm'
import BulkUploadForm from '../components/assets/BulkUploadForm'
import { authClient } from '@/lib/api/publicClient'
import { SelectAsset } from '@repo/api-contract'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AssetsPage({tenantId}: {tenantId: string}) {
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const { page, pageSize, goToPage, changePageSize } = usePagination(1, 10);

  const { data: assets, refetch } = authClient.systemAdmin.getTenantAssets.useQuery({
    queryKey: ['tenant-assets', tenantId, page, pageSize],
    queryData: { params: { tenantId }, query: { page, pageSize } },
    enabled: !!tenantId,
  })

  const { data: assetTypesData } = authClient.systemAdmin.getAssetTypes.useQuery({
    queryKey: ['assetTypes', tenantId],
    queryData: { params: { tenantId } },
  })

  const assetTypes = assetTypesData?.body?.data ?? [];

  const assetTypeMap: Record<number, string | undefined> = useMemo(() => {
    return assetTypes.reduce((acc, type) => {
      acc[type.id] = type.name;
      return acc;
    }, {} as Record<number, string | undefined>);
  }, [assetTypes]);

  const handleBulkUploadSuccess = () => {
    refetch();
    setIsBulkUploadOpen(false);
  };

  const paginationMeta = assets?.status === 200 ? assets.body.pagination : null;

  const filteredAssets = useMemo(() => {
    const allAssets = assets?.status === 200 ? assets.body.data : [];

    return allAssets.filter((asset) => {
      const matchesSearch = searchTerm === '' ||
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedAssetType === 'all' ||
        asset.assetTypeId?.toString() === selectedAssetType;

      return matchesSearch && matchesType;
    });
  }, [assets, searchTerm, selectedAssetType]);

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

          {/* <Dialog>
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
          </Dialog> */}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {assetTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border shadow-sm rounded-lg mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              {/* <TableHead>Requires Approval</TableHead> */}
              {/* <TableHead className="text-right">Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  assetTypeMap={assetTypeMap}
                  refetch={refetch}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No assets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {paginationMeta && (
          <DataTablePagination
            pagination={paginationMeta}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
        )}
      </div>
    </>
  )
}

const AssetRow = ({
  asset,
  assetTypeMap,
  refetch,
}: {
  asset: SelectAsset;
  assetTypeMap: Record<number, string | undefined>;
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
      deleteAsset({ params: { id: String(asset.id) }, body:{} });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{asset.id}</TableCell>
      <TableCell>{asset.name}</TableCell>
      <TableCell>
        {asset.assetTypeId != null
          ? assetTypeMap?.[asset.assetTypeId] ?? "Unknown"
          : "Unknown"}
      </TableCell>
      {/* <TableCell>{asset.requiresApproval ? "Yes" : "No"}</TableCell> */}
      {/* <TableCell className="text-right">
        <div className="flex justify-end gap-2">
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
        </div>
      </TableCell> */}
    </TableRow>
  );
};
