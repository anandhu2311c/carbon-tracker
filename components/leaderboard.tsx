"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp, Users } from "lucide-react"
import { getLeaderboard, getUserStats } from "@/lib/database"
import type { UserStats } from "@/lib/supabase"

interface LeaderboardProps {
  userId: string
}

interface LeaderboardEntry extends UserStats {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  }
  rank: number
}

export function Leaderboard({ userId }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const { data: leaderboard } = await getLeaderboard(20)
        const { data: stats } = await getUserStats(userId)

        if (leaderboard) {
          const rankedData = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }))
          setLeaderboardData(rankedData)
        }

        if (stats) {
          setUserStats(stats)
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [userId])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-300"
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-300"
      default:
        return "bg-blue-100 text-blue-800 border-blue-300"
    }
  }

  const getUserRank = () => {
    const userEntry = leaderboardData.find((entry) => entry.user_id === userId)
    return userEntry?.rank || 0
  }

  const getPointsToNext = () => {
    const userRank = getUserRank()
    if (userRank <= 1) return 0

    const nextRankEntry = leaderboardData.find((entry) => entry.rank === userRank - 1)
    const currentPoints = userStats?.total_points || 0
    const nextPoints = nextRankEntry?.total_points || 0

    return Math.max(0, nextPoints - currentPoints)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div>
        <h1 className="text-3xl font-bold text-green-800">Leaderboard</h1>
        <p className="text-green-600 mt-1">
          Compete with the community and see who's making the biggest environmental impact
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:border-yellow-700 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">#{getUserRank() || "N/A"}</div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              out of {leaderboardData.length} participants
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-700 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Points to Next</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {getPointsToNext().toLocaleString()}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">points needed for next rank</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-700 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Community</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{leaderboardData.length}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">active eco-warriors</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Leaderboard */}
      <Card className="border-green-200 dark:border-green-700 bg-card dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Eco-Warriors
          </CardTitle>
          <CardDescription>Rankings based on eco points and sustainable activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.slice(0, 10).map((user) => {
              const isCurrentUser = user.user_id === userId
              const displayName = user.profiles.full_name || "Anonymous User"
              const reductionPercentage = Math.max(
                0,
                Math.min(100, Math.round((user.emissions_saved / Math.max(user.total_emissions, 1)) * 100)),
              )

              return (
                <div
                  key={user.user_id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    isCurrentUser
                      ? "bg-green-100 border-2 border-green-300 shadow-md dark:bg-green-900/30 dark:border-green-600"
                      : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8">{getRankIcon(user.rank)}</div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profiles.avatar_url || "/placeholder.svg"} alt={displayName} />
                      <AvatarFallback>
                        {displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${isCurrentUser ? "text-green-800" : "text-gray-900"}`}>
                          {displayName}
                        </h4>
                        {isCurrentUser && (
                          <Badge variant="outline" className="bg-green-200 text-green-800 border-green-400">
                            You
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={getRankBadgeColor(user.rank)}>
                        Eco Warrior
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{user.total_points.toLocaleString()}</p>
                        <p className="text-gray-500">points</p>
                      </div>
                      <div>
                        <p className="font-semibold text-green-600">{user.current_streak}</p>
                        <p className="text-gray-500">day streak</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-600">{user.activities_logged}</p>
                        <p className="text-gray-500">activities</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
