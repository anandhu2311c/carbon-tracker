"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Zap, Utensils, HomeIcon, Plus, Clock, CheckCircle, Sparkles } from "lucide-react"
import { createActivity, getUserActivities, calculateEmissions, refreshUserData } from "@/lib/database"
import type { Activity } from "@/lib/supabase"

const activityTypes = [
  { id: "transport", name: "Transportation", icon: Car, color: "blue" },
  { id: "energy", name: "Energy Usage", icon: Zap, color: "yellow" },
  { id: "food", name: "Food & Diet", icon: Utensils, color: "green" },
  { id: "home", name: "Home & Lifestyle", icon: HomeIcon, color: "purple" },
]

const unitOptions: Record<string, string[]> = {
  transport: ["miles", "km", "gallons", "liters", "hours", "trips"],
  energy: ["kWh", "therms", "1000ft3", "gallons", "dollars", "hours"],
  food: ["kg", "g", "lbs", "servings", "meals"],
  home: ["people", "bags", "pounds", "gallons", "minutes", "hours", "units"],
}

interface ActivityTrackerProps {
  userId: string
}

export function ActivityTracker({ userId }: ActivityTrackerProps) {
  const [selectedType, setSelectedType] = useState("")
  const [activity, setActivity] = useState("")
  const [amount, setAmount] = useState("")
  const [unit, setUnit] = useState("")
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pointsEarned, setPointsEarned] = useState<number | null>(null)

  useEffect(() => {
    fetchRecentActivities()
  }, [userId])

  const fetchRecentActivities = async () => {
    const { data, error } = await getUserActivities(userId, 10)
    if (data) {
      setRecentActivities(data)
    }
    if (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setPointsEarned(null)

    if (!selectedType || !activity || !amount || !unit) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      setLoading(false)
      return
    }

    try {
      const emissions = calculateEmissions(selectedType, amountNum, unit, activity)

      const { data, error } = await createActivity({
        user_id: userId,
        type: selectedType as "transport" | "energy" | "food" | "home",
        activity_name: activity,
        amount: amountNum,
        unit,
        emissions,
        date: new Date().toISOString().split("T")[0],
      })

      if (error) {
        setError(error.message)
      } else {
        // Refresh user data to get updated points and achievements
        const { data: refreshData } = await refreshUserData(userId)

        const basePoints = 10 // Base points for logging activity
        const achievementPoints = refreshData?.points_awarded || 0
        const totalPoints = basePoints + achievementPoints

        setPointsEarned(totalPoints)
        setSuccess(`Activity logged! Generated ${emissions.toFixed(1)} kg CO₂`)

        // Reset form
        setSelectedType("")
        setActivity("")
        setAmount("")
        setUnit("")

        // Refresh activities
        fetchRecentActivities()
      }
    } catch (err) {
      setError("Failed to log activity. Please try again.")
    }

    setLoading(false)
  }

  const getTypeColor = (type: string) => {
    const typeObj = activityTypes.find((t) => t.id === type)
    return typeObj?.color || "gray"
  }

  const getTypeIcon = (type: string) => {
    const typeObj = activityTypes.find((t) => t.id === type)
    return typeObj?.icon || Car
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">Activity Tracker</h1>
        <p className="text-green-600 dark:text-green-400 mt-1">
          Log your daily activities to monitor your carbon footprint
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/50">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
            {pointsEarned && (
              <div className="flex items-center gap-1 mt-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">+{pointsEarned} Eco Points earned!</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/50">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Activity Form */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Activity
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Track your carbon emissions by logging daily activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value)
                    setUnit("") // Reset unit when type changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Activity Description</Label>
                <Input
                  id="activity"
                  placeholder="e.g., Bike to work, Electric car drive, Walk to store"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 15, 2.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit} disabled={!selectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedType &&
                      unitOptions[selectedType]?.map((unitOption) => (
                        <SelectItem key={unitOption} value={unitOption}>
                          {unitOption}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Adding..." : "Add Activity"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activity Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityTypes.map((type) => (
          <Card
            key={type.id}
            className={`border-${type.color}-200 bg-gradient-to-br from-${type.color}-50 to-${type.color}-100 dark:from-${type.color}-900/20 dark:to-${type.color}-800/20 cursor-pointer hover:shadow-md transition-shadow dark:border-${type.color}-800`}
            onClick={() => setSelectedType(type.id)}
          >
            <CardContent className="p-6 text-center">
              <type.icon className={`h-12 w-12 text-${type.color}-600 dark:text-${type.color}-400 mx-auto mb-3`} />
              <h3 className={`font-semibold text-${type.color}-800 dark:text-${type.color}-200`}>{type.name}</h3>
              <p className={`text-sm text-${type.color}-600 dark:text-${type.color}-400 mt-1`}>Quick add</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Your latest logged activities and their carbon impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No activities logged yet. Start tracking your carbon footprint!
              </p>
            ) : (
              recentActivities.map((item) => {
                const IconComponent = getTypeIcon(item.type)
                const colorClass = getTypeColor(item.type)

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full bg-${colorClass}-100 dark:bg-${colorClass}-900/50`}>
                        <IconComponent className={`h-5 w-5 text-${colorClass}-600 dark:text-${colorClass}-400`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.activity_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.amount} {item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800"
                      >
                        {item.emissions.toFixed(1)} kg CO₂
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
