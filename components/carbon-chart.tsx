"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getActivitiesByDateRange } from "@/lib/database"

interface CarbonChartProps {
  userId: string
}

export function CarbonChart({ userId }: CarbonChartProps) {
  const [chartData, setChartData] = useState<Array<{ day: string; emissions: number }>>([])

  useEffect(() => {
    const fetchChartData = async () => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: activities } = await getActivitiesByDateRange(
        userId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      )

      if (activities) {
        // Group activities by date and sum emissions
        const dailyEmissions: Record<string, number> = {}

        activities.forEach((activity) => {
          const date = activity.date
          dailyEmissions[date] = (dailyEmissions[date] || 0) + activity.emissions
        })

        // Create chart data for the last 14 days
        const chartData = []
        for (let i = 13; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateString = date.toISOString().split("T")[0]

          chartData.push({
            day: (14 - i).toString(),
            emissions: dailyEmissions[dateString] || 0,
          })
        }

        setChartData(chartData)
      }
    }

    fetchChartData()
  }, [userId])

  return (
    <ChartContainer
      config={{
        emissions: {
          label: "CO₂ Emissions (kg)",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
      <LineChart data={chartData}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} labelFormatter={(value) => `Day ${value}`} />
        <Line
          type="monotone"
          dataKey="emissions"
          stroke="#16a34a"
          strokeWidth={3}
          dot={{ fill: "#16a34a", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#16a34a", strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
