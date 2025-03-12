'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

// Mock data for demonstration
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

export default function TeamDetails() {
  const router = useRouter();
  const { teamId } = router.query;
  const team = mockTeams.find((t) => t.id === teamId);
  const [teamMembers, setTeamMembers] = useState(team ? team.members : []);

  const handleRoleChange = (memberId, newRole) => {
    setTeamMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  const handleDeleteMember = (memberId) => {
    setTeamMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId));
  };

  if (!team) return <p>Team not found</p>;

  return (
    <div className='container mx-auto py-10'>
      <Card>
        <CardHeader>
          <CardTitle>{team.name} - Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Manager'>Manager</SelectItem>
                        <SelectItem value='Agent'>Agent</SelectItem>
                        <SelectItem value='Sales Lead'>Sales Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant='ghost' size='icon'>
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDeleteMember(member.id)}
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
    </div>
  );
}
