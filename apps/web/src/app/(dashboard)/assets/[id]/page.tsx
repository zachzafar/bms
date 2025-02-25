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
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UploadIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import  AssetAvailabilityCalendar  from '@/components/custom/AssetAvailabilityCalendar';
import  AssetBookings from '@/components/custom/AssetBookings';

export default function AssetDetailsPage() {
  const [asset, setAsset] = useState({
    id: 1,
    name: 'Toyota Camry',
    type: 'Car',
    subgroup: 'Sedan',
    status: 'Available',
    requiresApproval: false,
    description: 'A reliable mid-size sedan perfect for city driving.',
    capacity: 5,
    features: ['Air Conditioning', 'Bluetooth', 'Backup Camera'],
    rentalRate: 50,
    location: 'New York City',
    maintenanceSchedule: 'Every 6 months or 5000 miles',
    files: [],
  });

  const [newFeature, setNewFeature] = useState('');
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState<string[]>([]);
  const [dateRanges, setDateRanges] = useState([]);
  const [bookings, setBookings] = useState([]); // You'll fetch this from your API

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAsset({ ...asset, [name]: value });
  };

  const handleSwitchChange = (checked) => {
    setAsset({ ...asset, requiresApproval: checked });
  };

  const handleAddFeature = () => {
    if (newFeature.trim() !== '') {
      setAsset({ ...asset, features: [...asset.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    const updatedFeatures = asset.features.filter((_, i) => i !== index);
    setAsset({ ...asset, features: updatedFeatures });
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles([...files, ...uploadedFiles]);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the updated asset data and files to your backend
    console.log('Updated asset:', asset);
    console.log('Files to upload:', files);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Here you would typically upload to your backend/storage
    // For now, we'll just create object URLs
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
  };

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>
          Asset Details: {asset.name}
        </h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Edit the basic details of your asset.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Asset Name</Label>
              <Input
                id='name'
                name='name'
                value={asset.name}
                onChange={handleInputChange}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='type'>Asset Type</Label>
              <Input
                id='type'
                name='type'
                value={asset.type}
                onChange={handleInputChange}
                readOnly
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='subgroup'>Subgroup</Label>
              <Input
                id='subgroup'
                name='subgroup'
                value={asset.subgroup}
                onChange={handleInputChange}
                readOnly
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                name='status'
                value={asset.status}
                onValueChange={(value) => setAsset({ ...asset, status: value })}
              >
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Available'>Available</SelectItem>
                  <SelectItem value='In Use'>In Use</SelectItem>
                  <SelectItem value='Maintenance'>Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center space-x-2'>
              <Switch
                id='requires-approval'
                checked={asset.requiresApproval}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor='requires-approval'>Requires Approval</Label>
            </div>
          </CardContent>
        </Card>

        <Card className='mt-4'>
          <CardHeader>
            <CardTitle>Detailed Information</CardTitle>
            <CardDescription>
              Provide more details about your asset.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                name='description'
                value={asset.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='capacity'>Capacity</Label>
              <Input
                id='capacity'
                name='capacity'
                type='number'
                value={asset.capacity}
                onChange={handleInputChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>Features</Label>
              <div className='flex flex-wrap gap-2'>
                {asset.features.map((feature, index) => (
                  <div
                    key={index}
                    className='flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm'
                  >
                    {feature}
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='ml-2 h-4 w-4 p-0'
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <XIcon className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
              <div className='flex gap-2'>
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder='Add a feature'
                />
                <Button type='button' onClick={handleAddFeature}>
                  Add
                </Button>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='rentalRate'>Rental Rate (per day)</Label>
              <Input
                id='rentalRate'
                name='rentalRate'
                type='number'
                value={asset.rentalRate}
                onChange={handleInputChange}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='location'>Location</Label>
              <Input
                id='location'
                name='location'
                value={asset.location}
                onChange={handleInputChange}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='maintenanceSchedule'>Maintenance Schedule</Label>
              <Input
                id='maintenanceSchedule'
                name='maintenanceSchedule'
                value={asset.maintenanceSchedule}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='mt-4'>
          <CardHeader>
            <CardTitle>File Uploads</CardTitle>
            <CardDescription>
              Upload images or documents related to this asset.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='file-upload'>Upload Files</Label>
              <Input
                id='file-upload'
                type='file'
                multiple
                onChange={handleFileUpload}
                className='file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90'
              />
            </div>
            {files.length > 0 && (
              <div className='space-y-2'>
                <Label>Uploaded Files</Label>
                <ul className='space-y-2'>
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className='flex items-center justify-between bg-secondary rounded-md p-2'
                    >
                      <span className='text-sm'>{file.name}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveFile(index)}
                      >
                        <XIcon className='h-4 w-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

          <AssetAvailabilityCalendar
            initialRanges={dateRanges}
            onRangesChange={setDateRanges}
          />
          
          <AssetBookings bookings={bookings} />
          
          <Card className='mt-4'>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload and manage images of this asset.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {images.map((image, index) => (
                  <div key={index} className='relative aspect-square'>
                    <Image
                      src={image}
                      alt={`Asset image ${index + 1}`}
                      fill
                      className='object-cover rounded-md'
                    />
                    <Button
                      variant='destructive'
                      size='icon'
                      className='absolute top-2 right-2'
                      onClick={() => {
                        const newImages = images.filter((_, i) => i !== index);
                        setImages(newImages);
                      }}
                    >
                      <XIcon className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <label className='border-2 border-dashed rounded-md aspect-square flex items-center justify-center cursor-pointer hover:bg-secondary/50'>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    onChange={handleImageUpload}
                  />
                  <div className='text-center'>
                    <UploadIcon className='mx-auto h-8 w-8 text-muted-foreground' />
                    <span className='mt-2 block text-sm text-muted-foreground'>
                      Upload Images
                    </span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

        <CardFooter className='mt-4'>
          <Button type='submit' className='w-full'>
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
