'use client';

import React from 'react';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

function GroupTypes() {
  const [groupTypes, setGroupTypes] = useState(mockGroupTypes);
  const [selectedGroupType, setSelectedGroupType] = useState(null);
  const [groupTypeFormData, setGroupTypeFormData] = useState({
    name: '',
    description: '',
  });

  const handleGroupTypeInputChange = (e) => {
    const { name, value } = e.target;
    setGroupTypeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupTypeSubmit = (e) => {
    e.preventDefault();
    if (selectedGroupType) {
      setGroupTypes(
        groupTypes.map((gt) =>
          gt.id === selectedGroupType.id ? { ...gt, ...groupTypeFormData } : gt
        )
      );
    } else {
      setGroupTypes([
        ...groupTypes,
        { id: Date.now().toString(), ...groupTypeFormData },
      ]);
    }
    resetGroupTypeForm();
  };

  const resetGroupTypeForm = () => {
    setSelectedGroupType(null);
    setGroupTypeFormData({
      name: '',
      description: '',
    });
  };

  const editGroupType = (groupType) => {
    setSelectedGroupType(groupType);
    setGroupTypeFormData(groupType);
  };

  const deleteGroupType = (groupTypeId) => {
    setGroupTypes(groupTypes.filter((gt) => gt.id !== groupTypeId));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Group Type Management</CardTitle>
          <CardDescription>
            Manage group types for asset organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <form onSubmit={handleGroupTypeSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='groupTypeName'>Name</Label>
                  <Input
                    id='groupTypeName'
                    name='name'
                    value={groupTypeFormData.name}
                    onChange={handleGroupTypeInputChange}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='groupTypeDescription'>Description</Label>
                  <Textarea
                    id='groupTypeDescription'
                    name='description'
                    value={groupTypeFormData.description}
                    onChange={handleGroupTypeInputChange}
                  />
                </div>
              </div>
              <Button type='submit'>
                {selectedGroupType ? 'Update Group Type' : 'Add Group Type'}
              </Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupTypes.map((groupType) => (
                  <TableRow key={groupType.id}>
                    <TableCell>{groupType.name}</TableCell>
                    <TableCell>{groupType.description}</TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => editGroupType(groupType)}
                        aria-label={`Edit ${groupType.name}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteGroupType(groupType.id)}
                        aria-label={`Delete ${groupType.name}`}
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
    </>
  );
}

export default GroupTypes;
