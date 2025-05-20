"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { authClient } from "@/lib/api/publicClient"


// const data = [
//   { month: "Jan", bookings: 120 },
//   { month: "Feb", bookings: 132 },
//   { month: "Mar", bookings: 145 },
//   { month: "Apr", bookings: 178 },
//   { month: "May", bookings: 189 },
//   { month: "Jun", bookings: 210 },
//   { month: "Jul", bookings: 232 },
//   { month: "Aug", bookings: 245 },
//   { month: "Sep", bookings: 215 },
//   { month: "Oct", bookings: 187 },
//   { month: "Nov", bookings: 165 },
//   { month: "Dec", bookings: 152 },
// ]

export default function BookingsByMonthChart({ year }: { year: number }) {
  const { data: CBYResponse } = authClient.analytics.getBookingCountsByMonthPerYear.useQuery({
    queryData: { query: { year: year.toString() } },
    queryKey: ["ANALYTICS", "BOOKINGS", "MONTH", year]
  })

  const data = CBYResponse?.status == 200 ? CBYResponse.body.monthly : [  
    { month: "Jan", bookings: 0 },
    { month: "Feb", bookings: 0 },
    { month: "Mar", bookings: 0 },
    { month: "Apr", bookings: 0 },
    { month: "May", bookings: 0 },
    { month: "Jun", bookings: 0 },
    { month: "Jul", bookings: 0 },
    { month: "Aug", bookings: 0 },
    { month: "Sep", bookings: 0 },
    { month: "Oct", bookings: 0 },
    { month: "Nov", bookings: 0 },
    { month: "Dec", bookings: 0 }]

  return (
    <ChartContainer
      config={{
        bookings: {
          label: "Bookings",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

