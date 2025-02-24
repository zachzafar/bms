'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRange {
  from: Date;
  to: Date;
  price?: number;
  isBlocked?: boolean;
}

interface AssetAvailabilityCalendarProps {
  initialRanges?: DateRange[];
  onRangesChange: (ranges: DateRange[]) => void;
}

export default function AssetAvailabilityCalendar({
  initialRanges = [],
  onRangesChange,
}: AssetAvailabilityCalendarProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: new Date(), to: new Date() });
  const [ranges, setRanges] = useState<DateRange[]>(initialRanges);
  const [price, setPrice] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);

  const handleRangeSelect = (range: { from: Date; to: Date }) => {
    setSelectedRange(range);
  };

  const handleAddRange = () => {
    const newRange = {
      ...selectedRange,
      price: price ? parseFloat(price) : undefined,
      isBlocked,
    };
    const updatedRanges = [...ranges, newRange];
    setRanges(updatedRanges);
    onRangesChange(updatedRanges);
    setPrice('');
    setIsBlocked(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability & Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range) => range && handleRangeSelect(range)}
              numberOfMonths={2}
              className="rounded-md border"
            />
          </div>
          <div className="w-[200px] space-y-4">
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
              <Label>
                <input
                  type="checkbox"
                  checked={isBlocked}
                  onChange={(e) => setIsBlocked(e.target.checked)}
                  className="mr-2"
                />
                Block these dates
              </Label>
            </div>
            <Button onClick={handleAddRange} className="w-full">
              Add Range
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Set Ranges</h3>
          <div className="space-y-2">
            {ranges.map((range, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div>
                  <div className="font-medium">
                    {range.from.toLocaleDateString()} - {range.to.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {range.isBlocked
                      ? 'Blocked'
                      : range.price
                      ? `$${range.price}/day`
                      : 'No price set'}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const updatedRanges = ranges.filter((_, i) => i !== index);
                    setRanges(updatedRanges);
                    onRangesChange(updatedRanges);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}