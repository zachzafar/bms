'use client';

import { useMemo, useState } from 'react';
import { Calendar, momentLocalizer, Event, SlotInfo, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/api/publicClient';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StorageService } from '@/lib/api/storage';
import { SelectAsset } from '@repo/api-contract';
import { parseAsLocalDate, addDays } from '@/lib/utils/date';

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  customerName: string;
};

type BlockedDate = {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  reason?: string;
};

const localizer = momentLocalizer(moment);


export default function AssetAvailabilityCalendar({ asset }: { asset: SelectAsset }) {
  const [blockTitle, setBlockTitle] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // Fetch bookings using React Query
  const { data: bookingsResponse } = authClient.booking.getBookings.useQuery({
    queryKey: ['asset-bookings', asset.id],
    queryData: { query: { assetId: asset.id } },
  });

  // Fetch blocked dates using React Query
  const { data: blockedDatesResponse, refetch: refetchBlockedDates } = authClient.blockedDates.getBlockedDates.useQuery({
    queryKey: ['asset-blocked-dates', asset.id],
    queryData: { query: { assetId: asset.id } },
  });

  // Transform bookings data
  const bookings: Booking[] = useMemo(() => {
    if (bookingsResponse?.status !== 200) return [];
    const body = bookingsResponse.body;
    const data = Array.isArray(body) ? body : body.data;
    return data.map((b) => ({
      id: Number(b.id),
      startDate: b.startDate,
      endDate: b.endDate,
      customerName: b.customer?.name || 'Unknown',
    }));
  }, [bookingsResponse]);

  // Transform blocked dates data
  const blocked: BlockedDate[] = useMemo(() => {
    if (blockedDatesResponse?.status !== 200) return [];
    const body = blockedDatesResponse.body;
    return Array.isArray(body)
      ? body.map((b: any) => ({
          id: b.id,
          startDate: b.startDate,
          endDate: b.endDate,
          title: b.title,
          reason: b.reason,
        }))
      : [];
  }, [blockedDatesResponse]);

  const createBlockedDateMutation = authClient.blockedDates.createBlockedDate.useMutation({
    onSuccess: () => {
      toast.success('Blocked date created');
      refetchBlockedDates();
    },
    onError: () => {
      toast.error('Failed to create blocked date');
    },
  });

  const deleteBlockedDateMutation = authClient.blockedDates.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success('Blocked date deleted');
      refetchBlockedDates();
    },
    onError: () => {
      toast.error('Failed to delete blocked date');
    },
  });

  // Build Calendar Events
  // Note: react-big-calendar treats end date as EXCLUSIVE for all-day events,
  // so we add 1 day to the end date to display through the last day
  const bookingEvents: Event[] = bookings.map((b) => {
    const start = parseAsLocalDate(b.startDate);
    const end = parseAsLocalDate(b.endDate);
    return {
      title: `${asset.name} - Booking: ${b.customerName}`,
      start,
      end: addDays(end, 1), // +1 because react-big-calendar end is exclusive
      allDay: true,
      resource: { type: 'booking' },
    };
  });

  const blockedEvents: Event[] = blocked.map((b) => {
    const start = parseAsLocalDate(b.startDate);
    const end = parseAsLocalDate(b.endDate);
    return {
      title: `${asset.name} - ${b.title || 'Blocked'}`,
      start,
      end: addDays(end, 1), // +1 because react-big-calendar end is exclusive
      allDay: true,
      resource: { type: 'blocked', id: b.id },
    };
  });

  const tempEvent: Event[] = selectedRange
    ? [
        {
          title: blockTitle || 'New Block',
          start: selectedRange.start,
          end: selectedRange.end,
          allDay: true,
          resource: { temp: true },
        },
      ]
    : [];

  const events = [...bookingEvents, ...blockedEvents, ...tempEvent];

  const handleBlock = async () => {
    if (!selectedRange) return;

    const currentTenant = StorageService.getTenant();
    const tenantId = currentTenant?.id ?? '';

    const startDate = selectedRange.start;
    const endCopy = new Date(selectedRange.end);
    endCopy.setDate(endCopy.getDate() - 1);
    const endDate = endCopy;

    await createBlockedDateMutation.mutateAsync({
      body: {
        tenantId,
        assetId: asset.id,
        startDate,
        endDate,
        title: blockTitle,
        reason: 'Manual Block',
      },
    });

    setSelectedRange(null);
    setBlockTitle('');
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this blocked date?')) {
      deleteBlockedDateMutation.mutate({ params: { id }, body: undefined });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto p-4">
      <CardHeader>
        <CardTitle>{asset.name} Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: 700 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={currentView}
            onNavigate={setCurrentDate}
            onView={setCurrentView}
            selectable
            onSelectSlot={(slotInfo: SlotInfo) => setSelectedRange({ start: slotInfo.start, end: slotInfo.end })}
            eventPropGetter={(event) => {
              if (event.resource?.temp) {
                return {
                  style: { backgroundColor: 'rgba(0,128,255,0.3)', border: '1px solid #007BFF' },
                };
              }
              if (event.resource?.type === 'booking') {
                return {
                  style: { backgroundColor: 'rgba(0,180,0,0.7)', color: 'white', fontWeight: 'bold' },
                };
              }
              if (event.resource?.type === 'blocked') {
                return {
                  style: { backgroundColor: 'rgba(255,0,0,0.7)', color: 'white' },
                };
              }
              return {};
            }}
            components={{
              event: ({ event }: any) => (
                <div className="truncate text-xs text-center">{event.title}</div>
              ),
            }}
          />
        </div>

        <div className="mt-2">
          <input
            type="text"
            placeholder="Blocked date title"
            value={blockTitle}
            onChange={(e) => setBlockTitle(e.target.value)}
            className="border rounded p-1 w-full"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleBlock} disabled={!selectedRange}>
            Add Blocked Dates
          </Button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Blocked Dates</h2>
          {blocked.length === 0 ? (
            <p className="text-muted-foreground">No blocked dates</p>
          ) : (
            <ul className="space-y-2">
              {blocked.map((b) => {
                const start = parseAsLocalDate(b.startDate);
                const end = parseAsLocalDate(b.endDate);
                return (
                  <li key={b.id} className="flex items-center justify-between rounded-lg border p-2">
                    <span>
                      {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                      -{' '}
                      {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {b.reason ? ` (${b.reason})` : ''}
                    </span>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
