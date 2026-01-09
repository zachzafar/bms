'use client';

import { SetStateAction, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Search, PlusCircle, ChevronLeft, ChevronRight, Eye, Pencil } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsertUserSchema } from '@repo/api-contract';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { OWNERS_QUERY_KEY } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

// Schema for creating owners
const CreateOwnerSchema = InsertUserSchema.extend({
  roles: z.array(z.number()).default([]),
  companyName: z.string().optional(),
  userType: z.string().default("owner")
});

const EditOwnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  companyName: z.string().optional(),
});
type EditOwnerFormData = z.infer<typeof EditOwnerSchema>;

type CreateOwnerFormData = z.infer<typeof CreateOwnerSchema>;

export default function Component() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const queryClient = authClient.useQueryClient();
  const { data: owners } = authClient.users.getOwners.useQuery({
    queryKey: [...OWNERS_QUERY_KEY, page, pageSize],
    queryData: { query: queryParams },
  });
  const { mutate: createUserMutation, isPending } = authClient.users.createUser.useMutation();
  const { mutate: updateUserMutation, isPending: updating } = authClient.users.updateUser.useMutation();
  const { data: usersData } = authClient.users.getUsers.useQuery({ queryKey: ['users'] });

  const users = usersData?.body?.data ?? usersData?.body.data ?? [];
  const rolesByUserId = useMemo(() => {
    const map = new Map<string, number[]>();
    users.forEach((u: any) => map.set(u.id, u.roles ?? []));
    return map;
  }, [users]);

  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingOwner, setEditingOwner] = useState<{ id: string; name: string; email: string; companyName?: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const createForm = useForm<CreateOwnerFormData>({
    resolver: zodResolver(CreateOwnerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roles: [],
      companyName: '',
      userType: "owner"
    },
  });

  const editForm = useForm<EditOwnerFormData>({
    resolver: zodResolver(EditOwnerSchema),
  });

  const onEditOwnerSubmit: SubmitHandler<EditOwnerFormData> = (data) => {
  if (!editingOwner) return;
  const roles = rolesByUserId.get(editingOwner.id) ?? [];
  updateUserMutation(
    {
      params: { id: editingOwner.id },
      body: {
        user: { name: data.name, email: data.email },
        roles,
        owner: {
          userId: editingOwner.id,
          companyName: data.companyName || null,
        },
      },
    },
    {
      onSuccess: () => {
        toast.success('Owner updated successfully');
        queryClient.invalidateQueries({ queryKey: OWNERS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['users'] });
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


  const handleCreateOwner: SubmitHandler<CreateOwnerFormData> = async (data) => {
    // Extract owner-specific fields
    const { companyName, ...userData } = data;

    createUserMutation(
      {
        body: {
          ...userData,
          userType: "owner"
        },
      },
      {
        onSuccess: (response) => {
          toast.success('Owner created successfully');
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: OWNERS_QUERY_KEY });
          createForm.reset({
            name: '',
            email: '',
            password: '',
            roles: [],
            companyName: '',
            // taxId: '',
            userType: "owner"
          });
        },
        onError: (error) => {
          console.error('Create error:', error);
          toast.error('Failed to create owner');
        },
      }
    );
  };

  const parsedOwners = owners?.status === 200 ? owners.body.data.map((item) => ({
    id: item.user.id,
    name: item.user.name,
    email: item.user.email,
    companyName: item.owner?.companyName,
  })) : [];

  const paginationMeta = owners?.status === 200 ? owners.body.pagination : undefined;

  return (
    <>
      <div className='container mx-auto py-10'>
        <h1 className='text-3xl font-bold mb-8'>Owner Management</h1>

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
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
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
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  {...field}
                                  required
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* <FormField
                          control={createForm.control}
                          name="taxId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        /> */}
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
                  <TableHead>Company</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedOwners.length > 0 ? (
                  parsedOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>{owner.name}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell>{owner.companyName || '-'}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingOwner({
                              id: owner.id,
                              name: owner.name,
                              email: owner.email,
                              companyName: owner.companyName ?? undefined,
                            });
                            editForm.reset({
                              name: owner.name,
                              email: owner.email,
                              companyName: owner.companyName || '',
                            });
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/users/owners/${owner.id}`)}
                        >
                          <Eye className="h-4 w-4" />
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






