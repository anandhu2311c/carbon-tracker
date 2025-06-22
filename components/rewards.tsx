"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Trophy,
  Award,
  Star,
  Gift,
  Leaf,
  Zap,
  Car,
  Crown,
  Medal,
  Target,
  TrendingUp,
  CheckCircle,
  Sparkles,
} from "lucide-react"
import {
  getUserAchievements,
  getAllAchievements,
  getAllRewards,
  redeemReward,
  getUserStats,
  refreshUserData,
} from "@/lib/database"
import type { UserAchievement, Achievement, Reward, UserStats } from "@/lib/supabase"

interface RewardsProps {
  userId: string
}

export function Rewards({ userId }: RewardsProps) {
  const [earnedAchievements, setEarnedAchievements] = useState<UserAchievement[]>([])
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemLoading, setRedeemLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newAchievements, setNewAchievements] = useState<string[]>([]) // Track newly earned achievements
  const [pointsAnimation, setPointsAnimation] = useState<number | null>(null)

  useEffect(() => {
    fetchRewardsData()

    // Set up polling to check for new achievements every 10 seconds
    const interval = setInterval(() => {
      checkForNewAchievements()
    }, 10000)

    return () => clearInterval(interval)
  }, [userId])

  const fetchRewardsData = async () => {
    try {
      const [
        { data: userAchievements, error: achievementsError },
        { data: achievements, error: allAchievementsError },
        { data: availableRewards, error: rewardsError },
        { data: stats, error: statsError },
      ] = await Promise.all([getUserAchievements(userId), getAllAchievements(), getAllRewards(), getUserStats(userId)])

      if (achievementsError) {
        console.error("Error fetching user achievements:", achievementsError)
        setError("Failed to load achievements")
      }
      if (allAchievementsError) {
        console.error("Error fetching all achievements:", allAchievementsError)
        setError("Failed to load achievement data")
      }
      if (rewardsError) {
        console.error("Error fetching rewards:", rewardsError)
        setError("Failed to load rewards")
      }
      if (statsError) {
        console.error("Error fetching user stats:", statsError)
        setError("Failed to load user statistics")
      }

      if (userAchievements) setEarnedAchievements(userAchievements)
      if (achievements) setAllAchievements(achievements)
      if (availableRewards) setRewards(availableRewards)
      if (stats) setUserStats(stats)
    } catch (error) {
      console.error("Error fetching rewards data:", error)
      setError("Failed to load rewards data")
    } finally {
      setLoading(false)
    }
  }

  const checkForNewAchievements = async () => {
    try {
      // Refresh user data to check for new achievements
      const { data: refreshData } = await refreshUserData(userId)

      if (refreshData && refreshData.points_awarded > 0) {
        // New achievements were earned!
        setPointsAnimation(refreshData.points_awarded)
        setSuccess(`🎉 New achievement unlocked! +${refreshData.points_awarded} Eco Points earned!`)

        // Refresh all data
        const [{ data: userAchievements, error: achievementsError }, { data: stats, error: statsError }] =
          await Promise.all([getUserAchievements(userId), getUserStats(userId)])

        if (achievementsError) {
          console.error("Error refreshing achievements:", achievementsError)
          return
        }
        if (statsError) {
          console.error("Error refreshing stats:", statsError)
          return
        }

        if (userAchievements) {
          // Find newly earned achievements
          const previousIds = earnedAchievements.map((ua) => ua.achievement_id)
          const newIds = userAchievements
            .filter((ua) => ua.achievement) // Filter out achievements without data
            .map((ua) => ua.achievement_id)
            .filter((id) => !previousIds.includes(id))

          if (newIds.length > 0) {
            setNewAchievements(newIds)
            // Clear the highlight after 5 seconds
            setTimeout(() => setNewAchievements([]), 5000)
          }

          setEarnedAchievements(userAchievements)
        }

        if (stats) setUserStats(stats)

        // Clear animations after 3 seconds
        setTimeout(() => {
          setPointsAnimation(null)
          setSuccess(null)
        }, 3000)
      }
    } catch (error) {
      console.error("Error checking for new achievements:", error)
    }
  }

  const handleRedeemReward = async (rewardId: string, cost: number) => {
    if (!userStats || userStats.total_points < cost) {
      setError("Insufficient points to redeem this reward")
      return
    }

    setRedeemLoading(rewardId)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await redeemReward(userId, rewardId)

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Reward redeemed successfully! Check your email for details.")
        // Refresh user stats
        const { data: updatedStats } = await getUserStats(userId)
        if (updatedStats) setUserStats(updatedStats)
      }
    } catch (err) {
      setError("Failed to redeem reward. Please try again.")
    } finally {
      setRedeemLoading(null)
    }
  }

  const getAvailableAchievements = () => {
    const earnedIds = earnedAchievements.map((ua) => ua.achievement_id)
    return allAchievements.filter((achievement) => !earnedIds.includes(achievement.id))
  }

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Leaf,
      Star,
      TrendingUp,
      Award,
      Crown,
      Medal,
      Car,
      Zap,
      Target,
      Gift,
    }
    return icons[iconName] || Award
  }

  const calculateProgress = (achievement: Achievement) => {
    if (!userStats) return 0

    switch (achievement.requirement_type) {
      case "activity_count":
        return Math.min((userStats.activities_logged / achievement.requirement_value) * 100, 100)
      case "streak":
        return Math.min((userStats.current_streak / achievement.requirement_value) * 100, 100)
      case "reduction":
        const reductionPercent = (userStats.emissions_saved / Math.max(userStats.total_emissions, 1)) * 100
        return Math.min((reductionPercent / achievement.requirement_value) * 100, 100)
      case "category_complete":
        // This would need to be calculated based on activity types
        return 0
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">Rewards & Achievements</h1>
          <p className="text-green-600 dark:text-green-400 mt-1">Earn badges and redeem eco-friendly rewards</p>
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-bold text-green-800 dark:text-green-200 transition-all duration-500 ${
              pointsAnimation ? "scale-110 text-yellow-600 dark:text-yellow-400" : ""
            }`}
          >
            {userStats?.total_points.toLocaleString() || 0}
            {pointsAnimation && (
              <span className="inline-flex items-center ml-2 text-lg animate-bounce">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-1" />+{pointsAnimation}
              </span>
            )}
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">Eco Points Available</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Earned Achievements */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Achievements ({earnedAchievements.length})
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Badges you've earned on your eco journey</CardDescription>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No achievements earned yet. Start logging activities to unlock your first badge!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {earnedAchievements
                .map((userAchievement) => {
                  // Add null check for achievement
                  if (!userAchievement.achievement) {
                    console.warn("Achievement data missing for user achievement:", userAchievement.id)
                    return null
                  }

                  const achievement = userAchievement.achievement
                  const IconComponent = getIconComponent(achievement.icon || "Award")
                  const isNew = newAchievements.includes(achievement.id)

                  return (
                    <div
                      key={userAchievement.id}
                      className={`p-4 rounded-lg bg-${achievement.color || "gray"}-50 border-2 border-${
                        achievement.color || "gray"
                      }-200 relative transition-all duration-500 ${
                        isNew ? "ring-4 ring-yellow-400 ring-opacity-75 animate-pulse" : ""
                      } dark:bg-${achievement.color || "gray"}-900/20 dark:border-${achievement.color || "gray"}-800`}
                    >
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={`bg-${achievement.color}-100 text-${achievement.color}-800 border-${achievement.color}-300 dark:bg-${achievement.color}-900/30 dark:text-${achievement.color}-200 dark:border-${achievement.color}-700 ${
                            isNew ? "animate-bounce" : ""
                          }`}
                        >
                          {isNew ? "🆕 New!" : "Earned"}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div
                          className={`inline-flex p-3 rounded-full bg-${achievement.color}-100 mb-3 dark:bg-${achievement.color}-900/30 ${
                            isNew ? "animate-pulse" : ""
                          }`}
                        >
                          <IconComponent
                            className={`h-8 w-8 text-${achievement.color}-600 dark:text-${achievement.color}-400`}
                          />
                        </div>
                        <h3
                          className={`font-semibold text-${achievement.color}-800 mb-1 dark:text-${achievement.color}-200`}
                        >
                          {achievement.name}
                        </h3>
                        <p className={`text-sm text-${achievement.color}-600 mb-2 dark:text-${achievement.color}-400`}>
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Earned {new Date(userAchievement.earned_at).toLocaleDateString()}
                        </p>
                        {isNew && (
                          <div className="mt-2 flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-xs font-semibold">+{achievement.points_reward} points!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
                .filter(Boolean)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Achievements */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Next Achievements
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Badges you can work towards earning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getAvailableAchievements()
              .slice(0, 6)
              .map((achievement) => {
                const IconComponent = getIconComponent(achievement.icon)
                const progress = calculateProgress(achievement)
                const isAlmostComplete = progress >= 80

                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 ${
                      isAlmostComplete ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-full bg-${achievement.color}-100 dark:bg-${achievement.color}-900/30 ${
                          isAlmostComplete ? "animate-pulse" : ""
                        }`}
                      >
                        <IconComponent
                          className={`h-6 w-6 text-${achievement.color}-600 dark:text-${achievement.color}-400`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{achievement.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span
                              className={`font-medium ${isAlmostComplete ? "text-yellow-600 dark:text-yellow-400" : ""}`}
                            >
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} className={`h-2 ${isAlmostComplete ? "animate-pulse" : ""}`} />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-green-600 dark:text-green-400">
                              +{achievement.points_reward} points when earned
                            </p>
                            {isAlmostComplete && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700"
                              >
                                Almost there!
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Store */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards Store
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Redeem your eco points for real-world impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => {
              const IconComponent = getIconComponent(reward.icon)
              const canAfford = userStats ? userStats.total_points >= reward.cost : false
              const isRedeeming = redeemLoading === reward.id

              // Define color classes based on reward color and availability
              const getCardClasses = () => {
                if (!reward.available) {
                  return "p-6 rounded-lg border-2 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                }

                switch (reward.color) {
                  case "green":
                    return "p-6 rounded-lg border-2 bg-white border-green-200 dark:bg-gray-800 dark:border-green-700"
                  case "blue":
                    return "p-6 rounded-lg border-2 bg-white border-blue-200 dark:bg-gray-800 dark:border-blue-700"
                  case "purple":
                    return "p-6 rounded-lg border-2 bg-white border-purple-200 dark:bg-gray-800 dark:border-purple-700"
                  case "orange":
                    return "p-6 rounded-lg border-2 bg-white border-orange-200 dark:bg-gray-800 dark:border-orange-700"
                  default:
                    return "p-6 rounded-lg border-2 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                }
              }

              const getIconClasses = () => {
                if (!reward.available) {
                  return "p-3 rounded-full bg-gray-100 dark:bg-gray-700"
                }

                switch (reward.color) {
                  case "green":
                    return "p-3 rounded-full bg-green-100 dark:bg-green-900/30"
                  case "blue":
                    return "p-3 rounded-full bg-blue-100 dark:bg-blue-900/30"
                  case "purple":
                    return "p-3 rounded-full bg-purple-100 dark:bg-purple-900/30"
                  case "orange":
                    return "p-3 rounded-full bg-orange-100 dark:bg-orange-900/30"
                  default:
                    return "p-3 rounded-full bg-gray-100 dark:bg-gray-700"
                }
              }

              const getIconColorClasses = () => {
                if (!reward.available) {
                  return "h-6 w-6 text-gray-400 dark:text-gray-500"
                }

                switch (reward.color) {
                  case "green":
                    return "h-6 w-6 text-green-600 dark:text-green-400"
                  case "blue":
                    return "h-6 w-6 text-blue-600 dark:text-blue-400"
                  case "purple":
                    return "h-6 w-6 text-purple-600 dark:text-purple-400"
                  case "orange":
                    return "h-6 w-6 text-orange-600 dark:text-orange-400"
                  default:
                    return "h-6 w-6 text-gray-600 dark:text-gray-400"
                }
              }

              const getTitleClasses = () => {
                return reward.available
                  ? "font-semibold mb-2 text-gray-900 dark:text-gray-100"
                  : "font-semibold mb-2 text-gray-400 dark:text-gray-500"
              }

              const getDescriptionClasses = () => {
                return reward.available
                  ? "text-sm mb-4 text-gray-600 dark:text-gray-300"
                  : "text-sm mb-4 text-gray-400 dark:text-gray-500"
              }

              const getPriceClasses = () => {
                return reward.available
                  ? "text-lg font-bold text-gray-900 dark:text-gray-100"
                  : "text-lg font-bold text-gray-400 dark:text-gray-500"
              }

              return (
                <div key={reward.id} className={getCardClasses()}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={getIconClasses()}>
                      <IconComponent className={getIconColorClasses()} />
                    </div>
                    <div className="text-right">
                      <div className={getPriceClasses()}>{reward.cost.toLocaleString()}</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">points</p>
                    </div>
                  </div>

                  <h3 className={getTitleClasses()}>{reward.name}</h3>
                  <p className={getDescriptionClasses()}>{reward.description}</p>

                  <Button
                    className={`w-full ${
                      reward.available && canAfford
                        ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                        : "bg-gray-300 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                    }`}
                    disabled={!reward.available || !canAfford || isRedeeming}
                    onClick={() => handleRedeemReward(reward.id, reward.cost)}
                  >
                    {isRedeeming
                      ? "Redeeming..."
                      : !reward.available
                        ? "Coming Soon"
                        : canAfford
                          ? "Redeem Now"
                          : `Need ${(reward.cost - (userStats?.total_points || 0)).toLocaleString()} more points`}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
