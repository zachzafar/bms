"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    month: "Jan",
    "Vehicle Condition": 4.2,
    "Customer Service": 4.5,
    "Booking Experience": 4.3,
    "Value for Money": 4.0,
  },
  {
    month: "Feb",
    "Vehicle Condition": 4.3,
    "Customer Service": 4.5,
    "Booking Experience": 4.4,
    "Value for Money": 4.1,
  },
  {
    month: "Mar",
    "Vehicle Condition": 4.4,
    "Customer Service": 4.6,
    "Booking Experience": 4.5,
    "Value for Money": 4.2,
  },
  {
    month: "Apr",
    "Vehicle Condition": 4.5,
    "Customer Service": 4.7,
    "Booking Experience": 4.6,
    "Value for Money": 4.3,
  },
  {
    month: "May",
    "Vehicle Condition": 4.6,
    "Customer Service": 4.8,
    "Booking Experience": 4.7,
    "Value for Money": 4.4,
  },
  {
    month: "Jun",
    "Vehicle Condition": 4.7,
    "Customer Service": 4.8,
    "Booking Experience": 4.8,
    "Value for Money": 4.5,
  },
  {
    month: "Jul",
    "Vehicle Condition": 4.7,
    "Customer Service": 4.7,
    "Booking Experience": 4.8,
    "Value for Money": 4.6,
  },
  {
    month: "Aug",
    "Vehicle Condition": 4.8,
    "Customer Service": 4.8,
    "Booking Experience": 4.9,
    "Value for Money": 4.7,
  },
  {
    month: "Sep",
    "Vehicle Condition": 4.7,
    "Customer Service": 4.8,
    "Booking Experience": 4.8,
    "Value for Money": 4.6,
  },
  {
    month: "Oct",
    "Vehicle Condition": 4.6,
    "Customer Service": 4.7,
    "Booking Experience": 4.7,
    "Value for Money": 4.5,
  },
  {
    month: "Nov",
    "Vehicle Condition": 4.5,
    "Customer Service": 4.6,
    "Booking Experience": 4.6,
    "Value for Money": 4.4,
  },
  {
    month: "Dec",
    "Vehicle Condition": 4.6,
    "Customer Service": 4.7,
    "Booking Experience": 4.7,
    "Value for Money": 4.5,
  },
]

export default function CustomerSatisfactionChart() {
  return (
    <ChartContainer
      config={{
        "Vehicle Condition": {
          label: "Vehicle Condition",
          color: "hsl(var(--chart-1))",
        },
        "Customer Service": {
          label: "Customer Service",
          color: "hsl(var(--chart-2))",
        },
        "Booking Experience": {
          label: "Booking Experience",
          color: "hsl(var(--chart-3))",
        },
        "Value for Money": {
          label: "Value for Money",
          color: "hsl(var(--chart-4))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[3.5, 5]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="Vehicle Condition" stroke="var(--color-Vehicle-Condition)" strokeWidth={2} />
          <Line type="monotone" dataKey="Customer Service" stroke="var(--color-Customer-Service)" strokeWidth={2} />
          <Line type="monotone" dataKey="Booking Experience" stroke="var(--color-Booking-Experience)" strokeWidth={2} />
          <Line type="monotone" dataKey="Value for Money" stroke="var(--color-Value-for-Money)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

