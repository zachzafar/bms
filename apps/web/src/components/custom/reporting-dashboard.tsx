"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Printer, Download } from "lucide-react"
import BookingsByLocationChart from "../charts/bookings-by-location-chart"
import BookingsByMonthChart from "../charts/bookings-by-month-chart"
import CustomerSatisfactionChart from "../charts/customer-satisfaction-chart"
import MaintenanceCostsChart from "../charts/maintenance-costs-chart"
import RevenueByVehicleTypeChart from "../charts/revenue-by-vehicle-type-chart"
import VehicleUtilizationChart from "../charts/vehicle-utilization-chart"



export default function ReportingDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedReport, setSelectedReport] = useState("bookings-by-month")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedYear, setSelectedYear] = useState("2023")

  // Map of report IDs to their display components
  const reportComponents: Record<string, React.ReactNode> = {
    "bookings-by-month": <BookingsByMonthChart />,
    "bookings-by-location": <BookingsByLocationChart />,
    "vehicle-utilization": <VehicleUtilizationChart />,
    "revenue-by-vehicle-type": <RevenueByVehicleTypeChart />,
    "customer-satisfaction": <CustomerSatisfactionChart />,
    "maintenance-costs": <MaintenanceCostsChart />,
  }

  // Report titles
  const reportTitles: Record<string, string> = {
    "bookings-by-month": "Bookings By Month/Day",
    "bookings-by-location": "Bookings By Location",
    "vehicle-utilization": "Vehicle Utilization Rate",
    "revenue-by-vehicle-type": "Revenue By Vehicle Type",
    "customer-satisfaction": "Customer Satisfaction Ratings",
    "maintenance-costs": "Maintenance Costs By Vehicle Type",
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters Section */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="new-york">New York</SelectItem>
              <SelectItem value="los-angeles">Los Angeles</SelectItem>
              <SelectItem value="chicago">Chicago</SelectItem>
              <SelectItem value="miami">Miami</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Year</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[180px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Report Types Sidebar */}
        <div className="md:col-span-1 bg-background rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Default Reports</h2>
          </div>

          {/* Bookings Reports */}
          <div className="border-b">
            <div className="p-3 font-medium">Bookings</div>
            <ul className="space-y-1 px-1">
              <li>
                <button
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedReport === "bookings-by-month" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setSelectedReport("bookings-by-month")}
                >
                  By Month/Day
                </button>
              </li>
              <li>
                <button
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedReport === "bookings-by-location" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setSelectedReport("bookings-by-location")}
                >
                  By Location
                </button>
              </li>
            </ul>
          </div>

          {/* Vehicle Reports */}
          <div className="border-b">
            <div className="p-3 font-medium">Vehicles</div>
            <ul className="space-y-1 px-1">
              <li>
                <button
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedReport === "vehicle-utilization" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setSelectedReport("vehicle-utilization")}
                >
                  Utilization Rate
                </button>
              </li>
              <li>
                <button
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedReport === "maintenance-costs" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setSelectedReport("maintenance-costs")}
                >
                  Maintenance Costs
                </button>
              </li>
            </ul>
          </div>

          {/* Revenue Reports */}
          <div className="border-b">
            <div className="p-3 font-medium">Revenue</div>
            <ul className="space-y-1 px-1">
              <li>
                <button
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedReport === "revenue-by-vehicle-type" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setSelectedReport("revenue-by-vehicle-type")}
                >
                  By Vehicle Type
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Reports */}
          <div className="border-b">
            <div className="p-3 font-medium">Customers</div>
            <ul className="space-y-1 px-1">
              <li>
                <button
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedReport === "customer-satisfaction" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setSelectedReport("customer-satisfaction")}
                >
                  Satisfaction Ratings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Chart Area */}
        <div className="md:col-span-3">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{reportTitles[selectedReport]}</h2>
          </div>
          
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="h-[400px]">{reportComponents[selectedReport]}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

