'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { SearchIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/api/publicClient';
import { BOOKINGS_QUERY_KEY } from '@/lib/api/queryKeys';
import { ExtendedSelectBooking } from '@repo/api-contract/src/api-contract/booking';


export default function Component() {
  const { data: bookings } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
  });
  const { mutate: createBooking } = authClient.booking.createBooking.useMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedBooking, setSelectedBooking] = useState<ExtendedSelectBooking>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    startDate: '',
    endDate: '',
    assetId: '',
  });

  const handleSort = (column: any) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleCancel = (id: string) => {
     
  };

  const handleCreateBooking = () => {
    // createBooking({
    //   body: {
    //     startDate: new Date(newBooking.startDate),
    //     endDate: new Date(newBooking.endDate),
    //     assetId: newBooking.assetId,
    //   }
    // });
    setIsCreateDialogOpen(false);
    setNewBooking({ startDate: '', endDate: '', assetId: '' });
  };

  return (
    <>
      <div className='flex items-center justify-between'>
        <h1 className='font-semibold text-lg md:text-2xl'>Bookings</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Booking</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Enter the details for the new booking
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right'>Asset ID:</Label>
                <Input
                  className='col-span-3'
                  value={newBooking.assetId}
                  onChange={(e) => setNewBooking({ ...newBooking, assetId: e.target.value })}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right'>Start Date:</Label>
                <Input
                  className='col-span-3'
                  type="date"
                  value={newBooking.startDate}
                  onChange={(e) => setNewBooking({ ...newBooking, startDate: e.target.value })}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right'>End Date:</Label>
                <Input
                  className='col-span-3'
                  type="date"
                  value={newBooking.endDate}
                  onChange={(e) => setNewBooking({ ...newBooking, endDate: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateBooking}>Create Booking</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <Input
            className='max-w-xs'
            placeholder='Search bookings...'
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Types</SelectItem>
              <SelectItem value='Car'>Car</SelectItem>
              <SelectItem value='Room'>Room</SelectItem>
              <SelectItem value='Equipment'>Equipment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Statuses</SelectItem>
              <SelectItem value='Active'>Active</SelectItem>
              <SelectItem value='Upcoming'>Upcoming</SelectItem>
              <SelectItem value='Completed'>Completed</SelectItem>
              <SelectItem value='Cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='border shadow-sm rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>
                <Button variant='ghost' onClick={() => handleSort('id')}>
                  Booking ID{' '}
                  {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('assetName')}>
                  Asset{' '}
                  {sortBy === 'assetName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('assetType')}>
                  Type{' '}
                  {sortBy === 'assetType' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  onClick={() => handleSort('customerName')}
                >
                  Customer{' '}
                  {sortBy === 'customerName' &&
                    (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('startDate')}>
                  Start Date{' '}
                  {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('endDate')}>
                  End Date{' '}
                  {sortBy === 'endDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('status')}>
                  Status{' '}
                  {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.status === 200 ? bookings.body.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className='font-medium'>{booking.id}</TableCell>
                <TableCell>{booking.asset.name}</TableCell>
                <TableCell>{booking.asset.assetTypeId}</TableCell>
                <TableCell>{booking.customer.id}</TableCell>
                <TableCell>{booking.startDate.toDateString()}</TableCell>
                <TableCell>{booking.endDate.toDateString()}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setSelectedBooking(booking)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Booking Details</DialogTitle>
                          <DialogDescription>
                            Booking ID: {selectedBooking?.id}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedBooking && (
                          <div className='grid gap-4 py-4'>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Asset:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.asset.name}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Type:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.asset.assetTypeId}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Customer:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.customer.id}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Start Date:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.startDate.toDateString()}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>End Date:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.endDate.toDateString()}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Status:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.status}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant='outline' size='sm'>
                      Edit
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={8}>No bookings found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
