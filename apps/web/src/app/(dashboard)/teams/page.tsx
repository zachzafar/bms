'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2, Search, Eye, X } from 'lucide-react';

// Team Type Definition
type Team = {
  id: string;
  name: string;
  tenant: string;
  members: { id: string; name: string; roles: string[] }[];
};

// Mock Teams Data
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Rentals',
    tenant: 'Sotheby',
    members: [
      { id: 'm1', name: 'John Doe', roles: ['Manager'] },
      { id: 'm2', name: 'Jane Smith', roles: ['Agent'] },
    ],
  },
  {
    id: '2',
    name: 'Sales',
    tenant: 'Sotheby',
    members: [
      { id: 'm3', name: 'Alice Brown', roles: ['Admin'] },
      { id: 'm4', name: 'Bob White', roles: ['Sales Rep'] },
    ],
  },
];

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabs, setTabs] = useState([{ id: 'teams', title: 'Teams List' }]);
  const [activeTab, setActiveTab] = useState('teams');

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    if (!tabs.find((tab) => tab.id === team.id)) {
      setTabs([...tabs, { id: team.id, title: `Edit: ${team.name}` }]);
    }
    setActiveTab(team.id);
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(teams.filter((team) => team.id !== teamId));
    if (selectedTeam?.id === teamId) setSelectedTeam(null);
    setTabs(tabs.filter((tab) => tab.id !== teamId));
    setActiveTab('teams');
  };

  const handleCloseTab = (id: string) => {
    setTabs(tabs.filter((tab) => tab.id !== id));
    setActiveTab('teams');
    if (selectedTeam?.id === id) setSelectedTeam(null);
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams(teams.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)));
    if (selectedTeam?.id === updatedTeam.id) setSelectedTeam(updatedTeam);
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='container mx-auto py-10'>
      <h1 className='text-3xl font-bold mb-8'>Team Management</h1>
      
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <div key={tab.id} className='flex items-center'>
              <TabsTrigger value={tab.id}>{tab.title}</TabsTrigger>
              {tab.id !== 'teams' && (
                <Button variant='ghost' size='icon' onClick={() => handleCloseTab(tab.id)}>
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
          ))}
        </TabsList>

        <TabsContent value='teams'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.tenant}</TableCell>
                  <TableCell className='flex gap-2'>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <Eye className='h-4 w-4' />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Team Details</DialogTitle>
                        </DialogHeader>
                        <p><strong>Name:</strong> {team.name}</p>
                        <p><strong>Tenant:</strong> {team.tenant}</p>
                        <h3 className='font-semibold mt-4'>Members:</h3>
                        <ul>
                          {team.members.map((member) => (
                            <li key={member.id}>
                              {member.name} - {member.roles.join(', ')}
                            </li>
                          ))}
                        </ul>
                      </DialogContent>
                    </Dialog>

                    <Button variant='ghost' size='icon' onClick={() => handleEditTeam(team)}>
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className='h-4 w-4 text-red-600' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {selectedTeam && (
          <TabsContent key={selectedTeam.id} value={selectedTeam.id}>
            <h2 className='text-xl font-bold mb-4'>Editing {selectedTeam.name}</h2>
            <h3 className='font-semibold mt-4'>Members</h3>
            <Table>
              <TableBody>
                {selectedTeam.members.map((member, memberIndex) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Input
                        value={member.name}
                        onChange={(e) => {
                          const updatedTeam = { ...selectedTeam };
                          updatedTeam.members[memberIndex].name = e.target.value;
                          handleUpdateTeam(updatedTeam);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {member.roles.map((role, index) => (
                        <span key={index} className='inline-flex items-center px-2 py-1 bg-gray-200 rounded-full text-sm mr-2'>
                          {role}
                          <button onClick={() => {
                            const updatedTeam = { ...selectedTeam };
                            updatedTeam.members.find((m) => m.id === member.id)!.roles.splice(index, 1);
                            handleUpdateTeam(updatedTeam);
                          }}>
                            <X className='ml-1 h-4 w-4 text-red-600' />
                          </button>
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
