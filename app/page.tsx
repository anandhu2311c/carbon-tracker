"use client"

import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dashboard } from "@/components/dashboard"
import { ActivityTracker } from "@/components/activity-tracker"
import { Leaderboard } from "@/components/leaderboard"
import { Rewards } from "@/components/rewards"
import { Goals } from "@/components/goals"
import { AuthForm } from "@/components/auth/auth-form"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { GreenScanner } from "@/components/green-scanner"
import { AICoach } from "@/components/ai-coach"
import { SocialChallenges } from "@/components/social-challenges"
import { CarbonOffsetMarketplace } from "@/components/carbon-offset-marketplace"

export default function CarbonTrackerApp() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === "https://your-project.supabase.co") {
      setLoading(false)
      return
    }

    // Check current user
    getCurrentUser().then(({ user }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSuccess = () => {
    // Check if this is demo mode
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === "https://your-project.supabase.co") {
      // Demo mode - create a mock user
      setDemoMode(true)
      setUser({
        id: "demo-user-123",
        email: "demo@example.com",
        user_metadata: {
          full_name: "Demo User",
        },
      } as User)
    }
  }

  const renderActiveSection = () => {
    const userId = user?.id || "demo-user-123"

    switch (activeSection) {
      case "dashboard":
        return <Dashboard userId={userId} />
      case "activities":
        return <ActivityTracker userId={userId} />
      case "scanner":
        return <GreenScanner userId={userId} onActivityLogged={() => {}} />
      case "ai-coach":
        return <AICoach userId={userId} />
      case "challenges":
        return <SocialChallenges userId={userId} />
      case "marketplace":
        return <CarbonOffsetMarketplace userId={userId} />
      case "leaderboard":
        return <Leaderboard userId={userId} />
      case "rewards":
        return <Rewards userId={userId} />
      case "goals":
        return <Goals userId={userId} />
      default:
        return <Dashboard userId={userId} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && !demoMode) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={
            user ||
            ({ id: "demo-user-123", email: "demo@example.com", user_metadata: { full_name: "Demo User" } } as User)
          }
          demoMode={demoMode}
        />
        <main className="flex-1 p-6 bg-background">{renderActiveSection()}</main>
      </div>
    </SidebarProvider>
  )
}
