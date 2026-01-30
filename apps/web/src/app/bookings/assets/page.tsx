'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusIcon, Pencil, Trash2 as TrashIcon, Search } from 'lucide-react'

import AddAssetForm from './AddAssetForm'

import { authClient } from '@/lib/api/publicClient'
import { SelectAsset } from '@repo/api-contract'
import Link from 'next/link'
import { StorageService } from '@/lib/api/storage'
import { toast } from 'sonner'
import { usePagination } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

export default function AssetsPage() {
  const currentTenant = StorageService.getTenant()
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10)
  const [searchTerm, setSearchTerm] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all')

  const { data: assets, refetch } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets', page, pageSize],
    queryData: {query:queryParams},
    enabled: !!currentTenant,
  })

  const { mutate: deleteAsset, isPending: isDeleting } = authClient.assets.deleteAsset.useMutation({
    onSuccess: () => {
      toast.success('Asset deleted successfully');
      refetch();
    },
    onError: (error: any) => {
      const message = error?.body?.message || 'Failed to delete asset';
      toast.error(message);
    },
  });

  const { data: assetTypeData } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetType']
  })

  const assetTypes = assetTypeData?.body?.data ?? []
  const assetList = assets?.status === 200 ? assets.body.data : []
  const paginationMeta = assets?.status === 200 ? assets.body.pagination : undefined

  // Filter assets based on search term and asset type
  const filteredAssets = assetList.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = assetTypeFilter === 'all' || String(asset.assetTypeId) === assetTypeFilter
    return matchesSearch && matchesType
  })

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Assets</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="ml-auto" size="sm">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Asset Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Asset Types</SelectItem>
            {assetTypes.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requires Approval</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <Row key={asset.id} asset={asset} onDelete={deleteAsset} isDeleting={isDeleting} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  {searchTerm || assetTypeFilter !== 'all'
                    ? 'No assets match your filters'
                    : 'No assets found'}
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

export const Row = ({
  asset,
  onDelete,
  isDeleting,
}: {
  asset: SelectAsset;
  onDelete: (params: { params: { id: string }; body: object }) => void;
  isDeleting: boolean;
}) => {
  const handleDelete = () => {
    const confirmed = confirm(`Delete asset "${asset.name}"?`);
    if (confirmed) {
      onDelete({ params: { id: String(asset.id) }, body: {} });
    }
  };

  const { data: assetType } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetType']
  })

  const assetTypeMap: Record<number, string | undefined> =
  assetType?.body?.data?.reduce((acc: Record<number, string | undefined>, type: any) => {
    acc[type.id] = type.name;
    return acc;
  }, {} as Record<number, string | undefined>) ?? {};

  return (
    <TableRow>
      <TableCell>{asset.name}</TableCell>
      <TableCell>
        {asset.assetTypeId != null
          ? assetTypeMap?.[asset.assetTypeId] ?? "Unknown"
          : "Unknown"}
      </TableCell>
      <TableCell>{asset.requiresApproval ? "Yes" : "No"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Link href={`assets/${asset.id}`}>
            <Button variant="ghost" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

