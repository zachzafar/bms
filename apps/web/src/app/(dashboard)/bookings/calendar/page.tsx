"use client";

import { useEffect, useState } from "react";
import { Calendar, DateRange, momentLocalizer, Event, SlotInfo, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { authClient } from "../../../../lib/api/publicClient";
import { Trash2 } from "lucide-react";
import { BOOKINGS_QUERY_KEY } from "@/lib/api/queryKeys";
import { toast } from "sonner";

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

export default function BookingCalendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [blockTitle, setBlockTitle] = useState<string>("");

  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // Queries
  const bookingsQuery = authClient.booking.getBookings.useQuery({ queryKey: BOOKINGS_QUERY_KEY });

  // Mutations
  const createBlockedDateMutation = authClient.booking.createBlockedDate.useMutation();
  const deleteBlockedDateMutation = authClient.booking.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success("Blocked date deleted.");
      fetchBlockedDates();
    },
    onError: () => {
      toast.error("Failed to delete blocked date.");
    },
  });

  const fetchBlockedDates = async () => {
    const blockedRes = await authClient.booking.getBlockedDates.query({ query: {} });
    const blockedData: BlockedDate[] = Array.isArray(blockedRes.body)
      ? blockedRes.body.map((b) => ({
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
    if (bookingsQuery.data) {
      const bookingsData = bookingsQuery.data.body?.map((b) => ({
        id: Number(b.id),
        startDate: b.startDate,
        endDate: b.endDate,
        customerName: b.user.name,
      })) ?? [];
      setBookings(bookingsData);
    }
    fetchBlockedDates();
  }, [bookingsQuery.data]);

  // Convert blocked dates to react-big-calendar events
  const blockedEvents: Event[] = blocked.map((b) => ({
    title: b.title,
    start: new Date(b.startDate),
    end: new Date(b.endDate),
    allDay: true,
  }));

  const tempEvent: Event[] = selectedRange
    ? [
        {
          title: blockTitle || "New Block",
          start: selectedRange.start,
          end: selectedRange.end,
          allDay: true,
          resource: { temp: true },
        },
      ]
    : [];

  const events = [...blockedEvents, ...tempEvent];

  // Helper: compares only the day part (ignores time)
  function sameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  const handleBlock = async () => {
    if (!selectedRange) return;

    const tenantId = localStorage.getItem("tenant")!;
    const assetId = "some-asset-id"; // must provide a valid assetId
    const startDate = selectedRange.start.toISOString().split("T")[0];
    const endDate = selectedRange.end.toISOString().split("T")[0];

    await createBlockedDateMutation.mutateAsync({
      body: { tenantId, assetId, startDate, endDate, title: blockTitle, reason: "Manual Block" },
    });

    setSelectedRange(null);
    setBlockTitle("");
    fetchBlockedDates();
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this blocked date?")) {
      deleteBlockedDateMutation.mutate({ params: { id: String(id) }, body: undefined });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto p-4">
      <CardHeader>
        <CardTitle>Booking Calendar</CardTitle>
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
            onSelectSlot={(slotInfo: SlotInfo) => {
              setSelectedRange({ start: slotInfo.start, end: slotInfo.end });
            }}
            eventPropGetter={(event) => {
              if (event.resource?.temp) {
                return {
                  style: { backgroundColor: "rgba(0,128,255,0.3)", border: "1px solid #007BFF" },
                };
              }
              return { style: { backgroundColor: "rgba(255,0,0,0.7)", color: "white" } };
            }}
            slotPropGetter={(slotInfo: Date | { start: Date; end: Date }) => {
              if (!selectedRange) return {};

              let slotStart: Date;
              let slotEnd: Date;

              if (slotInfo instanceof Date) {
                // Month view
                slotStart = slotEnd = slotInfo;
              } else {
                // Week/day view
                slotStart = slotInfo.start;
                slotEnd = slotInfo.end;
              }

              let inRange = false;

              if (slotInfo instanceof Date) {
                // Month view: check if the day is in the selected range
                let current = new Date(selectedRange.start);
                while (current <= selectedRange.end) {
                  if (sameDay(current, slotStart)) {
                    inRange = true;
                    break;
                  }
                  current.setDate(current.getDate() + 1);
                }
              } else {
                // Week/day view: check time overlap
                inRange = slotEnd > selectedRange.start && slotStart < selectedRange.end;
              }

              if (inRange) {
                return { style: { backgroundColor: "rgba(255,165,0,0.3)" } };
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
              {blocked.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <span>
                    {new Date(b.startDate).toLocaleDateString()} →{" "}
                    {new Date(b.endDate).toLocaleDateString()}{" "}
                    {b.reason ? `(${b.reason})` : ""}
                  </span>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
