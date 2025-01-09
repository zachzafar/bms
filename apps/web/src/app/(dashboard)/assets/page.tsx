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
import { useState } from 'react';
import { authClient } from '@/lib/api/publicClient';

export default async function AssetsPage() {
    const { data: assets } = authClient.assets.getAssets.useQuery({
        queryKey: ['assets']
    });



  return (
    <main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6'>
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
              <TableHead>Subgroup</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requires Approval</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className='font-medium'>{asset.id}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell>{asset.subgroup}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>{asset.requiresApproval ? 'Yes' : 'No'}</TableCell>
                <TableCell className='text-right'>
                  <Button variant='ghost' size='sm'>
                    <Pencil className='mr-2 h-4 w-4' />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
