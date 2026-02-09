"use client";

import { useMemo, useState } from "react";
import { Calendar, momentLocalizer, Event, SlotInfo, View } from "react-big-calendar";
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

const localizer = momentLocalizer(moment);
const BLOCKED_DATES_KEY = ["blockedDates"];

type BookingItem = {
  id: number;
  startDate: Date;
  endDate: Date;
  customerName: string;
  assetName: string;
};

type BlockedDateItem = {
  id: number;
  startDate: Date;
  endDate: Date;
  title: string;
  reason?: string;
};

// Helper: Parse date string to local Date, handling both formats:
// - datetime with timezone: "2026-02-09T04:00:00.000Z" -> extract UTC date
// - date-only: "2026-02-09" -> treat as local date
function parseAsLocalDate(dateStr: string): Date {
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Helper: Add days to a date and return new Date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function BookingCalendar() {
  const [blockTitle, setBlockTitle] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  // Fetch bookings
  const { data: bookingsData } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
  });

  // Fetch blocked dates
  const { data: blockedDatesData } = authClient.blockedDates.getBlockedDates.useQuery({
    queryKey: BLOCKED_DATES_KEY,
    queryData: { query: {} },
  });

  // Create blocked date mutation
  const createBlockedDateMutation = authClient.blockedDates.createBlockedDate.useMutation({
    onSuccess: () => {
      toast.success("Blocked dates added successfully");
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
      setSelectedRange(null);
      setBlockTitle("");
    },
    onError: () => {
      toast.error("Failed to add blocked dates");
    },
  });

  // Delete blocked date mutation
  const deleteBlockedDateMutation = authClient.blockedDates.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success("Blocked date deleted");
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
    },
    onError: () => {
      toast.error("Failed to delete blocked date");
    },
  });

  // Process bookings data with proper date parsing
  const bookings: BookingItem[] = useMemo(() => {
    if (!bookingsData?.body?.data) return [];
    return bookingsData.body.data.map((b: any) => ({
      id: Number(b.id),
      startDate: parseAsLocalDate(b.startDate),
      endDate: parseAsLocalDate(b.endDate),
      customerName: b.user?.name || "Unknown",
      assetName: b.asset?.name || "Unknown",
    }));
  }, [bookingsData]);

  // Process blocked dates data with proper date parsing
  const blockedDates: BlockedDateItem[] = useMemo(() => {
    if (!Array.isArray(blockedDatesData?.body)) return [];
    return blockedDatesData.body.map((b: any) => ({
      id: b.id,
      startDate: parseAsLocalDate(b.startDate),
      endDate: parseAsLocalDate(b.endDate),
      title: b.title,
      reason: b.reason,
    }));
  }, [blockedDatesData]);

  // Create calendar events from bookings
  // Note: react-big-calendar treats end date as EXCLUSIVE for all-day events
  const bookingEvents: Event[] = useMemo(() => {
    return bookings.map((b) => ({
      title: `${b.assetName} - ${b.customerName}`,
      start: b.startDate,
      end: addDays(b.endDate, 1), // +1 because react-big-calendar end is exclusive
      allDay: true,
      resource: { type: "booking", booking: b },
    }));
  }, [bookings]);

  // Create calendar events from blocked dates
  const blockedEvents: Event[] = useMemo(() => {
    return blockedDates.map((b) => ({
      title: b.title,
      start: b.startDate,
      end: addDays(b.endDate, 1), // +1 because react-big-calendar end is exclusive
      allDay: true,
      resource: { type: "blocked", blocked: b },
    }));
  }, [blockedDates]);

  // Temporary event for selection preview
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

  const events = [...bookingEvents, ...blockedEvents, ...tempEvent];

  // Handle adding blocked dates
  const handleBlock = async () => {
    if (!selectedRange) return;

    const currentTenant = StorageService.getTenant();
    const tenantId = currentTenant?.id ?? "";
    const assetId = "null";

    const startDate = selectedRange.start;
    // Subtract 1 day from end since react-big-calendar end is exclusive
    const endDate = new Date(selectedRange.end);
    endDate.setDate(endDate.getDate() - 1);

    createBlockedDateMutation.mutate({
      body: {
        tenantId,
        assetId,
        startDate,
        endDate,
        title: blockTitle || "Blocked",
        reason: "Manual Block",
      },
    });
  };

  // Handle deleting blocked dates
  const handleDelete = (id: number) => {
    if (confirm("Delete this blocked date?")) {
      deleteBlockedDateMutation.mutate({
        params: { id },
        body: undefined,
      });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Booking Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar */}
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
                  style: {
                    backgroundColor: "rgba(59, 130, 246, 0.3)",
                    border: "1px solid rgb(59, 130, 246)",
                  },
                };
              }
              if (event.resource?.type === "booking") {
                return {
                  style: {
                    backgroundColor: "rgba(0, 180, 0, 0.7)",
                    color: "white",
                    fontWeight: "bold",
                  },
                };
              }
              if (event.resource?.type === "blocked") {
                return {
                  style: {
                    backgroundColor: "rgb(239, 68, 68)",
                    color: "white",
                  },
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

        {/* Block input */}
        {selectedRange && (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Blocked date title (optional)"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleBlock}
                disabled={createBlockedDateMutation.isPending}
              >
                {createBlockedDateMutation.isPending ? "Adding..." : "Add Blocked Dates"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRange(null);
                  setBlockTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Blocked dates list */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Blocked Dates</h2>
          {blockedDates.length === 0 ? (
            <p className="text-muted-foreground">No blocked dates</p>
          ) : (
            <ul className="space-y-2">
              {blockedDates.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{b.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.startDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {b.endDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {b.reason && ` • ${b.reason}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(b.id)}
                    disabled={deleteBlockedDateMutation.isPending}
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
