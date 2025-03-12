"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "New York", value: 420 },
  { name: "Los Angeles", value: 380 },
  { name: "Chicago", value: 210 },
  { name: "Miami", value: 314 },
  { name: "Other", value: 180 },
]

export default function BookingsByLocationChart() {
  return (
    <ChartContainer
      config={{
        "New York": {
          label: "New York",
          color: "hsl(var(--chart-1))",
        },
        "Los Angeles": {
          label: "Los Angeles",
          color: "hsl(var(--chart-2))",
        },
        Chicago: {
          label: "Chicago",
          color: "hsl(var(--chart-3))",
        },
        Miami: {
          label: "Miami",
          color: "hsl(var(--chart-4))",
        },
        Other: {
          label: "Other",
          color: "hsl(var(--chart-5))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={150} fill="#8884d8" dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`var(--color-${entry.name.replace(/\s+/g, "-")})`} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

