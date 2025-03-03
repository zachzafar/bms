import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { XIcon, UploadIcon } from 'lucide-react';
import React from 'react'

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SelectAsset } from '@repo/api-contract';

function Images({asset}: {asset: SelectAsset}) {
  const [images, setImages] = React.useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Here you would typically upload to your backend/storage
    // For now, we'll just create object URLs
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
  };

  return (
    <>
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
        </>
  )
}

export default Images