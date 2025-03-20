import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { XIcon, UploadIcon, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SelectAsset } from '@repo/api-contract';
import { authClient, axiosClient } from '@/lib/api/publicClient';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

function Images({asset}: {asset: SelectAsset}) {
  // Fetch existing images
  const {data: assetImagesResponse, refetch: refetchImages} = authClient.assets.getAssetImages.useQuery({
    queryKey: ['ASSET_IMAGES', asset.id],
    queryData: {
      params: { id: asset.id },
    },
  });

  // Upload mutation
  const { mutate: uploadImages, isPending: isUploading } = authClient.assets.uploadAssetImages.useMutation();
  
  // Delete mutation
  const { mutate: deleteImages, isPending: isDeleting } = authClient.assets.deleteAssetImages.useMutation();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState<number[]>([]);
  
  // Get actual image paths from response
  const existingImages = assetImagesResponse?.status === 200 ? assetImagesResponse.body : [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Create FormData for upload
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      await axiosClient.post(`/asset/${asset.id}/images`, formData);
      refetchImages();
      toast({
        title: "Success",
        description: `Successfully uploaded ${files.length} image${files.length > 1?'s' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive"
      });
    }
    
    
  };

  const toggleImageSelection = (imageId: number) => {
    setSelectedForDeletion(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId) 
        : [...prev, imageId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedForDeletion.length === 0) return;
    
    deleteImages({
      params: { id: asset.id },
      body: { images: selectedForDeletion }
    }, {
      onSuccess: (response) => {
        if (response.status === 204) {
          toast({
            title: "Success",
            description: `Successfully deleted ${selectedForDeletion.length} image${selectedForDeletion.length > 1 ? 's' : ''}`,
          });
        } else {
          // Handle partial success
          toast({
            title: "Partial Success",
            description: `Some images could not be deleted. Please try again.`,
            variant: "destructive"
          });
        }
        setSelectedForDeletion([]);
        refetchImages();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete images",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <>
      <Card className='mt-4'>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Upload and manage images of this asset.
            </CardDescription>
          </div>
          {selectedForDeletion.length > 0 && (
            <Button 
              variant='destructive' 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XIcon className='h-4 w-4 mr-2' />
              )}
              Delete Selected ({selectedForDeletion.length})
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {existingImages.map((image, index) => (
              <div 
                key={index} 
                className={`relative aspect-square border-2 rounded-md ${
                  selectedForDeletion.includes(image.id) ? 'border-destructive' : 'border-transparent'
                }`}
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer w-full h-full">
                      <Image
                        src={image.filePath}
                        alt={`Asset image ${index + 1}`}
                        fill
                        className='object-cover rounded-md'
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="relative w-full h-[80vh]">
                      <Image
                        src={image.filePath}
                        alt={`Asset image ${index + 1}`}
                        fill
                        className='object-contain'
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant={selectedForDeletion.includes(image.id) ? 'destructive' : 'secondary'}
                  size='icon'
                  className='absolute top-2 right-2 opacity-80 hover:opacity-100'
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageSelection(image.id);
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
                disabled={isUploading}
              />
              <div className='text-center'>
                {isUploading ? (
                  <>
                    <Loader2 className='mx-auto h-8 w-8 text-muted-foreground animate-spin' />
                    <span className='mt-2 block text-sm text-muted-foreground'>
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <UploadIcon className='mx-auto h-8 w-8 text-muted-foreground' />
                    <span className='mt-2 block text-sm text-muted-foreground'>
                      Upload Images
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default Images;