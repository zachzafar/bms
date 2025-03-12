'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectAsset } from '@repo/api-contract';
import { authClient } from '@/lib/api/publicClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DateRange {
  from: Date;
  to: Date;
  price?: number;
  available?: boolean;
}

interface AssetAvailabilityCalendarProps {
  initialRanges?: DateRange[];
  onRangesChange: (ranges: DateRange[]) => void;
}

export default function AssetAvailabilityCalendar({
  asset }: { asset: SelectAsset}) {
  const { data: availabilities} = authClient.booking.getAssetAvailability.useQuery({ 
    queryKey: ['availability',asset.id], 
    queryData: { params: {id: asset.id }} 
  });
  const { mutate } = authClient.booking.createAssetAvailability.useMutation();

  const ranges = availabilities?.status == 200 ? availabilities.body.map(availability => availability): []
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [available, setavailable] = useState(false);

  const handleAddRange = () => {
    const newRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      price,
      available,
      assetId: asset.id
    };
    mutate({ body: newRange });
    setStartDate('');
    setEndDate('');
    setPrice('');
    setavailable(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Price per day</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setavailable(e.target.checked)}
                className="mr-2"
              />
              Block these dates
            </Label>
          </div>
          <Button onClick={handleAddRange} className="w-full">
            Add Range
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability Ranges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.map((range, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(range.startDate).toLocaleDateString()} - {new Date(range.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{range.available ? 'Available' : 'Blocked'}</TableCell>
                  <TableCell>{range.price ? `$${range.price}/day` : 'No price set'}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Add delete mutation here
                      }}
                    >
                      Remove
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