"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Plus, Calendar, TrendingDown, CheckCircle, Trash2 } from "lucide-react"
import { createGoal, getUserGoals, deleteGoal } from "@/lib/database"
import type { Goal } from "@/lib/supabase"

interface GoalsProps {
  userId: string
}

export function Goals({ userId }: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    target_value: "",
    deadline: "",
    category: "",
  })

  useEffect(() => {
    fetchGoals()
  }, [userId])

  const fetchGoals = async () => {
    try {
      const { data, error } = await getUserGoals(userId)
      if (data) {
        setGoals(data)
      }
      if (error) {
        console.error("Error fetching goals:", error)
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    setError(null)
    setSuccess(null)

    if (!newGoal.title || !newGoal.target_value || !newGoal.category) {
      setError("Please fill in all required fields")
      setSubmitLoading(false)
      return
    }

    const targetValue = Number.parseFloat(newGoal.target_value)
    if (isNaN(targetValue) || targetValue <= 0) {
      setError("Please enter a valid target value")
      setSubmitLoading(false)
      return
    }

    try {
      const { data, error } = await createGoal({
        user_id: userId,
        title: newGoal.title,
        description: newGoal.description || null,
        target_value: targetValue,
        current_value: 0,
        category: newGoal.category,
        deadline: newGoal.deadline || null,
        status: "active",
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Goal created successfully!")
        setShowAddGoal(false)
        setNewGoal({ title: "", description: "", target_value: "", deadline: "", category: "" })
        fetchGoals() // Refresh goals
      }
    } catch (err) {
      setError("Failed to create goal. Please try again.")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return

    try {
      const { error } = await deleteGoal(goalId)
      if (error) {
        setError(error.message)
      } else {
        setSuccess("Goal deleted successfully!")
        fetchGoals() // Refresh goals
      }
    } catch (err) {
      setError("Failed to delete goal. Please try again.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "transport":
        return "bg-blue-50 text-blue-700"
      case "energy":
        return "bg-yellow-50 text-yellow-700"
      case "food":
        return "bg-green-50 text-green-700"
      case "overall":
        return "bg-purple-50 text-purple-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100)
  }

  const activeGoals = goals.filter((goal) => goal.status === "active")
  const completedGoals = goals.filter((goal) => goal.status === "completed")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-green-800">Goals & Milestones</h1>
          <p className="text-green-600 mt-1">Set targets and track your progress towards a greener lifestyle</p>
        </div>
        <Button onClick={() => setShowAddGoal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Goal Form */}
      {showAddGoal && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Create New Goal</CardTitle>
            <CardDescription>Set a specific, measurable target for your eco journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Reduce car usage by 30%"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Transport, Energy, Food"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe your goal in detail"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Value *</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 50, 25"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitLoading}>
                  {submitLoading ? "Creating..." : "Create Goal"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals ({activeGoals.length})
          </CardTitle>
          <CardDescription>Your current targets and progress</CardDescription>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No active goals yet. Create your first goal to start tracking your progress!
            </p>
          ) : (
            <div className="space-y-6">
              {activeGoals.map((goal) => {
                const progress = calculateProgress(goal)
                const isOverdue = goal.deadline && new Date(goal.deadline) < new Date()

                return (
                  <div
                    key={goal.id}
                    className="p-6 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <Badge variant="outline" className={getCategoryColor(goal.category)}>
                            {goal.category}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        {goal.description && <p className="text-sm text-gray-600 mb-3">{goal.description}</p>}

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          {goal.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />
                            <span>
                              Current: {goal.current_value} / Target: {goal.target_value}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Goals ({completedGoals.length})
            </CardTitle>
            <CardDescription>Goals you've successfully achieved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/30 dark:border-green-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-800">{goal.title}</h4>
                        {goal.description && <p className="text-sm text-green-600">{goal.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 mb-1">
                        Completed
                      </Badge>
                      {goal.completed_at && (
                        <p className="text-xs text-green-600">{new Date(goal.completed_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-700 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{activeGoals.length}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">in progress</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-700 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{completedGoals.length}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">goals achieved</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-700 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Success Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">completion rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
