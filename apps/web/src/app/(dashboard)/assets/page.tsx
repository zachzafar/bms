'use client'

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusIcon, Pencil } from 'lucide-react';

import AddAssetForm from './AddAssetForm';

import { authClient } from '@/lib/api/publicClient';
import { SelectAsset } from '@repo/api-contract';
import Link from 'next/link';
import { StorageService } from '@/lib/api/storage';


export default function AssetsPage() {
    const currentTenant = StorageService.getTenant();
    const { data: assets } = authClient.assets.getAssets.useQuery({
        queryKey: ['assets'],
        enabled: !!currentTenant,
    });


  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Assets</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className='ml-auto' size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' />
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
      <div className='border shadow-sm rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requires Approval</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets?.status === 200 ? assets.body.map((asset) => (
              <Row asset={asset}/>
            )): <TableRow><TableCell colSpan={7}>No assets found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </>
  );
}


const Row = ({ asset }: { asset: SelectAsset }) => {
  const { data: status, isLoading: statusIsLoading } = authClient.slots.getAssetStatus.useQuery({
    queryKey: ['asset-status', asset.id], 
    queryData: { 
      params: { id: asset.id },
      query: { start: new Date().toISOString(), end: new Date().toISOString() }
    }
  });
  return (
    <TableRow key={asset.id}>
      <TableCell>{asset.id}</TableCell>
      <TableCell>{asset.name}</TableCell>
      <TableCell>{asset.assetTypeId}</TableCell>
      <TableCell>{statusIsLoading ? "Loading Status..." : status?.body.status ?? "Unknown"}</TableCell>
      <TableCell>{asset.requiresApproval ? 'Yes' : 'No'}</TableCell>
      <TableCell>
        <Link href={`/assets/${asset.id}`}>
        <Button variant='ghost' size='sm'>
          <Pencil className='mr-2 h-4 w-4' />
          Edit
        </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
