'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Search, PlusCircle, Eye, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { OWNERS_QUERY_KEY } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const OwnerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type OwnerFormData = z.infer<typeof OwnerFormSchema>;

export default function Component() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const queryClient = authClient.useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: owners } = authClient.owners.getOwners.useQuery({
    queryKey: [...OWNERS_QUERY_KEY, page, pageSize, searchTerm],
    queryData: { query: { ...queryParams, search: searchTerm || undefined } },
  });
  const { mutate: deleteOwner } = authClient.owners.deleteOwner.useMutation();
  const { mutate: createOwner, isPending } = authClient.owners.createOwner.useMutation();
  const { mutate: updateOwner, isPending: updating } = authClient.owners.updateOwner.useMutation();

  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingOwner, setEditingOwner] = useState<{ id: number; name: string; email: string; phone?: string; address?: string } | null>(null);

  const createForm = useForm<OwnerFormData>({
    resolver: zodResolver(OwnerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const editForm = useForm<OwnerFormData>({
    resolver: zodResolver(OwnerFormSchema),
  });

  const onEditOwnerSubmit: SubmitHandler<OwnerFormData> = (data) => {
    if (!editingOwner) return;
    updateOwner(
      {
        params: { id: editingOwner.id },
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          address: data.address || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Owner updated successfully');
          queryClient.invalidateQueries({ queryKey: OWNERS_QUERY_KEY });
          setOpenEdit(false);
          setEditingOwner(null);
        },
        onError: (error) => {
          console.error('Update error:', error);
          toast.error('Failed to update owner');
        },
      }
    );
  };

  const handleDeleteOwner = async (ownerId: number) => {
    if (confirm('Are you sure you want to delete this owner? This action cannot be undone.')) {
      deleteOwner({
        params: { id: ownerId },
        body: {}
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: OWNERS_QUERY_KEY });
          toast.success('Owner deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete owner');
        }
      });
    }
  };

  const handleCreateOwner: SubmitHandler<OwnerFormData> = async (data) => {
    createOwner(
      {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          address: data.address || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Owner created successfully');
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: OWNERS_QUERY_KEY });
          createForm.reset();
        },
        onError: (error) => {
          console.error('Create error:', error);
          toast.error('Failed to create owner');
        },
      }
    );
  };

  const parsedOwners = owners?.status === 200 ? owners.body.data.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    address: item.address,
  })) : [];

  const paginationMeta = owners?.status === 200 ? owners.body.pagination : undefined;

  return (
    <>
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold'>Owner Management</h1>
          {StorageService.getTenant()?.subdomain && (
            <Link
              href={`/owner/${StorageService.getTenant()!.subdomain}/login`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button variant='outline'>
                <ExternalLink className='mr-2 h-4 w-4' />
                Owner Portal
              </Button>
            </Link>
          )}
        </div>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Owner List</CardTitle>
            <CardDescription>Manage property owners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  placeholder='Search owners...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Edit Owner Dialog */}
              <Dialog open={openEdit} onOpenChange={(v) => { setOpenEdit(v); if (!v) setEditingOwner(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Owner</DialogTitle>
                    <DialogDescription>Update owner details</DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditOwnerSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl><Input type="email" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOpenEdit(false);
                            setEditingOwner(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updating}>Save</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setOpen(true)}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add Owner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Owner</DialogTitle>
                    <DialogDescription>
                      Enter owner details below
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateOwner)} className='space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='flex justify-end space-x-2'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            createForm.reset();
                            setOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type='submit' disabled={isPending}>
                          Add Owner
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedOwners.length > 0 ? (
                  parsedOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>{owner.name}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingOwner({
                              id: owner.id,
                              name: owner.name,
                              email: owner.email,
                              phone: owner.phone ?? undefined,
                              address: owner.address ?? undefined,
                            });
                            editForm.reset({
                              name: owner.name,
                              email: owner.email,
                              phone: owner.phone ?? '',
                              address: owner.address ?? '',
                            });
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/bookings/users/owners/${owner.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOwner(owner.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No owners found. Add your first owner to get started.
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
