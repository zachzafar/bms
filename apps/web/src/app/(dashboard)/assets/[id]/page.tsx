'use client';

import { useState } from 'react';
import  AssetAvailabilityCalendar  from '@/app/(dashboard)/assets/[id]/AssetAvailabilityCalendar';
import AssetTypePropertiesForm from './AssetTypePropertiesForm';
import { useParams } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import Loading from '@/components/custom/Loading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BasicInfo from './BasicInfo';
import Images from './Images';
import AssetBookings from '@/components/custom/AssetBookings';

export default function AssetDetailsPage() {
  const [activeTab,setActiveTab] = useState("basic-information")
  const params = useParams();
  const { data, isLoading} = authClient.assets.getAsset.useQuery({
    queryKey: ["assets", params.id as string],
    queryData:  {
      params: {
        id: params.id as string,
      },
    },
  });

  const asset = data?.status === 200 ? data.body : null

  if (isLoading || !asset) {
    return <Loading/>
  }

return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>
          Asset Details: {asset?.name}
        </h1>
      </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList>
              <TabsTrigger value='basic-information'>Basic Information</TabsTrigger>
              <TabsTrigger value='detailed-information'>Details Information</TabsTrigger>
              <TabsTrigger value="availabilities">Availabilities</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            <TabsContent value='basic-information'>
              <BasicInfo asset={asset}/>
            </TabsContent>
            <TabsContent value='detailed-information'>
              <AssetTypePropertiesForm asset={asset}/>
            </TabsContent>
            <TabsContent value="availabilities">
               <AssetAvailabilityCalendar asset={asset}/>
            </TabsContent>
            <TabsContent value="bookings">
               <AssetBookings asset={asset} />
            </TabsContent>
            <TabsContent value="images">
               <Images asset={asset}/>
            </TabsContent>
          </Tabs>
    </>
  );
}


//   return (
//     <>
//       <div className='flex items-center'>
//         <h1 className='font-semibold text-lg md:text-2xl'>
//           Asset Details: {asset?.name}
//         </h1>
//       </div>
//       <form >
//         <Card>
//           <CardHeader>
//             <CardTitle>Basic Information</CardTitle>
//             <CardDescription>
//               Edit the basic details of your asset.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className='space-y-4'>
//             <div className='space-y-2'>
//               <Label htmlFor='name'>Asset Name</Label>
//               <Input
//                 id='name'
//                 name='name'
//                 value={asset?.name}
//                 // onChange={handleInputChange}
//               />
//             </div>
//             <div className='space-y-2'>
//               <Label htmlFor='type'>Asset Type</Label>
//               <Input
//                 id='type'
//                 name='type'
//                 value={asset?.assetTypeId}
//                 // onChange={handleInputChange}
//                 readOnly
//               />
//             </div>
//             {/* <div className='space-y-2'>
//               <Label htmlFor='subgroup'>Subgroup</Label>
//               <Input
//                 id='subgroup'
//                 name='subgroup'
//                 value={asset.subgroup}
//                 onChange={handleInputChange}
//                 readOnly
//               />
//             </div> */}
//             {/* <div className='space-y-2'>
//               <Label htmlFor='status'>Status</Label>
//               <Select
//                 name='status'
//                 value={asset.status}
//                 onValueChange={(value) => setAsset({ ...asset, status: value })}
//               >
//                 <SelectTrigger id='status'>
//                   <SelectValue placeholder='Select status' />
//                 </SelectTrigger>
//                 <SelectContent> 
//                   <SelectItem value='Available'>Available</SelectItem>
//                   <SelectItem value='In Use'>In Use</SelectItem>
//                   <SelectItem value='Maintenance'>Maintenance</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div> */}
//             {/* <div className='flex items-center space-x-2'>
//               <Switch
//                 id='requires-approval'
//                 checked={asset.requiresApproval}
//                 onCheckedChange={handleSwitchChange}
//               />
//               <Label htmlFor='requires-approval'>Requires Approval</Label>
//             </div> */}
//           </CardContent>
//         </Card>

//         <Card className='mt-4'>
//           <CardHeader>
//             <CardTitle>Detailed Information</CardTitle>
//             <CardDescription>
//               Provide more details about your asset.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className='space-y-4'>
//             <AssetTypePropertiesForm asset={asset} />
//           </CardContent>
//         </Card>

//           <AssetAvailabilityCalendar
//             asset={asset}
//           />
          
//           <AssetBookings bookings={bookings} />
          
//           <Card className='mt-4'>
//             <CardHeader>
//               <CardTitle>Images</CardTitle>
//               <CardDescription>
//                 Upload and manage images of this asset.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className='space-y-4'>
//               <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
//                 {images.map((image, index) => (
//                   <div key={index} className='relative aspect-square'>
//                     <Image
//                       src={image}
//                       alt={`Asset image ${index + 1}`}
//                       fill
//                       className='object-cover rounded-md'
//                     />
//                     <Button
//                       variant='destructive'
//                       size='icon'
//                       className='absolute top-2 right-2'
//                       onClick={() => {
//                         const newImages = images.filter((_, i) => i !== index);
//                         setImages(newImages);
//                       }}
//                     >
//                       <XIcon className='h-4 w-4' />
//                     </Button>
//                   </div>
//                 ))}
//                 <label className='border-2 border-dashed rounded-md aspect-square flex items-center justify-center cursor-pointer hover:bg-secondary/50'>
//                   <input
//                     type='file'
//                     accept='image/*'
//                     multiple
//                     className='hidden'
//                     onChange={handleImageUpload}
//                   />
//                   <div className='text-center'>
//                     <UploadIcon className='mx-auto h-8 w-8 text-muted-foreground' />
//                     <span className='mt-2 block text-sm text-muted-foreground'>
//                       Upload Images
//                     </span>
//                   </div>
//                 </label>
//               </div>
//             </CardContent>
//           </Card>

//         <CardFooter className='mt-4'>
//           <Button type='submit' className='w-full'>
//             Save Changes
//           </Button>
//         </CardFooter>
//       </form>
//     </>
//   );
// }
