'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@radix-ui/react-select';
import { XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

import React, { useState } from 'react';

export default function Categories() {
  const [assetTypes, setAssetTypes] = useState([
    {
      id: 1,
      name: 'Car',
      schema: [
        { name: 'Make', type: 'text' },
        { name: 'Model', type: 'text' },
        { name: 'Year', type: 'number' },
      ],
    },
    {
      id: 2,
      name: 'Property',
      schema: [
        { name: 'Address', type: 'text' },
        { name: 'Bedrooms', type: 'number' },
        { name: 'Bathrooms', type: 'number' },
      ],
    },
  ]);

  const [subGroups, setSubGroups] = useState([
    {
      id: 1,
      name: 'SUVs',
      assetType: 'Car',
      specificData: [{ name: 'Ground Clearance', type: 'number' }],
    },
    {
      id: 2,
      name: 'Beachfront Villas',
      assetType: 'Property',
      specificData: [{ name: 'Distance to Beach', type: 'number' }],
    },
  ]);

  const [newSubGroup, setNewSubGroup] = useState({
    name: '',
    assetType: '',
    specificData: [],
  });

  const [newSpecificData, setNewSpecificData] = useState({
    name: '',
    type: 'text',
  });

  // New state for booking forms

  const handleAddSubGroup = (e) => {
    e.preventDefault();
    const id = subGroups.length + 1;
    setSubGroups([...subGroups, { id, ...newSubGroup }]);
    setNewSubGroup({ name: '', assetType: '', specificData: [] });
  };

  const handleAddSpecificData = () => {
    setNewSubGroup({
      ...newSubGroup,
      specificData: [...newSubGroup.specificData, newSpecificData],
    });
    setNewSpecificData({ name: '', type: 'text' });
  };

  const handleRemoveSpecificData = (index) => {
    const updatedSpecificData = newSubGroup.specificData.filter(
      (_, i) => i !== index
    );
    setNewSubGroup({ ...newSubGroup, specificData: updatedSpecificData });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New Sub Group</CardTitle>
          <CardDescription>
            Create sub-groups for asset types with specific data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubGroup} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='sub-group-name'>Sub Group Name</Label>
              <Input
                id='sub-group-name'
                placeholder='Enter sub group name'
                value={newSubGroup.name}
                onChange={(e) =>
                  setNewSubGroup({ ...newSubGroup, name: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='asset-type'>Asset Type</Label>
              <Select
                value={newSubGroup.assetType}
                onValueChange={(value) =>
                  setNewSubGroup({ ...newSubGroup, assetType: value })
                }
              >
                <SelectTrigger id='asset-type'>
                  <SelectValue placeholder='Select asset type' />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Specific Data</Label>
              {newSubGroup.specificData.map((field, index) => (
                <div key={index} className='flex items-center space-x-2'>
                  <Input value={field.name} readOnly />
                  <Select value={field.type} disabled>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='text'>Text</SelectItem>
                      <SelectItem value='number'>Number</SelectItem>
                      <SelectItem value='date'>Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => handleRemoveSpecificData(index)}
                  >
                    <XIcon className='h-4 w-4' />
                  </Button>
                </div>
              ))}
              <div className='flex items-center space-x-2'>
                <Input
                  placeholder='Field name'
                  value={newSpecificData.name}
                  onChange={(e) =>
                    setNewSpecificData({
                      ...newSpecificData,
                      name: e.target.value,
                    })
                  }
                />
                <Select
                  value={newSpecificData.type}
                  onValueChange={(value) =>
                    setNewSpecificData({
                      ...newSpecificData,
                      type: value,
                    })
                  }
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='text'>Text</SelectItem>
                    <SelectItem value='number'>Number</SelectItem>
                    <SelectItem value='date'>Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button type='button' onClick={handleAddSpecificData}>
                  Add Field
                </Button>
              </div>
            </div>
            <Button type='submit'>Add Sub Group</Button>
          </form>
        </CardContent>
      </Card>
      <Card className='mt-4'>
        <CardHeader>
          <CardTitle>Existing Sub Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Specific Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.assetType}</TableCell>
                  <TableCell>
                    {group.specificData
                      .map((field) => `${field.name} (${field.type})`)
                      .join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
