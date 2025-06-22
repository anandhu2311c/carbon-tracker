"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getActivitiesByDateRange } from "@/lib/database"

interface ActivityBreakdownProps {
  userId: string
}

export function ActivityBreakdown({ userId }: ActivityBreakdownProps) {
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([])

  useEffect(() => {
    const fetchBreakdownData = async () => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(1) // First day of current month

      const { data: activities } = await getActivitiesByDateRange(
        userId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      )

      if (activities) {
        // Group activities by type and sum emissions
        const typeEmissions: Record<string, number> = {
          transport: 0,
          energy: 0,
          food: 0,
          home: 0,
        }

        activities.forEach((activity) => {
          typeEmissions[activity.type] += activity.emissions
        })

        const total = Object.values(typeEmissions).reduce((sum, val) => sum + val, 0)

        if (total > 0) {
          const chartData = [
            { name: "Transport", value: Math.round((typeEmissions.transport / total) * 100), color: "#3b82f6" },
            { name: "Energy", value: Math.round((typeEmissions.energy / total) * 100), color: "#eab308" },
            { name: "Food", value: Math.round((typeEmissions.food / total) * 100), color: "#16a34a" },
            { name: "Home", value: Math.round((typeEmissions.home / total) * 100), color: "#8b5cf6" },
          ].filter((item) => item.value > 0)

          setData(chartData)
        }
      }
    }

    fetchBreakdownData()
  }, [userId])

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-500">
        No activity data available for this month
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ChartContainer
        config={{
          transport: { label: "Transport", color: "#3b82f6" },
          energy: { label: "Energy", color: "#eab308" },
          food: { label: "Food", color: "#16a34a" },
          home: { label: "Home", color: "#8b5cf6" },
        }}
        className="h-[200px]"
      >
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>

      <div className="grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600">{item.name}</span>
            <span className="text-sm font-medium ml-auto">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
