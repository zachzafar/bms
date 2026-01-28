'use client';

import { Button } from '@/components/ui/button';
import { DialogHeader, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField, FormItem, FormLabel, Form, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authClient } from '@/lib/api/publicClient';
import { ASSETS_QUERY_KEY, MAINTENANCE_QUERY_KEY } from '@/lib/api/queryKeys';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Pencil  } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const MaintenanceFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().min(0, 'Cost must be positive'),
  status: z.enum(['COMPLETE', 'IN_PROGRESS', 'AWAITING']),
  assetId: z.string().min(1, 'Asset is required'),
});

type MaintenanceFormData = z.infer<typeof MaintenanceFormSchema>;

export default function Component() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const { data: assetsResponse} = authClient.assets.getAssets.useQuery({ queryKey: ASSETS_QUERY_KEY });
  const { data: maintenance } = authClient.maintenance.getMaintenances.useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, page, pageSize],
    queryData: {query:queryParams},
  });
  const { mutate, isPending } = authClient.maintenance.createMaintenance.useMutation();

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(MaintenanceFormSchema),
    defaultValues: {
      title: '',
      description: '',
      cost: 0,
      status: 'AWAITING',
      assetId: '',
    },
  });
  const filteredTasks = maintenance?.status === 200 ? maintenance.body.data : [];
  const paginationMeta = maintenance?.status === 200 ? maintenance.body.pagination : undefined;

  // const filteredTasks = maintenance?.status === 200 ?
  //   maintenance.body.filter(
  //     (task) =>
  //       (searchTerm === '' ||
  //         task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //         task.description
  //           .toLowerCase()
  //           .includes(searchTerm.toLowerCase())) &&
  //       (filterStatus === 'All' || task.status === filterStatus)
  //   ) : [];

  const assets = assetsResponse?.status === 200 ? assetsResponse.body?.data ?? assetsResponse.body : [];

  const processForm: SubmitHandler<MaintenanceFormData> = async (data) => {
    mutate({
      body: data
    }, {
      onSuccess: (response) => {
        toast.success('Task added successfully');
        router.push(`/bookings/maintenance/${response.body.id}`)
        form.reset();
        // Optionally redirect or refresh data
      },
      onError: (error) => {
        console.log('error', error);
      }
    });
  };

  // Add these state declarations after existing ones
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Maintenance Tasks</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className='ml-auto' size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Maintenance Task</DialogTitle>
              <DialogDescription>
                Enter the details for the new maintenance task.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processForm)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter task description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter cost" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AWAITING">Awaiting</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETE">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Adding Task...' : 'Add Task'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rest of your table component remains the same */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <Input
            className='max-w-xs'
            placeholder='Search tasks...'
            type='search'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size='icon' variant='outline'>
            <SearchIcon className='h-4 w-4' />
            <span className='sr-only'>Search</span>
          </Button>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Statuses</SelectItem>
              <SelectItem value='AWAITING'>Awaiting</SelectItem>
              <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
              <SelectItem value='COMPLETE'>Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='border shadow-sm rounded-lg overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cost ($)</TableHead>
              <TableHead>Asset ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.id}</TableCell>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>${task.cost.toFixed(2)}</TableCell>
                <TableCell>{task.assetId}</TableCell>
                <TableCell>{new Date(task.createdAt).toLocaleDateString()}</TableCell>
                {/* <TableCell>
                  <Select
                    value={task.status}
                    onValueChange={(value) => {
                      // Add your status update mutation here
                      console.log('Update status', task.id, value);
                    }}
                  >
                    <SelectTrigger className='w-[140px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='AWAITING'>Awaiting</SelectItem>
                      <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                      <SelectItem value='COMPLETE'>Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell> */}
                <TableCell>
                  <Link href={`/bookings/maintenance/${task.id}`}>
                    <Button variant='ghost' size='sm'>
                      <Pencil className='mr-2 h-4 w-4' />
                      Edit
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {paginationMeta && (
        <DataTablePagination
          pagination={paginationMeta}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}
    </>
  );
}
