"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Leaf, TrendingDown, Calendar, Award, Car } from "lucide-react"
import { CarbonChart } from "@/components/carbon-chart"
import { ActivityBreakdown } from "@/components/activity-breakdown"
import { getUserStats, getUserActivities, getActivitiesByDateRange } from "@/lib/database"
import type { UserStats, Activity } from "@/lib/supabase"

interface DashboardProps {
  userId: string
}

export function Dashboard({ userId }: DashboardProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [todayEmissions, setTodayEmissions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user stats
        const { data: stats } = await getUserStats(userId)
        if (stats) setUserStats(stats)

        // Fetch recent activities
        const { data: activities } = await getUserActivities(userId, 10)
        if (activities) setRecentActivities(activities)

        // Calculate today's emissions
        const today = new Date().toISOString().split("T")[0]
        const { data: todayActivities } = await getActivitiesByDateRange(userId, today, today)
        if (todayActivities) {
          const todayTotal = todayActivities.reduce((sum, activity) => sum + activity.emissions, 0)
          setTodayEmissions(todayTotal)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const monthlyGoal = 60 // kg CO2
  const currentProgress = userStats ? Math.min((userStats.total_emissions / monthlyGoal) * 100, 100) : 0
  const reduction = 15 // This would be calculated based on historical data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Carbon Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your environmental impact and celebrate progress</p>
        </div>
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700"
        >
          <Leaf className="h-4 w-4 mr-1" />
          {userStats?.current_streak || 0} day streak
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Today's Footprint</CardTitle>
            <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{todayEmissions.toFixed(1)} kg</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">CO₂ equivalent</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Monthly Progress</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {userStats?.total_emissions.toFixed(1) || 0} kg
            </div>
            <Progress value={currentProgress} className="mt-2 h-2" />
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {currentProgress.toFixed(0)}% of {monthlyGoal}kg goal
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Activities Logged
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {userStats?.activities_logged || 0}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">total activities</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Eco Points</CardTitle>
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {userStats?.total_points || 0}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">total earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Carbon Footprint Trend</CardTitle>
            <CardDescription>Your daily emissions over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <CarbonChart userId={userId} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Activity Breakdown</CardTitle>
            <CardDescription>Your emissions by category this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityBreakdown userId={userId} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activities</CardTitle>
          <CardDescription>Your latest logged activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.activity_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.amount} {activity.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                  >
                    {activity.emissions.toFixed(1)} kg CO₂
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eco Tips */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:border-green-800 dark:from-green-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Today's Eco Tip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 dark:text-green-300">
            💡 Try walking or cycling for trips under 2 miles. You could save up to 0.8 kg of CO₂ and earn bonus eco
            points for choosing sustainable transport!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
