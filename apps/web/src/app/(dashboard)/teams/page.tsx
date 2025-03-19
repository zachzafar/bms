'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2 } from 'lucide-react';
import TeamDetails from './[teamId]/page';


const mockTeams = [
  {
    id: '1',
    name: 'Rentals',
    tenant: 'Sotheby',
    members: [
      { id: '101', name: 'Alice Johnson', role: 'Manager' },
      { id: '102', name: 'Bob Smith', role: 'Agent' },
    ],
  },
  {
    id: '2',
    name: 'Sales',
    tenant: 'Sotheby',
    members: [
      { id: '103', name: 'Charlie Davis', role: 'Sales Lead' },
      { id: '104', name: 'Dana White', role: 'Agent' },
    ],
  },
];

interface Team {
  id: string;
  name: string;
  tenant: string;
  members: { id: string; name: string; role: string }[];
}

export default function Teams() {
  const [teams, setTeams] = useState(mockTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  return (
    <div className='container mx-auto py-10'>
      <Tabs defaultValue='teams'>
        <TabsList>
          <TabsTrigger value='teams'>Teams</TabsTrigger>
          {selectedTeam && <TabsTrigger value='team-details'>Team Details</TabsTrigger>}
        </TabsList>

        <TabsContent value='teams'>
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.tenant}</TableCell>
                      <TableCell>
                        <Button variant='ghost' size='icon' onClick={() => setSelectedTeam(team)}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setTeams(teams.filter((t) => t.id !== team.id))}
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedTeam && (
          <TabsContent value='team-details'>
            <TeamDetails team={selectedTeam} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
