"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { authClient } from "@/lib/api/publicClient"

const data = [
  { category: "Economy", revenue: 425000 },
  { category: "Compact", revenue: 380000 },
  { category: "Mid-size", revenue: 520000 },
  { category: "Full-size", revenue: 480000 },
  { category: "SUV", revenue: 720000 },
  { category: "Luxury", revenue: 850000 },
  { category: "Van", revenue: 320000 },
]

export default function RevenueByVehicleTypeChart({year}: {year:number}) {
  const {data: revenueResponse } =authClient.analytics.getRevenueByAssetTypePerYear.useQuery({
    queryData: { query: { period: year.toString() } },
    queryKey: ["ANALYTICS", "REVENUE", "VEHICLE_TYPE", year]
  })

  const parsedData = revenueResponse?.status === 200? revenueResponse.body : []
  const data = parsedData.map((item) => ({
    category: item.assetType,
    revenue: item.revenue,
  }))

  return (
    <ChartContainer
      config={{
        revenue: {
          label: "Revenue ($)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatters={{
                  revenue: (value) => `$${value.toLocaleString()}`,
                }}
              />
            }
          />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

