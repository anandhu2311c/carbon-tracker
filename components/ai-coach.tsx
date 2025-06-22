"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Bot,
  Lightbulb,
  TrendingUp,
  Target,
  Calendar,
  Leaf,
  Zap,
  Car,
  Home,
  ChevronRight,
  Star,
  Trophy,
  MessageCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { getUserStats, getUserActivities, getActivitiesByDateRange } from "@/lib/database"
import { generatePersonalizedInsights, generateWeeklyReport, type AIInsight } from "@/lib/ai-service"
import type { UserStats } from "@/lib/supabase"

interface AICoachProps {
  userId: string
}

interface WeeklyReport {
  summary: string
  recommendations: string[]
  insights: string[]
  totalEmissions: number
  emissionsChange: number
  topCategory: string
  streak: number
  achievements: number
}

export function AICoach({ userId }: AICoachProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null)

  useEffect(() => {
    fetchAIInsights()
  }, [userId])

  const fetchAIInsights = async () => {
    try {
      const [{ data: stats }, { data: activities }, { data: weekActivities }] = await Promise.all([
        getUserStats(userId),
        getUserActivities(userId, 50),
        getActivitiesByDateRange(
          userId,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          new Date().toISOString().split("T")[0],
        ),
      ])

      if (stats) setUserStats(stats)

      // Generate AI insights based on user data
      if (stats && activities && weekActivities) {
        setGeneratingInsights(true)

        const [aiInsights, aiReport] = await Promise.all([
          generatePersonalizedInsights(stats, activities, weekActivities),
          generateWeeklyReport(weekActivities),
        ])

        setInsights(aiInsights)

        // Combine AI report with calculated data
        const totalEmissions = weekActivities.reduce((sum, a) => sum + a.emissions, 0)
        const categoryEmissions = {
          transport: weekActivities.filter((a) => a.type === "transport").reduce((sum, a) => sum + a.emissions, 0),
          energy: weekActivities.filter((a) => a.type === "energy").reduce((sum, a) => sum + a.emissions, 0),
          food: weekActivities.filter((a) => a.type === "food").reduce((sum, a) => sum + a.emissions, 0),
          home: weekActivities.filter((a) => a.type === "home").reduce((sum, a) => sum + a.emissions, 0),
        }

        const topCategory = Object.entries(categoryEmissions).reduce((a, b) =>
          categoryEmissions[a[0] as keyof typeof categoryEmissions] >
          categoryEmissions[b[0] as keyof typeof categoryEmissions]
            ? a
            : b,
        )[0]

        setWeeklyReport({
          ...aiReport,
          totalEmissions,
          emissionsChange: Math.random() > 0.5 ? -12 : 8, // Mock change for now
          topCategory,
          streak: stats.current_streak,
          achievements: Math.floor(Math.random() * 3) + 1,
        })

        setGeneratingInsights(false)
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error)
      setGeneratingInsights(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshInsights = async () => {
    setGeneratingInsights(true)
    await fetchAIInsights()
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "red"
      case "medium":
        return "yellow"
      case "low":
        return "green"
      default:
        return "gray"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tip":
        return Lightbulb
      case "warning":
        return TrendingUp
      case "achievement":
        return Trophy
      case "goal":
        return Target
      default:
        return MessageCircle
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport":
        return Car
      case "energy":
        return Zap
      case "food":
        return Leaf
      case "home":
        return Home
      default:
        return Bot
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Eco Coach
          </h1>
          <p className="text-green-600 dark:text-green-400 mt-1">
            Personalized insights powered by Llama 3.3 70B • Quick reports by Llama 3.1 8B
          </p>
        </div>
        <Button
          onClick={refreshInsights}
          disabled={generatingInsights}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generatingInsights ? "animate-spin" : ""}`} />
          {generatingInsights ? "Generating..." : "Refresh Insights"}
        </Button>
      </div>

      {/* Weekly Report */}
      {weeklyReport && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              AI Weekly Report
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700"
              >
                Llama 3.1 8B Instant
              </Badge>
            </CardTitle>
            <CardDescription className="dark:text-gray-400">{weeklyReport.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {weeklyReport.totalEmissions.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">kg CO₂ this week</p>
              </div>
              <div className="text-center">
                <p
                  className={`text-2xl font-bold ${weeklyReport.emissionsChange < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {weeklyReport.emissionsChange > 0 ? "+" : ""}
                  {weeklyReport.emissionsChange}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">vs last week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{weeklyReport.topCategory}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">top category</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{weeklyReport.achievements}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">new achievements</p>
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                AI Insights
              </h4>
              <ul className="space-y-1">
                {weeklyReport.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Personalized AI Insights
            {generatingInsights && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Llama 3.3 70B analyzing...</span>
              </div>
            )}
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Deep analysis using Llama 3.3 70B • Based on your activity patterns and environmental data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.length === 0 && !generatingInsights ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Keep logging activities to receive personalized insights from your AI coach!
                </p>
                <Button onClick={refreshInsights} className="bg-green-600 hover:bg-green-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Insights
                </Button>
              </div>
            ) : (
              insights.map((insight) => {
                const TypeIcon = getTypeIcon(insight.type)
                const CategoryIcon = getCategoryIcon(insight.category)
                const impactColor = getImpactColor(insight.impact)

                return (
                  <div
                    key={insight.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full bg-${impactColor}-100 dark:bg-${impactColor}-900/30`}>
                        <TypeIcon className={`h-5 w-5 text-${impactColor}-600 dark:text-${impactColor}-400`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{insight.title}</h4>
                          <Badge
                            variant="outline"
                            className={`bg-${impactColor}-100 text-${impactColor}-800 border-${impactColor}-300 dark:bg-${impactColor}-900/30 dark:text-${impactColor}-200 dark:border-${impactColor}-700`}
                          >
                            {insight.impact} impact
                          </Badge>
                          <CategoryIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <Badge
                            variant="outline"
                            className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700 text-xs"
                          >
                            Llama 3.3 70B
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{insight.description}</p>
                        {insight.potentialSaving > 0 && (
                          <div className="flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Potential saving: {insight.potentialSaving.toFixed(1)} kg CO₂
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {weeklyReport && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Recommended Actions
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Smart suggestions to reduce your carbon footprint this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyReport.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Tracking */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Track your improvement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Monthly Emission Reduction Goal</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Sustainable Transport Usage</span>
                <span className="font-medium">40%</span>
              </div>
              <Progress value={40} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Energy Efficiency Score</span>
                <span className="font-medium">78%</span>
              </div>
              <Progress value={78} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
