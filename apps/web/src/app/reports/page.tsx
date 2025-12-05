"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Printer, FileEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import BookingsByLocationChart from "@/components/charts/bookings-by-location-chart"
import BookingsByMonthChart from "@/components/charts/bookings-by-month-chart"
import MaintenanceCostsChart from "@/components/charts/maintenance-costs-chart"
import RevenueByVehicleTypeChart from "@/components/charts/revenue-by-vehicle-type-chart"
import VehicleUtilizationChart from "@/components/charts/vehicle-utilization-chart"

const chartData = [
  { month: "Jan", count: 1 },
  { month: "Feb", count: 0 },
  { month: "Mar", count: 0 },
  { month: "Apr", count: 0 },
  { month: "May", count: 0 },
  { month: "Jun", count: 0 },
  { month: "Jul", count: 545 },
  { month: "Aug", count: 459 },
  { month: "Sep", count: 510 },
  { month: "Oct", count: 534 },
  { month: "Nov", count: 458 },
  { month: "Dec", count: 0 },
]

const chartConfig = {
  count: {
    label: "Encounter Count",
    color: "hsl(var(--chart-1))",
  },
}

const reportCategories = [
  {
    name: "Encounters",
    items: ["By Month/Day", "By Visit Type", "By Mode", "By Provider"],
  },
  {
    name: "Appointments",
    items: [
      "By Month/Day",
      "By Visit Type",
      "By Mode",
      "By Status",
      "By Provider",
      "Average Time per Status",
      "Automated Booking Assistant",
    ],
  },
  {
    name: "Patients",
    items: [
      "By Registration",
      "By Demographics",
      "By PHR Usage",
      "By Primary Care Physician",
      "By Referring Provider",
      "By In-house Care Team",
    ],
  },
]

export default function ReportsPage() {
    // Domain-specific report list for your application
    const reportCategories = [
      {
        name: "Bookings",
        items: ["By Month", "By Location"],
      },
      {
        name: "Vehicles",
        items: ["Utilization"],
      },
      {
        name: "Revenue",
        items: ["By Vehicle Type"],
      },
      {
        name: "Maintenance",
        items: ["Costs by Vehicle Type"],
      },
    ]

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

    const [selectedReport, setSelectedReport] = useState("By Month")
    const [selectedCategory, setSelectedCategory] = useState("Bookings")
    const [selectedYear, setSelectedYear] = useState(currentYear.toString())

    const selectedYearNum = parseInt(selectedYear, 10)

    const renderSelectedChart = () => {
      if (selectedCategory === "Bookings" && selectedReport === "By Month") {
        return <BookingsByMonthChart year={selectedYearNum} />
      }
      if (selectedCategory === "Bookings" && selectedReport === "By Location") {
        return <BookingsByLocationChart year={selectedYearNum} />
      }
      if (selectedCategory === "Vehicles" && selectedReport === "Utilization") {
        return <VehicleUtilizationChart year={selectedYearNum} />
      }
      if (selectedCategory === "Revenue" && selectedReport === "By Vehicle Type") {
        return <RevenueByVehicleTypeChart year={selectedYearNum} />
      }
      if (selectedCategory === "Maintenance" && selectedReport === "Costs by Vehicle Type") {
        return <MaintenanceCostsChart year={selectedYearNum} />
      }
      return null
    }

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <Card className="w-full">
            <div className="flex h-[600px]">
              {/* Left side - Report list */}
              <div className="w-50 border-r border-border">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {reportCategories.map((category) => (
                      <div key={category.name} className="mb-6">
                        <h3 className="mb-2 font-semibold text-foreground">{category.name}</h3>
                        <div className="space-y-1">
                          {category.items.map((item) => (
                            <button
                              key={item}
                              onClick={() => {
                                setSelectedReport(item)
                                setSelectedCategory(category.name)
                              }}
                              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                selectedReport === item && selectedCategory === category.name
                                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Right side - Chart and filters */}
              <div className="flex-1">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {selectedCategory} {selectedReport}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FileEdit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Filters */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Year</span>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-[400px] w-full">
                    {renderSelectedChart()}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
}
