"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { model: "Toyota Camry", bookings: 245 },
  { model: "Honda Civic", bookings: 218 },
  { model: "Ford Escape", bookings: 187 },
  { model: "Jeep Wrangler", bookings: 165 },
  { model: "BMW 3 Series", bookings: 142 },
  { model: "Tesla Model 3", bookings: 128 },
  { model: "Mercedes C-Class", bookings: 112 },
]

export default function PopularVehiclesChart() {
  return (
    <ChartContainer
      config={{
        bookings: {
          label: "Bookings",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="model" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

