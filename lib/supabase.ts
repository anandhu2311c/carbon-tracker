import { createClient } from "@supabase/supabase-js"

// Use placeholder values for development if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
})()

// Types for our database tables
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  type: "transport" | "energy" | "food" | "home"
  activity_name: string
  amount: number
  unit: string
  emissions: number
  date: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  target_value: number
  current_value: number
  category: string
  deadline?: string
  status: "active" | "completed" | "paused"
  created_at: string
  completed_at?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirement_type: string
  requirement_value: number
  points_reward: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement: Achievement
}

export interface UserStats {
  user_id: string
  total_points: number
  current_streak: number
  longest_streak: number
  total_emissions: number
  emissions_saved: number
  activities_logged: number
  rank_position?: number
  last_activity_date?: string
  updated_at: string
}

export interface Reward {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  color: string
  available: boolean
  created_at: string
}

export interface UserReward {
  id: string
  user_id: string
  reward_id: string
  redeemed_at: string
  status: "pending" | "fulfilled" | "cancelled"
  reward: Reward
}
