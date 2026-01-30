"use client"

import * as React from "react"
import { format, eachDayOfInterval, isSameDay, isBefore, startOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface BlockedDateRange {
  startDate: Date
  endDate: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  blockedDates?: BlockedDateRange[]
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  numberOfMonths?: number
}

export function DateRangePicker({
  value,
  onChange,
  blockedDates = [],
  placeholder = "Select dates",
  className,
  disabled = false,
  minDate,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convert blocked date ranges to individual disabled dates
  const disabledDates = React.useMemo(() => {
    const dates: Date[] = []
    blockedDates.forEach((range) => {
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      const daysInRange = eachDayOfInterval({ start, end })
      dates.push(...daysInRange)
    })
    return dates
  }, [blockedDates])

  // Check if a date is blocked
  const isDateBlocked = React.useCallback((date: Date) => {
    return disabledDates.some((blockedDate) => isSameDay(date, blockedDate))
  }, [disabledDates])

  // Check if a range contains any blocked dates
  const rangeContainsBlockedDate = React.useCallback((from: Date, to: Date) => {
    const daysInRange = eachDayOfInterval({ start: from, end: to })
    return daysInRange.some((day) => isDateBlocked(day))
  }, [isDateBlocked])

  // Disable function for the calendar
  const disabledMatcher = React.useCallback((date: Date) => {
    // Disable past dates
    if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) {
      return true
    }
    // Disable blocked dates
    return isDateBlocked(date)
  }, [minDate, isDateBlocked])

  // Handle date selection with validation
  const handleSelect = React.useCallback((range: DateRange | undefined) => {
    if (!range || !range.from) {
      onChange?.(range)
      return
    }

    // If we have both from and to, check if range contains blocked dates
    if (range.from && range.to) {
      if (rangeContainsBlockedDate(range.from, range.to)) {
        // Keep the original from date and clear the to date so user can pick a valid end date
        // If the user clicked on a date before the current from, use that as the new from
        if (range.to < range.from) {
          onChange?.({ from: range.to, to: undefined })
        } else {
          // Keep the from date, reject the to date
          onChange?.({ from: range.from, to: undefined })
        }
        return
      }
    }

    onChange?.(range)
  }, [onChange, rangeContainsBlockedDate])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            disabled={disabledMatcher}
            modifiers={{
              blocked: disabledDates,
            }}
            modifiersStyles={{
              blocked: {
                backgroundColor: "hsl(var(--destructive) / 0.1)",
                color: "hsl(var(--destructive))",
                textDecoration: "line-through",
              },
            }}
          />
          {blockedDates.length > 0 && (
            <div className="border-t p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/20" />
                <span>Unavailable dates</span>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
