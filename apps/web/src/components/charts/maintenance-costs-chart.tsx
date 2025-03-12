"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", economy: 12500, suv: 18200, luxury: 22400 },
  { month: "Feb", economy: 13200, suv: 17800, luxury: 21900 },
  { month: "Mar", economy: 14500, suv: 19200, luxury: 23500 },
  { month: "Apr", economy: 15800, suv: 20500, luxury: 25200 },
  { month: "May", economy: 16200, suv: 21800, luxury: 26800 },
  { month: "Jun", economy: 17500, suv: 23200, luxury: 28500 },
  { month: "Jul", economy: 18200, suv: 24500, luxury: 30200 },
  { month: "Aug", economy: 17800, suv: 23800, luxury: 29500 },
  { month: "Sep", economy: 16500, suv: 22500, luxury: 27800 },
  { month: "Oct", economy: 15200, suv: 21200, luxury: 26200 },
  { month: "Nov", economy: 14800, suv: 20500, luxury: 25500 },
  { month: "Dec", economy: 13500, suv: 19800, luxury: 24200 },
]

export default function MaintenanceCostsChart() {
  return (
    <ChartContainer
      config={{
        economy: {
          label: "Economy",
          color: "hsl(var(--chart-1))",
        },
        suv: {
          label: "SUV",
          color: "hsl(var(--chart-2))",
        },
        luxury: {
          label: "Luxury",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorEconomy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-economy)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-economy)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSuv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-suv)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-suv)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLuxury" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-luxury)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-luxury)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <CartesianGrid strokeDasharray="3 3" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatters={{
                  economy: (value) => `$${value.toLocaleString()}`,
                  suv: (value) => `$${value.toLocaleString()}`,
                  luxury: (value) => `$${value.toLocaleString()}`,
                }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="economy"
            stroke="var(--color-economy)"
            fillOpacity={1}
            fill="url(#colorEconomy)"
          />
          <Area type="monotone" dataKey="suv" stroke="var(--color-suv)" fillOpacity={1} fill="url(#colorSuv)" />
          <Area
            type="monotone"
            dataKey="luxury"
            stroke="var(--color-luxury)"
            fillOpacity={1}
            fill="url(#colorLuxury)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

