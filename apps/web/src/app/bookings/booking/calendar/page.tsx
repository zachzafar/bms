"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  momentLocalizer,
  Event,
  SlotInfo,
  View,
  DateHeaderProps,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/api/publicClient";
import { Trash2 } from "lucide-react";
import { BOOKINGS_QUERY_KEY } from "@/lib/api/queryKeys";
import { toast } from "sonner";
import { StorageService } from "@/lib/api/storage";
import { queryClient } from "@/providers/tanstack";
import { parseAsLocalDate, addDays } from "@/lib/utils/date";

const localizer = momentLocalizer(moment);
const BLOCKED_DATES_KEY = ["blockedDates"];

/* 🔹 helper */
const isDateInRange = (date: Date, start: Date, end: Date) => {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
};

type BookingItem = {
  id: number;
  startDate: Date;
  endDate: Date;
  customerName: string;
  assetName: string;
  status?: string;
};

type BlockedDateItem = {
  id: number;
  startDate: Date;
  endDate: Date;
  title: string;
  reason?: string;
};

export default function BookingCalendar() {
  const [blockTitle, setBlockTitle] = useState("");
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const { data: bookingsData } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
  });

  const { data: blockedDatesData } = authClient.blockedDates.getBlockedDates.useQuery({
    queryKey: BLOCKED_DATES_KEY,
    queryData: { query: {} },
  });

  const createBlockedDateMutation = authClient.blockedDates.createBlockedDate.useMutation({
    onSuccess: () => {
      toast.success("Blocked dates added successfully");
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
      setSelectedRange(null);
      setBlockTitle("");
    },
    onError: () => toast.error("Failed to add blocked dates"),
  });

  const deleteBlockedDateMutation = authClient.blockedDates.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success("Blocked date deleted");
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
    },
    onError: () => toast.error("Failed to delete blocked date"),
  });

  const bookings: BookingItem[] = useMemo(() => {
    if (!bookingsData?.body?.data) return [];
    return bookingsData.body.data.map((b: any) => ({
      id: Number(b.id),
      startDate: parseAsLocalDate(b.startDate),
      endDate: parseAsLocalDate(b.endDate),
      customerName: b.customer?.name || "Unknown",
      assetName: b.asset?.name || "Unknown",
      status: b.status,
    }));
  }, [bookingsData]);

  /* 🔹 manual blocks only */
  const blockedDates: BlockedDateItem[] = useMemo(() => {
    if (!Array.isArray(blockedDatesData?.body)) return [];
    return blockedDatesData.body
      .filter((b: any) => b.reason === "Manual Block")
      .map((b: any) => ({
        id: b.id,
        startDate: parseAsLocalDate(b.startDate),
        endDate: parseAsLocalDate(b.endDate),
        title: b.title,
        reason: b.reason,
      }));
  }, [blockedDatesData]);

  const bookingEvents: Event[] = useMemo(() => {
    return bookings.map((b) => ({
      title: `${b.assetName} - ${b.customerName}`,
      start: b.startDate,
      end: addDays(b.endDate, 1),
      allDay: true,
      resource: { type: "booking", status: b.status },
    }));
  }, [bookings]);

  const tempEvent: Event[] = selectedRange
    ? [{
      title: blockTitle || "New Block",
      start: selectedRange.start,
      end: selectedRange.end,
      allDay: true,
      resource: { temp: true },
    }]
    : [];

  /* 🔹 NO blocked events */
  const events = [...bookingEvents, ...tempEvent];

  const handleBlock = async () => {
    if (!selectedRange) return;
    const tenantId = StorageService.getTenant()?.id ?? "";

    const startDate = selectedRange.start;
    const endDate = new Date(selectedRange.end);
    endDate.setDate(endDate.getDate() - 1);

    createBlockedDateMutation.mutate({
      body: {
        tenantId,
        assetId: null,
        startDate,
        endDate,
        title: blockTitle || "Manual Block",
        reason: "Manual Block",
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this blocked date?")) {
      deleteBlockedDateMutation.mutate({ params: { id }, body: undefined });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Booking Calendar</CardTitle>
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

            /* 🔹 full grey tile */
            dayPropGetter={(date) => {
              const blocked = blockedDates.find((b) =>
                isDateInRange(date, b.startDate, b.endDate)
              );
              return blocked
                ? { style: { backgroundColor: "#E5E7EB" } }
                : {};
            }}

            eventPropGetter={(event) => {
              if (event.resource?.temp) {
                return {
                  style: {
                    backgroundColor: "rgba(59, 130, 246, 0.3)",
                    border: "1px solid rgb(59, 130, 246)",
                  },
                };
              }

              if (event.resource?.type === "booking") {
                const map: Record<string, { bg: string; border: string }> = {
                  Confirmed: { bg: "rgba(34, 197, 94, 0.85)", border: "rgb(22, 163, 74)" },
                  Pending: { bg: "rgba(234, 179, 8, 0.85)", border: "rgb(202, 138, 4)" },
                  Cancelled: { bg: "rgba(239, 68, 68, 0.85)", border: "rgb(220, 38, 38)" },
                };
                const colors = map[event.resource.status] ?? map.Confirmed;
                return {
                  style: {
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    textAlign: "center",
                  },
                };
              }

              return {};
            }}

            /* 🔹 CENTERED reason text inside tile */
            components={{
              month: {
                dateHeader: ({ date }: DateHeaderProps) => {
                  const blocked = blockedDates.find((b) =>
                    isDateInRange(date, b.startDate, b.endDate)
                  );

                  if (!blocked) {
                    return <span>{moment(date).date()}</span>;
                  }

                  return (
                    <div className="relative h-full w-full">
                      {/* date number */}
                      <div className="absolute top-1 right-1 text-s font-semibold text-gray-700">
                        {moment(date).date()}
                      </div>

                      {/* centered reason */}
                      <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-red-700 px-1 text-center">
                        {blocked.title}
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
          <ul className="space-y-2">
            {blockedDates.map((b) => (
              <li key={b.id} className="flex justify-between border p-3 rounded-lg">
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.startDate.toDateString()} – {b.endDate.toDateString()}
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
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
