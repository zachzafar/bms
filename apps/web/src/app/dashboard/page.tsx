'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon,
  PlusIcon,
  UserIcon,
  Package2Icon,
  CarIcon,
  HomeIcon,
} from 'lucide-react';
import Image from 'next/image';

export default function Component() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className='flex flex-col min-h-screen'>
      <main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6'>
        <div className='flex items-center'>
          <h1 className='font-semibold text-lg md:text-2xl'>
            Booking Dashboard
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className='ml-auto' size='sm'>
                <PlusIcon className='w-4 h-4 mr-2' />
                Add Booking
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Booking</DialogTitle>
              </DialogHeader>
              <form className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='asset'>Asset Type</Label>
                  <Select>
                    <SelectTrigger id='asset'>
                      <SelectValue placeholder='Select asset type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='car'>Car</SelectItem>
                      <SelectItem value='room'>Room</SelectItem>
                      <SelectItem value='equipment'>Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='date'>Date</Label>
                  <Calendar
                    mode='single'
                    selected={date}
                    onSelect={setDate}
                    className='rounded-md border'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>Customer Name</Label>
                  <Input id='name' placeholder='Enter customer name' />
                </div>
                <Button type='submit'>Add Booking</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Bookings
              </CardTitle>
              <CalendarIcon className='w-4 h-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>1,248</div>
              <p className='text-xs text-muted-foreground'>
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Users
              </CardTitle>
              <UserIcon className='w-4 h-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>573</div>
              <p className='text-xs text-muted-foreground'>
                +180 since last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Car Bookings
              </CardTitle>
              <CarIcon className='w-4 h-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>432</div>
              <p className='text-xs text-muted-foreground'>
                +19% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Room Bookings
              </CardTitle>
              <HomeIcon className='w-4 h-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>816</div>
              <p className='text-xs text-muted-foreground'>
                +201 since last month
              </p>
            </CardContent>
          </Card>
        </div>
        <div className='border shadow-sm rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[100px]'>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className='font-medium'>BK001</TableCell>
                <TableCell>John Doe</TableCell>
                <TableCell>Car - Toyota Camry</TableCell>
                <TableCell>2023-07-15</TableCell>
                <TableCell>Confirmed</TableCell>
                <TableCell className='text-right'>$120.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>BK002</TableCell>
                <TableCell>Jane Smith</TableCell>
                <TableCell>Room - Deluxe Suite</TableCell>
                <TableCell>2023-07-16</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell className='text-right'>$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>BK003</TableCell>
                <TableCell>Bob Johnson</TableCell>
                <TableCell>Equipment - Projector</TableCell>
                <TableCell>2023-07-17</TableCell>
                <TableCell>Confirmed</TableCell>
                <TableCell className='text-right'>$50.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>BK004</TableCell>
                <TableCell>Alice Brown</TableCell>
                <TableCell>Car - Honda Civic</TableCell>
                <TableCell>2023-07-18</TableCell>
                <TableCell>Cancelled</TableCell>
                <TableCell className='text-right'>$100.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>BK005</TableCell>
                <TableCell>Charlie Davis</TableCell>
                <TableCell>Room - Standard Double</TableCell>
                <TableCell>2023-07-19</TableCell>
                <TableCell>Confirmed</TableCell>
                <TableCell className='text-right'>$180.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
