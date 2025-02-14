'use client';

import { useState, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Package2Icon,
  PlusIcon,
  FilterIcon,
  SearchIcon,
  FileIcon,
  DownloadIcon,
} from 'lucide-react';
import Image from 'next/image';

export default function Component() {
  const [maintenanceTasks, setMaintenanceTasks] = useState([
    {
      id: 1,
      assetName: 'Toyota Camry',
      assetType: 'Car',
      taskDescription: 'Oil Change',
      dueDate: '2023-07-20',
      status: 'Pending',
      cost: 50,
      files: [],
    },
    {
      id: 2,
      assetName: 'Conference Room A',
      assetType: 'Room',
      taskDescription: 'Deep Cleaning',
      dueDate: '2023-07-25',
      status: 'Scheduled',
      cost: 200,
      files: ['invoice.pdf'],
    },
    {
      id: 3,
      assetName: 'Projector #2',
      assetType: 'Equipment',
      taskDescription: 'Lamp Replacement',
      dueDate: '2023-07-18',
      status: 'In Progress',
      cost: 150,
      files: ['quote.pdf', 'workorder.pdf'],
    },
    {
      id: 4,
      assetName: 'Honda Civic',
      assetType: 'Car',
      taskDescription: 'Brake Inspection',
      dueDate: '2023-07-22',
      status: 'Completed',
      cost: 75,
      files: ['receipt.pdf'],
    },
    {
      id: 5,
      assetName: 'Deluxe Suite 101',
      assetType: 'Room',
      taskDescription: 'AC Maintenance',
      dueDate: '2023-07-19',
      status: 'Pending',
      cost: 100,
      files: [],
    },
  ]);

  const [newTask, setNewTask] = useState({
    assetName: '',
    assetType: '',
    taskDescription: '',
    dueDate: new Date(),
    status: 'Pending',
    cost: 0,
    files: [],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTask, setSelectedTask] = useState(null);
  const fileInputRef = useRef(null);

  const filteredTasks = maintenanceTasks
    .filter(
      (task) =>
        (searchTerm === '' ||
          task.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.taskDescription
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (filterType === 'All' || task.assetType === filterType) &&
        (filterStatus === 'All' || task.status === filterStatus)
    )
    .sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    const id = maintenanceTasks.length + 1;
    setMaintenanceTasks([
      ...maintenanceTasks,
      { id, ...newTask, dueDate: newTask.dueDate.toISOString().split('T')[0] },
    ]);
    setNewTask({
      assetName: '',
      assetType: '',
      taskDescription: '',
      dueDate: new Date(),
      status: 'Pending',
      cost: 0,
      files: [],
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    setMaintenanceTasks(
      maintenanceTasks.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map((file) => file.name);
    setNewTask({ ...newTask, files: [...newTask.files, ...files] });
  };

  const handleRemoveFile = (fileName) => {
    setNewTask({
      ...newTask,
      files: newTask.files.filter((file) => file !== fileName),
    });
  };

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Maintenance Tasks</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className='ml-auto' size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Maintenance Task</DialogTitle>
              <DialogDescription>
                Enter the details for the new maintenance task.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTask} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='asset-name'>Asset Name</Label>
                <Input
                  id='asset-name'
                  placeholder='Enter asset name'
                  value={newTask.assetName}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assetName: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='asset-type'>Asset Type</Label>
                <Select
                  value={newTask.assetType}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, assetType: value })
                  }
                >
                  <SelectTrigger id='asset-type'>
                    <SelectValue placeholder='Select asset type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Car'>Car</SelectItem>
                    <SelectItem value='Room'>Room</SelectItem>
                    <SelectItem value='Equipment'>Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='task-description'>Task Description</Label>
                <Input
                  id='task-description'
                  placeholder='Enter task description'
                  value={newTask.taskDescription}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      taskDescription: e.target.value,
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Due Date</Label>
                <Calendar
                  mode='single'
                  selected={newTask.dueDate}
                  onSelect={(date) => setNewTask({ ...newTask, dueDate: date })}
                  className='rounded-md border'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='task-cost'>Estimated Cost ($)</Label>
                <Input
                  id='task-cost'
                  type='number'
                  placeholder='Enter estimated cost'
                  value={newTask.cost}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      cost: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='file-upload'>Upload Files</Label>
                <Input
                  id='file-upload'
                  type='file'
                  multiple
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className='hidden'
                />
                <Button
                  type='button'
                  onClick={() => fileInputRef.current.click()}
                >
                  Select Files
                </Button>
                {newTask.files.length > 0 && (
                  <ul className='mt-2 space-y-1'>
                    {newTask.files.map((file, index) => (
                      <li
                        key={index}
                        className='flex items-center justify-between'
                      >
                        <span>{file}</span>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleRemoveFile(file)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button type='submit'>Add Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <Input
            className='max-w-xs'
            placeholder='Search tasks...'
            type='search'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size='icon' variant='outline'>
            <SearchIcon className='h-4 w-4' />
            <span className='sr-only'>Search</span>
          </Button>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Types</SelectItem>
              <SelectItem value='Car'>Car</SelectItem>
              <SelectItem value='Room'>Room</SelectItem>
              <SelectItem value='Equipment'>Equipment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Statuses</SelectItem>
              <SelectItem value='Pending'>Pending</SelectItem>
              <SelectItem value='Scheduled'>Scheduled</SelectItem>
              <SelectItem value='In Progress'>In Progress</SelectItem>
              <SelectItem value='Completed'>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='border shadow-sm rounded-lg overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>
                <Button variant='ghost' onClick={() => handleSort('id')}>
                  Task ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('assetName')}>
                  Asset{' '}
                  {sortBy === 'assetName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('assetType')}>
                  Type{' '}
                  {sortBy === 'assetType' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  onClick={() => handleSort('taskDescription')}
                >
                  Description{' '}
                  {sortBy === 'taskDescription' &&
                    (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('dueDate')}>
                  Due Date{' '}
                  {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('status')}>
                  Status{' '}
                  {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('cost')}>
                  Cost ($){' '}
                  {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className='font-medium'>{task.id}</TableCell>
                <TableCell>{task.assetName}</TableCell>
                <TableCell>{task.assetType}</TableCell>
                <TableCell>{task.taskDescription}</TableCell>
                <TableCell>{task.dueDate}</TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>${task.cost.toFixed(2)}</TableCell>
                <TableCell>
                  {task.files.map((file, index) => (
                    <Button
                      key={index}
                      variant='ghost'
                      size='sm'
                      className='mr-2'
                    >
                      <FileIcon className='mr-2 h-4 w-4' />
                      {file}
                    </Button>
                  ))}
                </TableCell>
                <TableCell>
                  <Select
                    value={task.status}
                    onValueChange={(value) =>
                      handleUpdateStatus(task.id, value)
                    }
                  >
                    <SelectTrigger className='w-[140px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Pending'>Pending</SelectItem>
                      <SelectItem value='Scheduled'>Scheduled</SelectItem>
                      <SelectItem value='In Progress'>In Progress</SelectItem>
                      <SelectItem value='Completed'>Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
