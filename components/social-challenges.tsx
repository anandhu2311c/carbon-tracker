"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Trophy, Target, Zap, Car, Leaf, Home, Crown, Medal, Star } from "lucide-react"
import { getUserStats } from "@/lib/database"
import type { UserStats } from "@/lib/supabase"

interface SocialChallengesProps {
  userId: string
}

interface Challenge {
  id: string
  title: string
  description: string
  category: "transport" | "energy" | "food" | "home" | "general"
  type: "individual" | "team" | "community"
  duration: number // days
  target: number
  unit: string
  participants: number
  reward: number // points
  difficulty: "easy" | "medium" | "hard"
  startDate: string
  endDate: string
  progress?: number
  isJoined?: boolean
  isCompleted?: boolean
  leaderboard?: ChallengeParticipant[]
}

interface ChallengeParticipant {
  id: string
  name: string
  avatar?: string
  progress: number
  rank: number
  points: number
}

interface Team {
  id: string
  name: string
  description: string
  members: number
  avgReduction: number
  totalPoints: number
  category: string
  isJoined: boolean
}

export function SocialChallenges({ userId }: SocialChallengesProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([])
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<"challenges" | "teams" | "leaderboard">("challenges")

  useEffect(() => {
    fetchSocialData()
  }, [userId])

  const fetchSocialData = async () => {
    try {
      const { data: stats } = await getUserStats(userId)
      if (stats) setUserStats(stats)

      // Mock data - in real app, this would come from your backend
      setActiveChallenges(mockActiveChallenges)
      setAvailableChallenges(mockAvailableChallenges)
      setTeams(mockTeams)
    } catch (error) {
      console.error("Error fetching social data:", error)
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = (challengeId: string) => {
    setAvailableChallenges((prev) =>
      prev.map((challenge) =>
        challenge.id === challengeId
          ? { ...challenge, isJoined: true, participants: challenge.participants + 1 }
          : challenge,
      ),
    )

    const challenge = availableChallenges.find((c) => c.id === challengeId)
    if (challenge) {
      setActiveChallenges((prev) => [...prev, { ...challenge, isJoined: true, progress: 0 }])
    }
  }

  const joinTeam = (teamId: string) => {
    setTeams((prev) =>
      prev.map((team) => (team.id === teamId ? { ...team, isJoined: true, members: team.members + 1 } : team)),
    )
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
        return Target
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "green"
      case "medium":
        return "yellow"
      case "hard":
        return "red"
      default:
        return "gray"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "individual":
        return Target
      case "team":
        return Users
      case "community":
        return Crown
      default:
        return Trophy
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
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
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
          <Users className="h-8 w-8" />
          Social Challenges
        </h1>
        <p className="text-green-600 dark:text-green-400 mt-1">
          Join the community and compete in eco-friendly challenges
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{activeChallenges.length}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Active Challenges</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
              {teams.filter((t) => t.isJoined).length}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">Teams Joined</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {activeChallenges.filter((c) => c.isCompleted).length}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {activeChallenges.reduce((sum, c) => sum + c.reward, 0)}
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">Potential Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "challenges", label: "Challenges", icon: Trophy },
          { id: "teams", label: "Teams", icon: Users },
          { id: "leaderboard", label: "Leaderboard", icon: Crown },
        ].map((tab) => {
          const IconComponent = tab.icon
          return (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "ghost"}
              onClick={() => setSelectedTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Challenges Tab */}
      {selectedTab === "challenges" && (
        <div className="space-y-6">
          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200">Your Active Challenges</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Challenges you're currently participating in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChallenges.map((challenge) => {
                    const CategoryIcon = getCategoryIcon(challenge.category)
                    const TypeIcon = getTypeIcon(challenge.type)
                    const difficultyColor = getDifficultyColor(challenge.difficulty)

                    return (
                      <div key={challenge.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <TypeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`bg-${difficultyColor}-100 text-${difficultyColor}-800 border-${difficultyColor}-300 dark:bg-${difficultyColor}-900/30 dark:text-${difficultyColor}-200 dark:border-${difficultyColor}-700`}
                          >
                            {challenge.difficulty}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{challenge.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{challenge.description}</p>

                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium">{challenge.progress || 0}%</span>
                          </div>
                          <Progress value={challenge.progress || 0} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {challenge.participants} participants
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            +{challenge.reward} points
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Challenges */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200">Available Challenges</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Join new challenges to earn points and make an impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableChallenges.map((challenge) => {
                  const CategoryIcon = getCategoryIcon(challenge.category)
                  const TypeIcon = getTypeIcon(challenge.type)
                  const difficultyColor = getDifficultyColor(challenge.difficulty)

                  return (
                    <div
                      key={challenge.id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <TypeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <Badge
                          variant="outline"
                          className={`bg-${difficultyColor}-100 text-${difficultyColor}-800 border-${difficultyColor}-300 dark:bg-${difficultyColor}-900/30 dark:text-${difficultyColor}-200 dark:border-${difficultyColor}-700`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{challenge.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{challenge.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Target</span>
                          <span className="font-medium">
                            {challenge.target} {challenge.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Duration</span>
                          <span className="font-medium">{challenge.duration} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Participants</span>
                          <span className="font-medium">{challenge.participants}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => joinChallenge(challenge.id)}
                        disabled={challenge.isJoined}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {challenge.isJoined ? "Joined" : "Join Challenge"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams Tab */}
      {selectedTab === "teams" && (
        <div className="space-y-6">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="text-purple-800 dark:text-purple-200">Eco Teams</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Join teams to collaborate on environmental goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team) => (
                  <div key={team.id} className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{team.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{team.description}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700"
                      >
                        {team.category}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{team.members}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{team.avgReduction}%</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Avg Reduction</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{team.totalPoints}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Points</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => joinTeam(team.id)}
                      disabled={team.isJoined}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {team.isJoined ? "Joined" : "Join Team"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Tab */}
      {selectedTab === "leaderboard" && (
        <div className="space-y-6">
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Challenge Leaderboards</CardTitle>
              <CardDescription className="dark:text-gray-400">See how you rank in active challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{challenge.title}</h4>
                    <div className="space-y-2">
                      {(challenge.leaderboard || mockLeaderboard).map((participant, index) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-center w-8 h-8">
                            {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                            {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                            {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                            {index > 2 && <span className="text-sm font-bold text-gray-500">#{index + 1}</span>}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{participant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{participant.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{participant.progress}% complete</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600 dark:text-blue-400">{participant.points}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Mock data
const mockActiveChallenges: Challenge[] = [
  {
    id: "1",
    title: "Car-Free Week",
    description: "Avoid using personal vehicles for 7 days",
    category: "transport",
    type: "community",
    duration: 7,
    target: 0,
    unit: "car trips",
    participants: 234,
    reward: 500,
    difficulty: "medium",
    startDate: "2024-01-15",
    endDate: "2024-01-22",
    progress: 65,
    isJoined: true,
    isCompleted: false,
  },
  {
    id: "2",
    title: "Energy Saver",
    description: "Reduce home energy consumption by 20%",
    category: "energy",
    type: "individual",
    duration: 30,
    target: 20,
    unit: "% reduction",
    participants: 156,
    reward: 750,
    difficulty: "hard",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    progress: 45,
    isJoined: true,
    isCompleted: false,
  },
]

const mockAvailableChallenges: Challenge[] = [
  {
    id: "3",
    title: "Plant-Based January",
    description: "Eat plant-based meals for the entire month",
    category: "food",
    type: "community",
    duration: 31,
    target: 31,
    unit: "days",
    participants: 1247,
    reward: 1000,
    difficulty: "hard",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    isJoined: false,
  },
  {
    id: "4",
    title: "Zero Waste Week",
    description: "Produce no waste for 7 consecutive days",
    category: "home",
    type: "individual",
    duration: 7,
    target: 0,
    unit: "kg waste",
    participants: 89,
    reward: 400,
    difficulty: "medium",
    startDate: "2024-01-20",
    endDate: "2024-01-27",
    isJoined: false,
  },
  {
    id: "5",
    title: "Bike to Work",
    description: "Cycle to work every day this week",
    category: "transport",
    type: "team",
    duration: 5,
    target: 5,
    unit: "bike trips",
    participants: 67,
    reward: 300,
    difficulty: "easy",
    startDate: "2024-01-22",
    endDate: "2024-01-26",
    isJoined: false,
  },
]

const mockTeams: Team[] = [
  {
    id: "1",
    name: "Green Commuters",
    description: "Dedicated to sustainable transportation",
    members: 45,
    avgReduction: 32,
    totalPoints: 12450,
    category: "Transport",
    isJoined: false,
  },
  {
    id: "2",
    name: "Energy Savers",
    description: "Reducing home energy consumption together",
    members: 67,
    avgReduction: 28,
    totalPoints: 18920,
    category: "Energy",
    isJoined: true,
  },
  {
    id: "3",
    name: "Plant Power",
    description: "Promoting plant-based lifestyle",
    members: 123,
    avgReduction: 41,
    totalPoints: 34560,
    category: "Food",
    isJoined: false,
  },
]

const mockLeaderboard: ChallengeParticipant[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "/placeholder.svg",
    progress: 95,
    rank: 1,
    points: 1250,
  },
  {
    id: "2",
    name: "Mike Johnson",
    avatar: "/placeholder.svg",
    progress: 87,
    rank: 2,
    points: 1180,
  },
  {
    id: "3",
    name: "Emma Davis",
    avatar: "/placeholder.svg",
    progress: 82,
    rank: 3,
    points: 1050,
  },
]
