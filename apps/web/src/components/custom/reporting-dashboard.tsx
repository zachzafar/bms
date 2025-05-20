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
import { CalendarIcon,} from "lucide-react"
import BookingsByLocationChart from "../charts/bookings-by-location-chart"
import BookingsByMonthChart from "../charts/bookings-by-month-chart"
import MaintenanceCostsChart from "../charts/maintenance-costs-chart"
import RevenueByVehicleTypeChart from "../charts/revenue-by-vehicle-type-chart"
import VehicleUtilizationChart from "../charts/vehicle-utilization-chart"



export default function ReportingDashboard() {
  const [selectedReport, setSelectedReport] = useState("bookings-by-month")
  const [selectedYear, setSelectedYear] = useState("2023")

  // Map of report IDs to their display components
  const reportComponents: Record<string, React.ReactNode> = {
    "bookings-by-month": <BookingsByMonthChart year={Number(selectedYear)}/>,
    "bookings-by-location": <BookingsByLocationChart year={Number(selectedYear)}/>,
    "vehicle-utilization": <VehicleUtilizationChart year={Number(selectedYear)}/>,
    "revenue-by-vehicle-type": <RevenueByVehicleTypeChart year={Number(selectedYear)} />,
    "maintenance-costs": <MaintenanceCostsChart year={Number(selectedYear)}/>,
  }

  // Report titles
  const reportTitles: Record<string, string> = {
    "bookings-by-month": "Bookings By Month/Day",
    "bookings-by-location": "Bookings By Location",
    "vehicle-utilization": "Vehicle Utilization Rate",
    "revenue-by-vehicle-type": "Revenue By Vehicle Type",
    // "customer-satisfaction": "Customer Satisfaction Ratings",
    "maintenance-costs": "Maintenance Costs By Vehicle Type",
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Filters Section */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Year</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
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
            </ul>
          </div>

          {/* Vehicle Reports */}
          <div className="border-b">
            <div className="p-3 font-medium">Assets</div>
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
                  By Asset Type
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

