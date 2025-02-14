'use client';

import { SetStateAction, SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Menu,
  Mountain,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Customer',
    customerDetails: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '123-456-7890',
      dateOfBirth: '1990-01-01',
      address: '123 Main St',
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Owner',
    ownerDetails: { companyName: 'Smith Enterprises', taxId: '12-3456789' },
  },
  { id: '3', name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  // Add more mock users here...
];

export default function Component() {
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    companyName: '',
    taxId: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 10;

  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: any) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (selectedUser) {
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? { ...user, ...formData } : user
        )
      );
    } else {
      setUsers([...users, { id: Date.now().toString(), ...formData }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      companyName: '',
      taxId: '',
    });
  };

  const editUser = (user: { id: string; name: string; email: string; role: string; customerDetails: { firstName: string; lastName: string; phone: string; dateOfBirth: string; address: string; }; ownerDetails?: undefined; } | { id: string; name: string; email: string; role: string; ownerDetails: { companyName: string; taxId: string; }; customerDetails?: undefined; } | { id: string; name: string; email: string; role: string; customerDetails?: undefined; ownerDetails?: undefined; } | SetStateAction<null> | SetStateAction<{ name: string; email: string; password: string; role: string; firstName: string; lastName: string; phone: string; address: string; dateOfBirth: string; companyName: string; taxId: string; }>) => {
    setSelectedUser(user);
    setFormData({
      ...user,
      ...user.customerDetails,
      ...user.ownerDetails,
      password: '', // Don't populate password for security reasons
    });
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

  return (
    <>
      <div className='container mx-auto py-10'>
        <h1 className='text-3xl font-bold mb-8'>User Management</h1>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Manage existing users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  placeholder='Search users...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedUser ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter user details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Name</Label>
                        <Input
                          id='name'
                          name='name'
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          name='email'
                          type='email'
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='password'>Password</Label>
                        <Input
                          id='password'
                          name='password'
                          type='password'
                          value={formData.password}
                          onChange={handleInputChange}
                          required={!selectedUser}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='role'>Role</Label>
                        <Select
                          name='role'
                          value={formData.role}
                          onValueChange={handleRoleChange}
                          required
                        >
                          <SelectTrigger id='role'>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Admin'>Admin</SelectItem>
                            <SelectItem value='Manager'>Manager</SelectItem>
                            <SelectItem value='Customer'>Customer</SelectItem>
                            <SelectItem value='Owner'>Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Tabs defaultValue='customer' className='w-full'>
                      <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value='customer'>
                          Customer Details
                        </TabsTrigger>
                        <TabsTrigger value='owner'>Owner Details</TabsTrigger>
                      </TabsList>
                      <TabsContent value='customer' className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='firstName'>First Name</Label>
                            <Input
                              id='firstName'
                              name='firstName'
                              value={formData.firstName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='lastName'>Last Name</Label>
                            <Input
                              id='lastName'
                              name='lastName'
                              value={formData.lastName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='phone'>Phone</Label>
                            <Input
                              id='phone'
                              name='phone'
                              type='tel'
                              value={formData.phone}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='dateOfBirth'>Date of Birth</Label>
                            <Input
                              id='dateOfBirth'
                              name='dateOfBirth'
                              type='date'
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='address'>Address</Label>
                          <Input
                            id='address'
                            name='address'
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value='owner' className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='companyName'>Company Name</Label>
                            <Input
                              id='companyName'
                              name='companyName'
                              value={formData.companyName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='taxId'>Tax ID</Label>
                            <Input
                              id='taxId'
                              name='taxId'
                              value={formData.taxId}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className='flex justify-end space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                      <Button type='submit'>
                        {selectedUser ? 'Update User' : 'Add User'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`View details for ${user.name}`}
                          >
                            <Search className='h-4 w-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <div>
                              <h3 className='font-semibold'>
                                Basic Information
                              </h3>
                              <p>Name: {user.name}</p>
                              <p>Email: {user.email}</p>
                              <p>Role: {user.role}</p>
                            </div>
                            {user.customerDetails && (
                              <div>
                                <h3 className='font-semibold'>
                                  Customer Details
                                </h3>
                                <p>
                                  First Name: {user.customerDetails.firstName}
                                </p>
                                <p>
                                  Last Name: {user.customerDetails.lastName}
                                </p>
                                <p>Phone: {user.customerDetails.phone}</p>
                                <p>
                                  Date of Birth:{' '}
                                  {user.customerDetails.dateOfBirth}
                                </p>
                                <p>Address: {user.customerDetails.address}</p>
                              </div>
                            )}
                            {user.ownerDetails && (
                              <div>
                                <h3 className='font-semibold'>Owner Details</h3>
                                <p>
                                  Company Name: {user.ownerDetails.companyName}
                                </p>
                                <p>Tax ID: {user.ownerDetails.taxId}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => editUser(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteUser(user.id)}
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className='flex justify-between items-center mt-4'>
              <p>
                Showing {indexOfFirstUser + 1} to{' '}
                {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
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
                  disabled={indexOfLastUser >= filteredUsers.length}
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
