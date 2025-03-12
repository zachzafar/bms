"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    month: "Jan",
    Economy: 120,
    SUV: 85,
    Luxury: 45,
  },
  {
    month: "Feb",
    Economy: 132,
    SUV: 91,
    Luxury: 52,
  },
  {
    month: "Mar",
    Economy: 145,
    SUV: 105,
    Luxury: 58,
  },
  {
    month: "Apr",
    Economy: 178,
    SUV: 123,
    Luxury: 65,
  },
  {
    month: "May",
    Economy: 189,
    SUV: 142,
    Luxury: 72,
  },
  {
    month: "Jun",
    Economy: 210,
    SUV: 158,
    Luxury: 85,
  },
  {
    month: "Jul",
    Economy: 232,
    SUV: 175,
    Luxury: 98,
  },
  {
    month: "Aug",
    Economy: 245,
    SUV: 182,
    Luxury: 105,
  },
  {
    month: "Sep",
    Economy: 215,
    SUV: 165,
    Luxury: 92,
  },
  {
    month: "Oct",
    Economy: 187,
    SUV: 145,
    Luxury: 78,
  },
  {
    month: "Nov",
    Economy: 165,
    SUV: 125,
    Luxury: 65,
  },
  {
    month: "Dec",
    Economy: 152,
    SUV: 118,
    Luxury: 72,
  },
]

export default function BookingTrendsChart() {
  return (
    <ChartContainer
      config={{
        Economy: {
          label: "Economy",
          color: "hsl(var(--chart-1))",
        },
        SUV: {
          label: "SUV",
          color: "hsl(var(--chart-2))",
        },
        Luxury: {
          label: "Luxury",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="Economy" stroke="var(--color-Economy)" strokeWidth={2} />
          <Line type="monotone" dataKey="SUV" stroke="var(--color-SUV)" strokeWidth={2} />
          <Line type="monotone" dataKey="Luxury" stroke="var(--color-Luxury)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

