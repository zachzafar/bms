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

type Team = {
  id: string;
  name: string;
  tenant: string;
  members: number;
  teamPermissions: string[];
};

// Mock data for demonstration
const mockTeams = [
  {
    id: '1',
    name: 'Rentals',
    tenant:'Sotheby',
    members: 5,
    teamPermissions: ['viewProperties', 'editProperties', 'addProperties'],
  },
  {
    id: '2',
    name: 'Sales',
    tenant: 'Sotheby',
    members: 4,
    teamPermissions: ['viewProperties', 'editProperties', 'addProperties'],
  },
  // { id: '3', name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  // Add more mock users here...
];

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<Team>({
    id: '',
    name: '',
    tenant: '',
    members: 0,
    teamPermissions: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const teamsPerPage = 10;

  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    if (name === 'teamPermissions') {
      // Prevent assigning a string to an array
      setFormData((prev) => ({
        ...prev,
        [name]: value.split(','), // Convert comma-separated string to an array
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (selectedTeam) {
      setTeams(
        teams.map((team) =>
          team.id === selectedTeam.id ? { ...team, ...formData } : team
        )
      );
    } else {
      setTeams([...teams, { id: Date.now().toString(), ...formData }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setSelectedTeam(null);
    setFormData({
      id: '',
      name: '',
      tenant: '',
      members: 0,
      teamPermissions: [],
    });
  };

  const editTeam = (team: Team) => {
    setSelectedTeam(team);
    setFormData({ ...team });
  };

  const deleteTeam = (teamId: string) => {
    setTeams(teams.filter((team) => team.id !== teamId));
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.tenant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

  return (
    <>
      <div className='container mx-auto py-10'>
        <h1 className='text-3xl font-bold mb-8'>Team Management</h1>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Team List</CardTitle>
            <CardDescription>Manage existing teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  placeholder='Search teams...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedTeam ? 'Edit Team' : 'Add New Team'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter Team details below
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
                        <Label htmlFor='tenant'>Tenant</Label>
                        <Input
                          id='tenant'
                          name='tenant'
                          value={formData.tenant}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {/* <div className='space-y-2'>
                        <Label htmlFor='teamPermissions'>Team Permissions</Label>
                        <Select
                          name='permissions'
                          value={formData.teamPermissions}
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
                      </div> */}
                    </div>

                    <div className='flex justify-end space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                      <Button type='submit'>
                        {selectedTeam ? 'Update Team' : 'Add Team'}
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
                  <TableHead>Tenant</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team.tenant}</TableCell>
                    <TableCell>{team.members}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`View details for ${team.name}`}
                          >
                            <Search className='h-4 w-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Team Details</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <div>
                              <h3 className='font-semibold'>
                                Basic Information
                              </h3>
                              <p>Name: {team.name}</p>
                              <p>Tenant: {team.tenant}</p>
                              <p>Members: {team.members}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => editTeam(team)}
                        aria-label={`Edit ${team.name}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteTeam(team.id)}
                        aria-label={`Delete ${team.name}`}
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
                Showing {indexOfFirstTeam + 1} to{' '}
                {Math.min(indexOfLastTeam, filteredTeams.length)} of{' '}
                {filteredTeams.length} teams
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
                  disabled={indexOfLastTeam >= filteredTeams.length}
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
