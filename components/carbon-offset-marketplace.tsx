"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Leaf,
  TreePine,
  Zap,
  Factory,
  Globe,
  ShoppingCart,
  CheckCircle,
  Star,
  MapPin,
  TrendingUp,
  Award,
  Heart,
} from "lucide-react"
import { getUserStats } from "@/lib/database"
import type { UserStats } from "@/lib/supabase"

interface CarbonOffsetMarketplaceProps {
  userId: string
}

interface OffsetProject {
  id: string
  title: string
  description: string
  type: "forestry" | "renewable" | "technology" | "community"
  location: string
  pricePerTon: number
  totalCapacity: number
  sold: number
  rating: number
  reviews: number
  certifications: string[]
  impact: {
    co2Reduced: number
    treesPlanted?: number
    peopleHelped?: number
    energyGenerated?: number
  }
  images: string[]
  timeline: string
  verified: boolean
}

interface Purchase {
  id: string
  projectId: string
  amount: number // tons of CO2
  cost: number
  date: string
  certificate?: string
}

export function CarbonOffsetMarketplace({ userId }: CarbonOffsetMarketplaceProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [projects, setProjects] = useState<OffsetProject[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedProject, setSelectedProject] = useState<OffsetProject | null>(null)
  const [offsetAmount, setOffsetAmount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "forestry" | "renewable" | "technology" | "community">("all")

  useEffect(() => {
    fetchMarketplaceData()
  }, [userId])

  const fetchMarketplaceData = async () => {
    try {
      const { data: stats } = await getUserStats(userId)
      if (stats) setUserStats(stats)

      // Mock data - in real app, this would come from your backend
      setProjects(mockProjects)
      setPurchases(mockPurchases)
    } catch (error) {
      console.error("Error fetching marketplace data:", error)
    } finally {
      setLoading(false)
    }
  }

  const purchaseOffset = (project: OffsetProject, tons: number) => {
    const cost = tons * project.pricePerTon
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      projectId: project.id,
      amount: tons,
      cost,
      date: new Date().toISOString(),
      certificate: `CERT-${Date.now()}`,
    }

    setPurchases((prev) => [newPurchase, ...prev])
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, sold: p.sold + tons } : p)))
    setSelectedProject(null)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "forestry":
        return TreePine
      case "renewable":
        return Zap
      case "technology":
        return Factory
      case "community":
        return Globe
      default:
        return Leaf
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "forestry":
        return "green"
      case "renewable":
        return "blue"
      case "technology":
        return "purple"
      case "community":
        return "orange"
      default:
        return "gray"
    }
  }

  const filteredProjects = filter === "all" ? projects : projects.filter((p) => p.type === filter)

  const totalOffset = purchases.reduce((sum, p) => sum + p.amount, 0)
  const totalSpent = purchases.reduce((sum, p) => sum + p.cost, 0)

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
          <Leaf className="h-8 w-8" />
          Carbon Offset Marketplace
        </h1>
        <p className="text-green-600 dark:text-green-400 mt-1">
          Offset your carbon footprint by supporting verified environmental projects
        </p>
      </div>

      {/* Your Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4 text-center">
            <Leaf className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{totalOffset.toFixed(1)}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Tons CO₂ Offset</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">${totalSpent}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Total Invested</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{purchases.length}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Projects Supported</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {userStats ? Math.round((totalOffset / Math.max(userStats.total_emissions, 1)) * 100) : 0}%
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">Footprint Offset</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all", label: "All Projects", icon: Globe },
          { id: "forestry", label: "Forestry", icon: TreePine },
          { id: "renewable", label: "Renewable Energy", icon: Zap },
          { id: "technology", label: "Technology", icon: Factory },
          { id: "community", label: "Community", icon: Heart },
        ].map((tab) => {
          const IconComponent = tab.icon
          return (
            <Button
              key={tab.id}
              variant={filter === tab.id ? "default" : "outline"}
              onClick={() => setFilter(tab.id as any)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const TypeIcon = getTypeIcon(project.type)
          const typeColor = getTypeColor(project.type)
          const progress = (project.sold / project.totalCapacity) * 100

          return (
            <Card
              key={project.id}
              className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-t-lg flex items-center justify-center">
                  <TypeIcon className={`h-16 w-16 text-${typeColor}-600 dark:text-${typeColor}-400`} />
                </div>
                {project.verified && (
                  <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{project.location}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`bg-${typeColor}-100 text-${typeColor}-800 border-${typeColor}-300 dark:bg-${typeColor}-900/30 dark:text-${typeColor}-200 dark:border-${typeColor}-700`}
                  >
                    {project.type}
                  </Badge>
                </div>
                <CardDescription className="dark:text-gray-400">{project.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{project.rating}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">({project.reviews} reviews)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium">{progress.toFixed(0)}% funded</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{project.sold} tons sold</span>
                    <span>{project.totalCapacity} tons total</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">${project.pricePerTon}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">per ton CO₂</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {project.impact.co2Reduced.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">tons CO₂ impact</p>
                  </div>
                </div>

                <Button onClick={() => setSelectedProject(project)} className="w-full bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Offset
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Purchase Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200">Purchase Carbon Offset</CardTitle>
              <CardDescription className="dark:text-gray-400">{selectedProject.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (tons of CO₂)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={offsetAmount}
                  onChange={(e) => setOffsetAmount(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Price per ton:</span>
                  <span className="font-medium">${selectedProject.pricePerTon}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium">{offsetAmount} tons</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600 dark:text-green-400">
                    ${(offsetAmount * selectedProject.pricePerTon).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => purchaseOffset(selectedProject, offsetAmount)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Purchase
                </Button>
                <Button onClick={() => setSelectedProject(null)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Purchases */}
      {purchases.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Your Recent Purchases</CardTitle>
            <CardDescription className="dark:text-gray-400">Carbon offsets you've purchased</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchases.slice(0, 5).map((purchase) => {
                const project = projects.find((p) => p.id === purchase.projectId)
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{project?.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {purchase.amount} tons CO₂ • {new Date(purchase.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">${purchase.cost}</p>
                      {purchase.certificate && (
                        <Badge variant="outline" className="text-xs">
                          Certificate: {purchase.certificate}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Mock data
const mockProjects: OffsetProject[] = [
  {
    id: "1",
    title: "Amazon Rainforest Conservation",
    description: "Protecting 10,000 hectares of pristine rainforest in Brazil",
    type: "forestry",
    location: "Brazil",
    pricePerTon: 25,
    totalCapacity: 50000,
    sold: 32000,
    rating: 4.8,
    reviews: 234,
    certifications: ["VCS", "Gold Standard"],
    impact: {
      co2Reduced: 50000,
      treesPlanted: 125000,
      peopleHelped: 450,
    },
    images: ["/placeholder.svg"],
    timeline: "2024-2034",
    verified: true,
  },
  {
    id: "2",
    title: "Solar Farm Development",
    description: "Building renewable energy infrastructure in rural communities",
    type: "renewable",
    location: "India",
    pricePerTon: 18,
    totalCapacity: 75000,
    sold: 45000,
    rating: 4.6,
    reviews: 189,
    certifications: ["CDM", "VCS"],
    impact: {
      co2Reduced: 75000,
      energyGenerated: 150000,
      peopleHelped: 2500,
    },
    images: ["/placeholder.svg"],
    timeline: "2024-2029",
    verified: true,
  },
  {
    id: "3",
    title: "Direct Air Capture Technology",
    description: "Advanced technology to remove CO₂ directly from the atmosphere",
    type: "technology",
    location: "Iceland",
    pricePerTon: 120,
    totalCapacity: 10000,
    sold: 3500,
    rating: 4.9,
    reviews: 67,
    certifications: ["ISO 14064", "VCS"],
    impact: {
      co2Reduced: 10000,
    },
    images: ["/placeholder.svg"],
    timeline: "2024-2026",
    verified: true,
  },
]

const mockPurchases: Purchase[] = [
  {
    id: "1",
    projectId: "1",
    amount: 2.5,
    cost: 62.5,
    date: "2024-01-15T10:30:00Z",
    certificate: "CERT-1705312200",
  },
  {
    id: "2",
    projectId: "2",
    amount: 1.0,
    cost: 18.0,
    date: "2024-01-10T14:20:00Z",
    certificate: "CERT-1704879600",
  },
]
