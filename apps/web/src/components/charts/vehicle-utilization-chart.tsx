"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { authClient } from "@/lib/api/publicClient"

const data = [
  { category: "Economy", utilization: 85 },
  { category: "Compact", utilization: 78 },
  { category: "Mid-size", utilization: 72 },
  { category: "Full-size", utilization: 65 },
  { category: "SUV", utilization: 82 },
  { category: "Luxury", utilization: 58 },
  { category: "Van", utilization: 62 },
]

export default function VehicleUtilizationChart({year}: {year: number}) {
  const { data: utilization } = authClient.analytics.getAssetUtilization.useQuery({
    queryData: { query: { period: year.toString() } },
    queryKey: ["ANALYTICS", "VEHICLES", "UTILIZATION", year]
  })

  const parsedData = utilization?.status === 200 ? utilization.body : []

  const data = parsedData.map((item) => ({
    category: item.assetType,
    utilization: item.utilizationRate,
  }))

  return (
    <ChartContainer
      config={{
        utilization: {
          label: "Utilization %",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis dataKey="category" type="category" width={80} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

