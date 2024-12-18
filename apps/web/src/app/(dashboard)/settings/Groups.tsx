'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

import { Pencil, Trash2 } from 'lucide-react';

// Mock data for demonstration

const mockGroupTypes = [
  {
    id: '1',
    name: 'Property Development',
    description: 'For residential and commercial property developments',
  },
  {
    id: '2',
    name: 'Vehicle Fleet',
    description: 'For managing groups of vehicles',
  },
];

const mockGroups = [
  {
    id: '1',
    name: 'Sunset Meadows',
    groupType: 'Property Development',
    description: 'A residential development with 100 units',
  },
  {
    id: '2',
    name: 'Downtown Fleet',
    groupType: 'Vehicle Fleet',
    description: 'Vehicles for city center operations',
  },
];

export default function Groups() {
  const [groupTypes, setGroupTypes] = useState(mockGroupTypes);
  const [groups, setGroups] = useState(mockGroups);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    groupType: '',
    description: '',
  });

  const handleGroupInputChange = (e) => {
    const { name, value } = e.target;
    setGroupFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    if (selectedGroup) {
      setGroups(
        groups.map((group) =>
          group.id === selectedGroup.id ? { ...group, ...groupFormData } : group
        )
      );
    } else {
      setGroups([...groups, { id: Date.now().toString(), ...groupFormData }]);
    }
    resetGroupForm();
  };

  const resetGroupForm = () => {
    setSelectedGroup(null);
    setGroupFormData({
      name: '',
      groupType: '',
      description: '',
    });
  };

  const editGroup = (group) => {
    setSelectedGroup(group);
    setGroupFormData(group);
  };

  const deleteGroup = (groupId) => {
    setGroups(groups.filter((group) => group.id !== groupId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Management</CardTitle>
        <CardDescription>Manage groups for asset organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <form onSubmit={handleGroupSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='groupName'>Name</Label>
                <Input
                  id='groupName'
                  name='name'
                  value={groupFormData.name}
                  onChange={handleGroupInputChange}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='groupType'>Group Type</Label>
                <Select
                  name='groupType'
                  value={groupFormData.groupType}
                  onValueChange={(value) =>
                    setGroupFormData((prev) => ({
                      ...prev,
                      groupType: value,
                    }))
                  }
                  required
                >
                  <SelectTrigger id='groupType'>
                    <SelectValue placeholder='Select group type' />
                  </SelectTrigger>
                  <SelectContent>
                    {groupTypes.map((groupType) => (
                      <SelectItem key={groupType.id} value={groupType.name}>
                        {groupType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='groupDescription'>Description</Label>
                <Textarea
                  id='groupDescription'
                  name='description'
                  value={groupFormData.description}
                  onChange={handleGroupInputChange}
                />
              </div>
            </div>
            <Button type='submit'>
              {selectedGroup ? 'Update Group' : 'Add Group'}
            </Button>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Group Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.groupType}</TableCell>
                  <TableCell>{group.description}</TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => editGroup(group)}
                      aria-label={`Edit ${group.name}`}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => deleteGroup(group.id)}
                      aria-label={`Delete ${group.name}`}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
