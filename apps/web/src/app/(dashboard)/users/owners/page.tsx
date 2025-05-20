'use client';

import { SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsertUserSchema, SelectOwner} from '@repo/api-contract';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { OWNERS_QUERY_KEY, ROLES_QUERY_KEY } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema for creating owners
const CreateOwnerSchema = InsertUserSchema.extend({
  roles: z.array(z.number()).default([]),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  userType: z.array(z.string()).default(["owner"])
});

type CreateOwnerFormData = z.infer<typeof CreateOwnerSchema>;

export default function Component() {
  const router = useRouter();
  const queryClient = authClient.useQueryClient();
  const { data: owners } = authClient.users.getOwners.useQuery({ queryKey: OWNERS_QUERY_KEY });
  const { mutate: createUserMutation, isPending } = authClient.users.createUser.useMutation();


  const createForm = useForm<CreateOwnerFormData>({
    resolver: zodResolver(CreateOwnerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roles: [],
      companyName: '',
      taxId: '',
      userType: ["owner"]
    },
  });

  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const ownersPerPage = 10;

  const handleCreateOwner: SubmitHandler<CreateOwnerFormData> = async (data) => {
    // Extract owner-specific fields
    const { companyName, taxId, ...userData } = data;
    
    createUserMutation(
      {
        body: {
          ...userData,
          userType: ["owner"]
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
            taxId: '',
            userType: ["owner"]
          });
        },
        onError: (error) => {
          console.error('Create error:', error);
          toast.error('Failed to create owner');
        },
      }
    );
  };
  
  const parsedOwners = owners?.body.map((item) => ({
    id: item.user.id,
    name: item.user.name,
    email: item.user.email,
    companyName: item.owner?.companyName,
    taxId: item.owner?.taxId
  })) || [];

  const filteredOwners = parsedOwners.filter(
    (owner) =>
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner.companyName && owner.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastOwner = currentPage * ownersPerPage;
  const indexOfFirstOwner = indexOfLastOwner - ownersPerPage;
  const currentOwners = filteredOwners.slice(indexOfFirstOwner, indexOfLastOwner);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

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
                        <FormField
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
                  <TableHead>Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOwners.length > 0 ? (
                  currentOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>{owner.name}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell>{owner.companyName || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No owners found. Add your first owner to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className='flex justify-between items-center mt-4'>
              <p>
                Showing {filteredOwners.length > 0 ? indexOfFirstOwner + 1 : 0} to{' '}
                {Math.min(indexOfLastOwner, filteredOwners.length)} of{' '}
                {filteredOwners.length} owners
              </p>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastOwner >= filteredOwners.length}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
