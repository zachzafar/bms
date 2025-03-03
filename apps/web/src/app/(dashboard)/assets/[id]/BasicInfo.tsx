import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@radix-ui/react-switch'
import { SelectAsset } from '@repo/api-contract'
import React from 'react'
import { Label } from '@/components/ui/label'

function BasicInfo({asset}: {asset: SelectAsset}) {
  return (
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
                value={asset?.name}
                // onChange={handleInputChange}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='type'>Asset Type</Label>
              <Input
                id='type'
                name='type'
                value={asset?.assetTypeId}
                // onChange={handleInputChange}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
  )
}

export default BasicInfo