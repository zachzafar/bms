'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  momentLocalizer,
  Event,
  SlotInfo,
  View,
  DateHeaderProps,
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/api/publicClient';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StorageService } from '@/lib/api/storage';
import { SelectAsset } from '@repo/api-contract';
import { parseAsLocalDate, addDays } from '@/lib/utils/date';

const localizer = momentLocalizer(moment);

/* 🔹 helper */
const isDateInRange = (date: Date, start: Date, end: Date) => {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
};

/* 🔹 check if new range overlaps existing blocked dates */
const isOverlapping = (
  newStart: Date,
  newEnd: Date,
  blockedDates: { startDate: string; endDate: string }[]
) => {
  return blockedDates.some((b) => {
    const start = parseAsLocalDate(b.startDate);
    const end = parseAsLocalDate(b.endDate);
    return newStart <= end && newEnd >= start;
  });
};

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  customerName: string;
  status?: string;
};

type BlockedDate = {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  reason?: string;
};

export default function AssetAvailabilityCalendar({ asset }: { asset: SelectAsset }) {
  const [blockTitle, setBlockTitle] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  /* 🔹 Fetch bookings */
  const { data: bookingsResponse } = authClient.booking.getBookings.useQuery({
    queryKey: ['asset-bookings', asset.id],
    queryData: { query: { assetId: asset.id } },
  });

  /* 🔹 Fetch blocked dates */
  const { data: blockedDatesResponse, refetch: refetchBlockedDates } =
    authClient.blockedDates.getBlockedDates.useQuery({
      queryKey: ['asset-blocked-dates', asset.id],
      queryData: { query: { assetId: asset.id } },
    });

  /* 🔹 Transform bookings */
  const bookings: Booking[] = useMemo(() => {
    if (bookingsResponse?.status !== 200) return [];
    const body = bookingsResponse.body;
    const data = Array.isArray(body) ? body : body.data;
    return data.map((b) => ({
      id: Number(b.id),
      startDate: b.startDate,
      endDate: b.endDate,
      customerName: b.customer?.name || 'Unknown',
      status: b.status,
    }));
  }, [bookingsResponse]);

  /* 🔹 Transform blocked dates (manual only) */
  const blocked: BlockedDate[] = useMemo(() => {
    if (blockedDatesResponse?.status !== 200) return [];
    const body = blockedDatesResponse.body;
    return Array.isArray(body)
      ? body.filter((b: any) => b.reason === 'Manual Block').map((b: any) => ({
          id: b.id,
          startDate: b.startDate,
          endDate: b.endDate,
          title: b.title,
          reason: b.reason,
        }))
      : [];
  }, [blockedDatesResponse]);

  /* 🔹 Mutations */
  const createBlockedDateMutation = authClient.blockedDates.createBlockedDate.useMutation({
    onSuccess: () => {
      toast.success('Blocked date created');
      refetchBlockedDates();
      setSelectedRange(null);
      setBlockTitle('');
    },
    onError: () => toast.error('Failed to create blocked date'),
  });

  const deleteBlockedDateMutation = authClient.blockedDates.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success('Blocked date deleted');
      refetchBlockedDates();
    },
    onError: () => toast.error('Failed to delete blocked date'),
  });

  /* 🔹 Calendar events (bookings + temp selection only) */
  const bookingEvents: Event[] = useMemo(
    () =>
      bookings.map((b) => {
        const start = parseAsLocalDate(b.startDate);
        const end = parseAsLocalDate(b.endDate);
        return {
          title: `${asset.name} - ${b.customerName}`,
          start,
          end: addDays(end, 1),
          allDay: true,
          resource: { type: 'booking', status: b.status },
        };
      }),
    [bookings, asset.name]
  );

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

  const events = [...bookingEvents, ...tempEvent];

  /* 🔹 Handlers */
  const handleBlock = () => {
    if (!selectedRange) return;

    const startDate = selectedRange.start;
    const endDate = new Date(selectedRange.end);
    endDate.setDate(endDate.getDate() - 1); // react-big-calendar is exclusive on end

    if (isOverlapping(startDate, endDate, blocked)) {
      toast.error('Selected range overlaps with an existing blocked date.');
      return;
    }

    const tenantId = StorageService.getTenant()?.id ?? '';

    createBlockedDateMutation.mutate({
      body: {
        tenantId,
        assetId: asset.id,
        startDate,
        endDate,
        title: blockTitle,
        reason: 'Manual Block',
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this blocked date?')) {
      deleteBlockedDateMutation.mutate({ params: { id }, body: undefined });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{asset.name} Availability Calendar</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
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
            onSelectSlot={(slotInfo: SlotInfo) =>
              setSelectedRange({ start: slotInfo.start, end: slotInfo.end })
            }

            /* 🔹 Grey tiles for manual blocks (not events) */
            dayPropGetter={(date) => {
              const blockedDate = blocked.find((b) =>
                isDateInRange(date, parseAsLocalDate(b.startDate), parseAsLocalDate(b.endDate))
              );
              return blockedDate
                ? { style: { backgroundColor: '#E5E7EB' } }
                : {};
            }}

            /* 🔹 Event styles (bookings & temp selection only) */
            eventPropGetter={(event) => {
              if (event.resource?.temp) {
                return {
                  style: {
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgb(59, 130, 246)',
                  },
                };
              }

              if (event.resource?.type === 'booking') {
                const map: Record<string, { bg: string; border: string }> = {
                  Confirmed: { bg: 'rgba(34, 197, 94, 0.85)', border: 'rgb(22, 163, 74)' },
                  Pending: { bg: 'rgba(234, 179, 8, 0.85)', border: 'rgb(202, 138, 4)' },
                  Cancelled: { bg: 'rgba(239, 68, 68, 0.85)', border: 'rgb(220, 38, 38)' },
                };
                const colors = map[event.resource.status] ?? map.Confirmed;
                return {
                  style: {
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                  },
                };
              }

              return {};
            }}

            /* 🔹 Centered text for manual blocks in month view */
            components={{
              month: {
                dateHeader: ({ date }: DateHeaderProps) => {
                  const blockedDate = blocked.find((b) =>
                    isDateInRange(date, parseAsLocalDate(b.startDate), parseAsLocalDate(b.endDate))
                  );

                  if (!blockedDate) return <span>{moment(date).date()}</span>;

                  return (
                    <div className="relative h-full w-full">
                      <div className="absolute top-1 right-1 text-s font-semibold text-gray-700">
                        {moment(date).date()}
                      </div>
                      <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-red-700 px-1 text-center">
                        {blockedDate.title}
                      </div>
                    </div>
                  );
                },
              },
            }}
          />
        </div>

        {selectedRange && (
          <div className="space-y-2">
            <Input
              placeholder="Blocked date title"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleBlock}>Add Blocked Dates</Button>
              <Button variant="outline" onClick={() => setSelectedRange(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Blocked Dates</h2>
          {blocked.length === 0 ? (
            <p className="text-muted-foreground">No blocked dates</p>
          ) : (
            <ul className="space-y-2">
              {blocked.map((b) => {
                const start = parseAsLocalDate(b.startDate);
                const end = parseAsLocalDate(b.endDate);
                return (
                  <li key={b.id} className="flex justify-between border p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{b.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {start.toDateString()} – {end.toDateString()}
                      </p>
                    </div>
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
