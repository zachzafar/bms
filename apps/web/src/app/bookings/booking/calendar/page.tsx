"use client";

import { useState } from "react";
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
  const { data: blockedDatesData } = authClient.booking.getBlockedDates.useQuery({
    queryKey: BLOCKED_DATES_KEY,
    queryData: { query: {} },
  });

  // Create blocked date mutation
  const createBlockedDateMutation = authClient.booking.createBlockedDate.useMutation({
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
  const deleteBlockedDateMutation = authClient.booking.deleteBlockedDate.useMutation({
    onSuccess: () => {
      toast.success("Blocked date deleted");
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
    },
    onError: () => {
      toast.error("Failed to delete blocked date");
    },
  });

  // Process bookings data
  const bookings = bookingsData?.body.data?.map((b) => ({
    id: Number(b.id),
    startDate: new Date(b.startDate),
    endDate: new Date(b.endDate),
    customerName: b.user.name,
  })) ?? [];

  // Process blocked dates data
  const blockedDates = Array.isArray(blockedDatesData?.body)
    ? blockedDatesData.body.map((b) => ({
        id: b.id,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        title: b.title,
        reason: b.reason,
      }))
    : [];

  // Create calendar events from blocked dates
  // Add +1 day to end for display (react-big-calendar treats end as exclusive)
  const blockedEvents: Event[] = blockedDates.map((b) => {
    const endPlusOne = new Date(b.endDate);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    return {
      title: b.title,
      start: b.startDate,
      end: endPlusOne,
      allDay: true,
      resource: { blocked: b },
    };
  });

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

  const events = [...blockedEvents, ...tempEvent];

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
              return {
                style: {
                  backgroundColor: "rgb(239, 68, 68)",
                  color: "white",
                },
              };
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
