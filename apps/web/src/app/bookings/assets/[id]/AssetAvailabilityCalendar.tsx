'use client';

import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event, SlotInfo, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/api/publicClient';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StorageService } from '@/lib/api/storage';
import { SelectAsset } from '@/lib/api-contract';

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  customerName: string;
};

type BlockedDate = {
  id: number;
  startDate: string; // expected 'YYYY-MM-DD' or ISO
  endDate: string;   // expected 'YYYY-MM-DD' or ISO
  title: string;
  reason?: string;
};

const localizer = momentLocalizer(moment);

function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// NEW helper: parse a date-only 'YYYY-MM-DD' as a local Date (avoids UTC shift)
function parseDateOnly(dateStr: string) {
  // if string includes time or 'T', just rely on Date constructor (it has time info)
  if (dateStr.includes('T')) return new Date(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0); // local midnight
}

export default function AssetAvailabilityCalendar({ asset }: { asset: SelectAsset }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [blockTitle, setBlockTitle] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  const createBlockedDateMutation = authClient.booking.createBlockedDate.useMutation();
  const deleteBlockedDateMutation = authClient.booking.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success('Blocked date deleted');
      fetchBlockedDates();
    },
    onError: () => {
      toast.error('Failed to delete blocked date');
    },
  });

  const fetchBookings = async () => {
    const res = await authClient.booking.getBookings.query({
      query: { assetId: asset.id },
    });

    const bookingsData: Booking[] = Array.isArray(res.body)
      ? res.body.map((b: any) => ({
          id: Number(b.id),
          startDate: b.startDate,
          endDate: b.endDate,
          customerName: b.user?.name || 'Unknown',
        }))
      : [];

    setBookings(bookingsData);
  };

  const fetchBlockedDates = async () => {
    const res = await authClient.booking.getBlockedDates.query({
      query: { assetId: asset.id },
    });

    const blockedData: BlockedDate[] = Array.isArray(res.body)
      ? res.body.map((b: any) => ({
          id: b.id,
          startDate: b.startDate,
          endDate: b.endDate,
          title: b.title,
          reason: b.reason,
        }))
      : [];

    setBlocked(blockedData);
  };

  useEffect(() => {
    fetchBookings();
    fetchBlockedDates();
  }, [asset.id]);

  // Build Calendar Events
  const bookingEvents: Event[] = bookings.map((b) => {
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    const startPlusOne = new Date(start);
    startPlusOne.setDate(startPlusOne.getDate() + 1);
    const endPlusOne = new Date(end);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    return {
      title: `${asset.name} - Booking: ${b.customerName}`,
      start: startPlusOne,
      end: endPlusOne,
      allDay: true,
      resource: { type: 'booking' },
    };
  });

  const blockedEvents: Event[] = blocked.map((b) => {
    // Use parseDateOnly so 'YYYY-MM-DD' is treated as local midnight
    const start = parseDateOnly(b.startDate);
    const end = parseDateOnly(b.endDate);
    const startPlusOne = new Date(start);
    startPlusOne.setDate(startPlusOne.getDate());
    const endPlusOne = new Date(end);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    return {
      title: `${asset.name} - ${b.title || 'Blocked'}`,
      start: startPlusOne,
      end: endPlusOne,
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

    const startDate = formatLocalDate(selectedRange.start);
    const endCopy = new Date(selectedRange.end);
    endCopy.setDate(endCopy.getDate() - 1);
    const endDate = formatLocalDate(endCopy);

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
    fetchBlockedDates();
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this blocked date?')) {
      deleteBlockedDateMutation.mutate({ params: { id: String(id) }, body: undefined });
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
                // Use parseDateOnly for the list rendering too
                const start = parseDateOnly(b.startDate);
                const end = parseDateOnly(b.endDate);
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
