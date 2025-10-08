'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

// Define Props Interface
interface Team {
  id: string;
  name: string;
  tenant: string;
  members: { id: string; name: string; role: string }[];
}

interface TeamDetailsProps {
  team: Team;
}

export default function TeamDetails({ team }: TeamDetailsProps) {
  const [teamMembers, setTeamMembers] = useState(team.members);

  const handleRoleChange = (memberId: string, newRole: string) => {
    setTeamMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  const handleDeleteMember = (memberId: string) => {
    setTeamMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId));
  };

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
