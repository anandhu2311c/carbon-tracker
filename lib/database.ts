import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getAllAchievements() {
  return await supabase.from("achievements").select("*").order("points_reward", { ascending: false })
}

export async function getUserAchievements(userId: string) {
  return await supabase
    .from("user_achievements")
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })
}

const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export const getActivitiesByDateRange = async (userId: string, startDate: string, endDate: string) => {
  if (!isSupabaseConfigured()) {
    // Return mock data for demo
    const mockActivities = [
      {
        id: "1",
        user_id: userId,
        type: "transport" as const,
        activity_name: "Car drive",
        amount: 15,
        unit: "km",
        emissions: 3.2,
        date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      },
    ]
    return { data: mockActivities, error: null }
  }

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
    return { data, error }
  } catch (err) {
    console.error("Error fetching activities by date range:", err)
    return { data: null, error: { message: "Failed to fetch activities" } }
  }
}

// Ensure all functions are exported
// import { supabase } from "./supabase"
// import type { Activity, Goal } from "./supabase"

// Check if Supabase is properly configured
const isSupabaseConfigured2 = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co"
  )
}

// Mock data for demo purposes when Supabase is not configured
const mockError = {
  message: "Supabase is not configured. Please add your Supabase credentials to use the database features.",
}

// Activity functions
export const createActivity = async (activity: Omit<any, "id" | "created_at">) => {
  if (!isSupabaseConfigured2()) {
    return { data: null, error: mockError }
  }

  try {
    const { data, error } = await supabase.from("activities").insert([activity]).select().single()

    if (error) {
      console.error("Error creating activity:", error)
      return { data: null, error }
    }

    // The trigger will automatically update user stats and check achievements
    console.log("Activity created successfully:", data)
    return { data, error: null }
  } catch (err) {
    console.error("Unexpected error creating activity:", err)
    return { data: null, error: { message: "Failed to create activity" } }
  }
}

export const getUserActivities = async (userId: string, limit?: number) => {
  if (!isSupabaseConfigured2()) {
    // Return mock data for demo
    const mockActivities = [
      {
        id: "1",
        user_id: userId,
        type: "transport" as const,
        activity_name: "Car drive to work",
        amount: 25,
        unit: "km",
        emissions: 5.2,
        date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        user_id: userId,
        type: "energy" as const,
        activity_name: "Home electricity usage",
        amount: 12,
        unit: "kWh",
        emissions: 3.6,
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
    return { data: mockActivities, error: null }
  }

  try {
    let query = supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    return { data, error }
  } catch (err) {
    console.error("Error fetching activities:", err)
    return { data: null, error: { message: "Failed to fetch activities" } }
  }
}

export const getActivitiesByDateRange2 = async (userId: string, startDate: string, endDate: string) => {
  if (!isSupabaseConfigured2()) {
    // Return mock data for demo
    const mockActivities = [
      {
        id: "1",
        user_id: userId,
        type: "transport" as const,
        activity_name: "Car drive",
        amount: 15,
        unit: "km",
        emissions: 3.2,
        date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      },
    ]
    return { data: mockActivities, error: null }
  }

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
    return { data, error }
  } catch (err) {
    console.error("Error fetching activities by date range:", err)
    return { data: null, error: { message: "Failed to fetch activities" } }
  }
}

// Goal functions
export const createGoal = async (goal: Omit<any, "id" | "created_at">) => {
  if (!isSupabaseConfigured2()) {
    return { data: null, error: mockError }
  }

  try {
    const { data, error } = await supabase.from("goals").insert([goal]).select().single()
    return { data, error }
  } catch (err) {
    console.error("Error creating goal:", err)
    return { data: null, error: { message: "Failed to create goal" } }
  }
}

export const getUserGoals = async (userId: string) => {
  if (!isSupabaseConfigured2()) {
    return { data: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    return { data, error }
  } catch (err) {
    console.error("Error fetching goals:", err)
    return { data: null, error: { message: "Failed to fetch goals" } }
  }
}

export const updateGoal = async (goalId: string, updates: Partial<any>) => {
  if (!isSupabaseConfigured2()) {
    return { data: null, error: mockError }
  }

  try {
    const { data, error } = await supabase.from("goals").update(updates).eq("id", goalId).select().single()
    return { data, error }
  } catch (err) {
    console.error("Error updating goal:", err)
    return { data: null, error: { message: "Failed to update goal" } }
  }
}

export const deleteGoal = async (goalId: string) => {
  if (!isSupabaseConfigured2()) {
    return { error: mockError }
  }

  try {
    const { error } = await supabase.from("goals").delete().eq("id", goalId)
    return { error }
  } catch (err) {
    console.error("Error deleting goal:", err)
    return { error: { message: "Failed to delete goal" } }
  }
}

// User stats functions
export const getUserStats = async (userId: string) => {
  if (!isSupabaseConfigured2()) {
    // Return mock stats for demo
    const mockStats = {
      user_id: userId,
      total_points: 1247,
      current_streak: 7,
      longest_streak: 15,
      total_emissions: 45.8,
      emissions_saved: 12.3,
      activities_logged: 23,
      rank_position: 5,
      last_activity_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    }
    return { data: mockStats, error: null }
  }

  try {
    // First ensure user stats record exists
    const { error: upsertError } = await supabase.from("user_stats").upsert(
      {
        user_id: userId,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_emissions: 0,
        emissions_saved: 0,
        activities_logged: 0,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    )

    if (upsertError) {
      console.error("Error ensuring user stats:", upsertError)
    }

    const { data, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching user stats:", error)
    }

    return { data, error }
  } catch (err) {
    console.error("Unexpected error fetching user stats:", err)
    return { data: null, error: { message: "Failed to fetch user stats" } }
  }
}

export const getLeaderboard = async (limit = 10) => {
  if (!isSupabaseConfigured2()) {
    // Return mock leaderboard for demo
    const mockLeaderboard = [
      {
        user_id: "user1",
        total_points: 2847,
        current_streak: 15,
        longest_streak: 20,
        total_emissions: 120.5,
        emissions_saved: 35.2,
        activities_logged: 89,
        profiles: { full_name: "Sarah Chen", avatar_url: null },
        updated_at: new Date().toISOString(),
      },
      {
        user_id: "user2",
        total_points: 2634,
        current_streak: 12,
        longest_streak: 18,
        total_emissions: 98.3,
        emissions_saved: 28.7,
        activities_logged: 76,
        profiles: { full_name: "Mike Johnson", avatar_url: null },
        updated_at: new Date().toISOString(),
      },
    ]
    return { data: mockLeaderboard, error: null }
  }

  try {
    // Use the custom function for better performance
    const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit })

    if (error) {
      console.error("Error fetching leaderboard with function, trying direct query:", error)

      // Fallback to direct query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("user_stats")
        .select(`
          *,
          profiles!inner(full_name, avatar_url)
        `)
        .order("total_points", { ascending: false })
        .order("current_streak", { ascending: false })
        .order("activities_logged", { ascending: false })
        .limit(limit)

      return { data: fallbackData, error: fallbackError }
    }

    // Transform the data to match expected format
    const transformedData = data?.map((row: any) => ({
      user_id: row.user_id,
      total_points: row.total_points,
      current_streak: row.current_streak,
      longest_streak: row.longest_streak,
      total_emissions: row.total_emissions,
      emissions_saved: row.emissions_saved,
      activities_logged: row.activities_logged,
      rank_position: row.rank_position,
      updated_at: row.updated_at,
      profiles: {
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      },
    }))

    return { data: transformedData, error: null }
  } catch (err) {
    console.error("Unexpected error fetching leaderboard:", err)
    return { data: null, error: { message: "Failed to fetch leaderboard" } }
  }
}

// Achievement functions
export const getUserAchievements2 = async (userId: string) => {
  if (!isSupabaseConfigured2()) {
    return { data: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })

    if (error) {
      console.error("Error fetching user achievements:", error)
    }

    return { data, error }
  } catch (err) {
    console.error("Unexpected error fetching user achievements:", err)
    return { data: null, error: { message: "Failed to fetch achievements" } }
  }
}

export const getAllAchievements2 = async () => {
  if (!isSupabaseConfigured2()) {
    // Return mock achievements for demo
    const mockAchievements = [
      {
        id: "1",
        name: "First Steps",
        description: "Logged your first activity",
        icon: "Leaf",
        color: "green",
        requirement_type: "activity_count",
        requirement_value: 1,
        points_reward: 50,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Week Warrior",
        description: "7-day logging streak",
        icon: "Star",
        color: "blue",
        requirement_type: "streak",
        requirement_value: 7,
        points_reward: 100,
        created_at: new Date().toISOString(),
      },
    ]
    return { data: mockAchievements, error: null }
  }

  try {
    const { data, error } = await supabase.from("achievements").select("*").order("points_reward", { ascending: true })

    if (error) {
      console.error("Error fetching achievements:", error)
    }

    return { data, error }
  } catch (err) {
    console.error("Unexpected error fetching achievements:", err)
    return { data: null, error: { message: "Failed to fetch achievements" } }
  }
}

export const awardAchievement = async (userId: string, achievementId: string) => {
  if (!isSupabaseConfigured2()) {
    return { data: null, error: mockError }
  }

  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .insert([{ user_id: userId, achievement_id: achievementId }])
      .select()
      .single()
    return { data, error }
  } catch (err) {
    console.error("Error awarding achievement:", err)
    return { data: null, error: { message: "Failed to award achievement" } }
  }
}

// Reward functions
export const getAllRewards = async () => {
  if (!isSupabaseConfigured2()) {
    // Return mock rewards for demo
    const mockRewards = [
      {
        id: "1",
        name: "Plant a Tree",
        description: "We'll plant a real tree in your name",
        cost: 1000,
        icon: "Leaf",
        color: "green",
        available: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Carbon Offset",
        description: "Offset 10kg of CO₂ emissions",
        cost: 500,
        icon: "Target",
        color: "blue",
        available: true,
        created_at: new Date().toISOString(),
      },
    ]
    return { data: mockRewards, error: null }
  }

  try {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("available", true)
      .order("cost", { ascending: true })

    if (error) {
      console.error("Error fetching rewards:", error)
    }

    return { data, error }
  } catch (err) {
    console.error("Unexpected error fetching rewards:", err)
    return { data: null, error: { message: "Failed to fetch rewards" } }
  }
}

export const redeemReward = async (userId: string, rewardId: string) => {
  if (!isSupabaseConfigured2()) {
    return { data: null, error: mockError }
  }

  try {
    const { data, error } = await supabase
      .from("user_rewards")
      .insert([{ user_id: userId, reward_id: rewardId }])
      .select()
      .single()
    return { data, error }
  } catch (err) {
    console.error("Error redeeming reward:", err)
    return { data: null, error: { message: "Failed to redeem reward" } }
  }
}

export const getUserRewards = async (userId: string) => {
  if (!isSupabaseConfigured2()) {
    return { data: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from("user_rewards")
      .select(`
        *,
        rewards(*)
      `)
      .eq("user_id", userId)
      .order("redeemed_at", { ascending: false })

    if (error) {
      console.error("Error fetching user rewards:", error)
    }

    return { data, error }
  } catch (err) {
    console.error("Unexpected error fetching user rewards:", err)
    return { data: null, error: { message: "Failed to fetch user rewards" } }
  }
}

// New function to refresh user data and check achievements
export const refreshUserData = async (userId: string) => {
  if (!isSupabaseConfigured2()) {
    return { data: null, error: mockError }
  }

  try {
    const { data, error } = await supabase.rpc("refresh_user_data", { p_user_id: userId })

    if (error) {
      console.error("Error refreshing user data:", error)
      return { data: null, error }
    }

    console.log("User data refreshed:", data)
    return { data, error: null }
  } catch (err) {
    console.error("Unexpected error refreshing user data:", err)
    return { data: null, error: { message: "Failed to refresh user data" } }
  }
}

// EPA-based Carbon Footprint Calculation System - IMPROVED
export const calculateEmissions = (type: string, amount: number, unit: string, activityName?: string): number => {
  // Convert result from pounds to kg (1 lb = 0.453592 kg)
  const lbsToKg = 0.453592

  switch (type) {
    case "transport":
      return calculateVehicleEmissions(amount, unit, activityName) * lbsToKg
    case "energy":
      return calculateEnergyEmissions(amount, unit, activityName) * lbsToKg
    case "home":
      return calculateHomeEmissions(amount, unit, activityName) * lbsToKg
    case "food":
      return calculateFoodEmissions(amount, unit, activityName) * lbsToKg
    default:
      return amount * 0.5 * lbsToKg // Fallback
  }
}

// Enhanced Vehicle Emissions Calculations
const calculateVehicleEmissions = (amount: number, unit: string, activityName?: string): number => {
  const CO2_PER_GALLON = 19.6 // lbs CO2 per gallon of gasoline
  const GREENHOUSE_GAS_MULTIPLIER = 1.01 // Accounts for non-CO2 greenhouse gases

  const activityLower = activityName?.toLowerCase() || ""

  // Determine transportation mode and emissions
  let emissionFactor = 0 // lbs CO2 per mile (default)
  let mpg = 24.8 // Default MPG for calculations

  // Zero or very low emission transportation
  if (activityLower.includes("walk") || activityLower.includes("walking")) {
    return 0 // Walking has zero direct emissions
  } else if (activityLower.includes("bike") || activityLower.includes("bicycle") || activityLower.includes("cycling")) {
    return 0 // Biking has zero direct emissions
  } else if (
    activityLower.includes("skateboard") ||
    (activityLower.includes("scooter") && !activityLower.includes("motor"))
  ) {
    return 0 // Non-motorized scooters have zero emissions
  } else if (activityLower.includes("electric bike") || activityLower.includes("e-bike")) {
    emissionFactor = 0.02 // Very low emissions from electricity
  }

  // Public Transportation (per passenger)
  else if (activityLower.includes("bus") || activityLower.includes("public transport")) {
    emissionFactor = 0.33 // lbs CO2 per passenger mile
  } else if (activityLower.includes("train") || activityLower.includes("subway") || activityLower.includes("metro")) {
    emissionFactor = 0.25 // lbs CO2 per passenger mile
  } else if (activityLower.includes("light rail") || activityLower.includes("tram")) {
    emissionFactor = 0.2 // lbs CO2 per passenger mile
  }

  // Aviation
  else if (activityLower.includes("flight") || activityLower.includes("airplane") || activityLower.includes("plane")) {
    if (activityLower.includes("domestic") || activityLower.includes("short")) {
      emissionFactor = 0.62 // lbs CO2 per passenger mile (domestic flights)
    } else {
      emissionFactor = 0.4 // lbs CO2 per passenger mile (international flights - more efficient)
    }
  }

  // Personal Vehicles
  else if (activityLower.includes("electric car") || activityLower.includes("ev") || activityLower.includes("tesla")) {
    emissionFactor = 0.2 // lbs CO2 per mile (accounting for electricity grid)
  } else if (activityLower.includes("hybrid")) {
    mpg = 45.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  } else if (activityLower.includes("motorcycle") || activityLower.includes("motorbike")) {
    mpg = 50.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  } else if (activityLower.includes("motor scooter") || activityLower.includes("moped")) {
    mpg = 80.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  }

  // Cars by size/type
  else if (activityLower.includes("suv") || activityLower.includes("truck") || activityLower.includes("pickup")) {
    mpg = 20.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  } else if (activityLower.includes("van") || activityLower.includes("minivan")) {
    mpg = 22.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  } else if (activityLower.includes("compact") || activityLower.includes("small car")) {
    mpg = 32.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  } else if (activityLower.includes("luxury") || activityLower.includes("sports car")) {
    mpg = 18.0
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  }

  // Ride sharing (accounting for empty miles)
  else if (activityLower.includes("uber") || activityLower.includes("lyft") || activityLower.includes("taxi")) {
    mpg = 24.8
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER * 1.4 // 40% more due to empty miles
  }

  // Default car
  else if (activityLower.includes("car") || activityLower.includes("drive") || activityLower.includes("driving")) {
    emissionFactor = (CO2_PER_GALLON / mpg) * GREENHOUSE_GAS_MULTIPLIER
  }

  // Freight and delivery
  else if (activityLower.includes("delivery") || activityLower.includes("freight")) {
    emissionFactor = 2.5 // Higher emissions for delivery vehicles
  }

  // Calculate based on unit
  switch (unit) {
    case "miles":
      return amount * emissionFactor
    case "km":
      const miles = amount * 0.621371 // Convert km to miles
      return miles * emissionFactor
    case "gallons":
      return amount * CO2_PER_GALLON * GREENHOUSE_GAS_MULTIPLIER
    case "liters":
      const gallons = amount * 0.264172 // Convert liters to gallons
      return gallons * CO2_PER_GALLON * GREENHOUSE_GAS_MULTIPLIER
    default:
      return amount * emissionFactor
  }
}

// Enhanced Energy Emissions Calculations
const calculateEnergyEmissions = (amount: number, unit: string, activityName?: string): number => {
  const ELECTRICITY_EMISSION_FACTOR = 0.92 // lbs CO2 per kWh (US average)
  const NATURAL_GAS_CO2_PER_1000_FT3 = 117 // lbs CO2 per 1000 ft³
  const NATURAL_GAS_CO2_PER_THERM = 11.7 // lbs CO2 per therm
  const FUEL_OIL_EMISSION_FACTOR = 22.4 // lbs CO2 per gallon
  const PROPANE_EMISSION_FACTOR = 12.7 // lbs CO2 per gallon
  const COAL_EMISSION_FACTOR = 2.07 // lbs CO2 per lb of coal
  const AVERAGE_KWH_PRICE = 0.1609 // $ per kWh
  const AVERAGE_GAS_PRICE = 15.23 // $ per 1000 ft³

  const activityLower = activityName?.toLowerCase() || ""

  // Renewable energy sources (very low emissions)
  if (activityLower.includes("solar") || activityLower.includes("wind") || activityLower.includes("hydro")) {
    return amount * 0.05 // Minimal emissions from manufacturing/maintenance
  } else if (activityLower.includes("geothermal")) {
    return amount * 0.1
  } else if (activityLower.includes("nuclear")) {
    return amount * 0.15
  }

  // Specific appliances and usage patterns
  if (activityLower.includes("air conditioning") || activityLower.includes("ac")) {
    switch (unit) {
      case "hours":
        return amount * 3.5 * ELECTRICITY_EMISSION_FACTOR // 3.5 kWh per hour average
      case "kWh":
        return amount * ELECTRICITY_EMISSION_FACTOR
      default:
        return amount * ELECTRICITY_EMISSION_FACTOR
    }
  } else if (activityLower.includes("heating") && !activityLower.includes("water")) {
    if (activityLower.includes("electric")) {
      return amount * 2.0 * ELECTRICITY_EMISSION_FACTOR // Electric heating
    } else {
      return amount * NATURAL_GAS_CO2_PER_THERM // Gas heating
    }
  } else if (activityLower.includes("water heater") || activityLower.includes("hot water")) {
    if (activityLower.includes("electric")) {
      return amount * 1.5 * ELECTRICITY_EMISSION_FACTOR
    } else {
      return amount * (NATURAL_GAS_CO2_PER_THERM * 0.8)
    }
  } else if (activityLower.includes("dryer") || activityLower.includes("clothes dryer")) {
    return amount * 2.5 * ELECTRICITY_EMISSION_FACTOR // 2.5 kWh per load
  } else if (activityLower.includes("dishwasher")) {
    return amount * 1.8 * ELECTRICITY_EMISSION_FACTOR // 1.8 kWh per load
  } else if (activityLower.includes("refrigerator") || activityLower.includes("fridge")) {
    return amount * 0.5 * ELECTRICITY_EMISSION_FACTOR // 0.5 kWh per day average
  } else if (activityLower.includes("tv") || activityLower.includes("television")) {
    return amount * 0.15 * ELECTRICITY_EMISSION_FACTOR // 0.15 kWh per hour
  } else if (activityLower.includes("computer") || activityLower.includes("laptop")) {
    return amount * 0.1 * ELECTRICITY_EMISSION_FACTOR // 0.1 kWh per hour
  }

  // Energy source specific calculations
  if (activityLower.includes("electricity") || activityLower.includes("electric") || unit === "kWh") {
    switch (unit) {
      case "kWh":
        return amount * ELECTRICITY_EMISSION_FACTOR
      case "dollars":
        const kWh = amount / AVERAGE_KWH_PRICE
        return kWh * ELECTRICITY_EMISSION_FACTOR
      case "hours":
        const estimatedKWh = amount * 1.5 // Average 1.5 kWh per hour of usage
        return estimatedKWh * ELECTRICITY_EMISSION_FACTOR
      default:
        return amount * ELECTRICITY_EMISSION_FACTOR
    }
  } else if (activityLower.includes("gas") || activityLower.includes("natural gas")) {
    switch (unit) {
      case "therms":
        return amount * NATURAL_GAS_CO2_PER_THERM
      case "1000ft3":
        return amount * NATURAL_GAS_CO2_PER_1000_FT3
      case "dollars":
        const ft3 = amount / AVERAGE_GAS_PRICE
        return ft3 * NATURAL_GAS_CO2_PER_1000_FT3
      default:
        return amount * NATURAL_GAS_CO2_PER_THERM
    }
  } else if (activityLower.includes("oil") || activityLower.includes("fuel oil")) {
    switch (unit) {
      case "gallons":
        return amount * FUEL_OIL_EMISSION_FACTOR
      case "dollars":
        const gallons = amount / 4.27 // Average price per gallon
        return gallons * FUEL_OIL_EMISSION_FACTOR
      default:
        return amount * FUEL_OIL_EMISSION_FACTOR
    }
  } else if (activityLower.includes("propane")) {
    switch (unit) {
      case "gallons":
        return amount * PROPANE_EMISSION_FACTOR
      case "dollars":
        const gallons = amount / 2.56 // Average price per gallon
        return gallons * PROPANE_EMISSION_FACTOR
      default:
        return amount * PROPANE_EMISSION_FACTOR
    }
  } else if (activityLower.includes("coal")) {
    return amount * COAL_EMISSION_FACTOR
  }

  // Default electricity calculation
  return amount * ELECTRICITY_EMISSION_FACTOR
}

// Enhanced Food Emissions Calculations
const calculateFoodEmissions = (amount: number, unit: string, activityName?: string): number => {
  const activityLower = activityName?.toLowerCase() || ""

  // Detailed food emission factors (lbs CO2 per kg)
  const foodEmissions = {
    // Meat (highest emissions)
    beef: 60.0,
    lamb: 39.2,
    pork: 12.1,
    chicken: 6.9,
    turkey: 10.9,
    fish_farmed: 13.6,
    fish_wild: 5.4,

    // Dairy
    cheese: 21.2,
    milk: 3.2,
    yogurt: 2.2,
    butter: 23.8,

    // Plant-based proteins (much lower)
    tofu: 3.0,
    beans: 2.0,
    lentils: 1.8,
    nuts: 2.3,

    // Grains and starches
    rice: 4.0,
    wheat: 1.4,
    pasta: 1.1,
    bread: 1.3,
    potatoes: 0.5,

    // Vegetables (lowest emissions)
    leafy_greens: 0.4,
    root_vegetables: 0.4,
    tomatoes: 2.1,
    onions: 0.5,
    peppers: 0.7,

    // Fruits
    apples: 0.6,
    bananas: 0.9,
    citrus: 0.4,
    berries: 1.5,

    // Processed foods
    processed_meat: 25.0,
    fast_food: 15.0,
    packaged_snacks: 8.0,
    soft_drinks: 0.7,

    // Organic vs conventional
    organic_vegetables: 0.3, // Slightly lower due to no synthetic fertilizers
    conventional_vegetables: 0.5,
  }

  let emissionFactor = 3.0 // Default food emission factor

  // Meat products
  if (activityLower.includes("beef") || activityLower.includes("steak") || activityLower.includes("hamburger")) {
    emissionFactor = foodEmissions.beef
  } else if (activityLower.includes("lamb")) {
    emissionFactor = foodEmissions.lamb
  } else if (activityLower.includes("pork") || activityLower.includes("bacon") || activityLower.includes("ham")) {
    emissionFactor = foodEmissions.pork
  } else if (activityLower.includes("chicken") || activityLower.includes("poultry")) {
    emissionFactor = foodEmissions.chicken
  } else if (activityLower.includes("turkey")) {
    emissionFactor = foodEmissions.turkey
  } else if (activityLower.includes("fish") || activityLower.includes("salmon") || activityLower.includes("tuna")) {
    if (activityLower.includes("farmed")) {
      emissionFactor = foodEmissions.fish_farmed
    } else {
      emissionFactor = foodEmissions.fish_wild
    }
  }

  // Dairy products
  else if (activityLower.includes("cheese")) {
    emissionFactor = foodEmissions.cheese
  } else if (activityLower.includes("milk")) {
    emissionFactor = foodEmissions.milk
  } else if (activityLower.includes("yogurt")) {
    emissionFactor = foodEmissions.yogurt
  } else if (activityLower.includes("butter")) {
    emissionFactor = foodEmissions.butter
  }

  // Plant-based proteins
  else if (activityLower.includes("tofu") || activityLower.includes("soy")) {
    emissionFactor = foodEmissions.tofu
  } else if (activityLower.includes("beans") || activityLower.includes("legumes")) {
    emissionFactor = foodEmissions.beans
  } else if (activityLower.includes("lentils")) {
    emissionFactor = foodEmissions.lentils
  } else if (activityLower.includes("nuts") || activityLower.includes("almonds")) {
    emissionFactor = foodEmissions.nuts
  }

  // Grains and starches
  else if (activityLower.includes("rice")) {
    emissionFactor = foodEmissions.rice
  } else if (activityLower.includes("wheat") || activityLower.includes("bread")) {
    emissionFactor = foodEmissions.bread
  } else if (activityLower.includes("pasta")) {
    emissionFactor = foodEmissions.pasta
  } else if (activityLower.includes("potato")) {
    emissionFactor = foodEmissions.potatoes
  }

  // Vegetables
  else if (activityLower.includes("lettuce") || activityLower.includes("spinach") || activityLower.includes("kale")) {
    emissionFactor = foodEmissions.leafy_greens
  } else if (activityLower.includes("carrot") || activityLower.includes("beet")) {
    emissionFactor = foodEmissions.root_vegetables
  } else if (activityLower.includes("tomato")) {
    emissionFactor = foodEmissions.tomatoes
  } else if (activityLower.includes("onion")) {
    emissionFactor = foodEmissions.onions
  } else if (activityLower.includes("pepper")) {
    emissionFactor = foodEmissions.peppers
  } else if (activityLower.includes("vegetable")) {
    if (activityLower.includes("organic")) {
      emissionFactor = foodEmissions.organic_vegetables
    } else {
      emissionFactor = foodEmissions.conventional_vegetables
    }
  }

  // Fruits
  else if (activityLower.includes("apple")) {
    emissionFactor = foodEmissions.apples
  } else if (activityLower.includes("banana")) {
    emissionFactor = foodEmissions.bananas
  } else if (activityLower.includes("orange") || activityLower.includes("lemon") || activityLower.includes("citrus")) {
    emissionFactor = foodEmissions.citrus
  } else if (activityLower.includes("berry") || activityLower.includes("strawberry")) {
    emissionFactor = foodEmissions.berries
  } else if (activityLower.includes("fruit")) {
    emissionFactor = (foodEmissions.apples + foodEmissions.bananas) / 2 // Average fruit
  }

  // Processed foods
  else if (
    activityLower.includes("fast food") ||
    activityLower.includes("mcdonalds") ||
    activityLower.includes("burger king")
  ) {
    emissionFactor = foodEmissions.fast_food
  } else if (activityLower.includes("processed") || activityLower.includes("packaged")) {
    emissionFactor = foodEmissions.packaged_snacks
  } else if (activityLower.includes("soda") || activityLower.includes("soft drink")) {
    emissionFactor = foodEmissions.soft_drinks
  }

  switch (unit) {
    case "kg":
      return amount * emissionFactor * 2.20462 // Convert to lbs
    case "g":
      return (amount / 1000) * emissionFactor * 2.20462
    case "lbs":
      return amount * emissionFactor
    case "servings":
      return amount * (emissionFactor * 0.25) // Assume 0.25 lbs per serving
    case "meals":
      return amount * (emissionFactor * 1.0) // Assume 1 lb per meal
    default:
      return amount * emissionFactor
  }
}

// Enhanced Home Emissions Calculations
const calculateHomeEmissions = (amount: number, unit: string, activityName?: string): number => {
  const WASTE_CO2_PER_PERSON_YEAR = 822 // lbs CO2 per person per year
  const activityLower = activityName?.toLowerCase() || ""

  if (activityLower.includes("waste") || activityLower.includes("trash") || activityLower.includes("garbage")) {
    switch (unit) {
      case "people":
        return amount * WASTE_CO2_PER_PERSON_YEAR
      case "bags":
        return amount * 15 // Estimate 15 lbs CO2 per bag of waste
      case "pounds":
        return amount * 0.5 // Estimate 0.5 lbs CO2 per pound of waste
      default:
        return amount * 10 // General waste estimate
    }
  } else if (activityLower.includes("recycle") || activityLower.includes("recycling")) {
    // Recycling reduces emissions (negative values)
    const recyclingBenefits = {
      aluminum: -89.38, // lbs CO2 saved per person per year
      plastic: -35.56,
      glass: -25.39,
      newspaper: -113.14,
      magazines: -27.46,
      cardboard: -50.0,
      electronics: -100.0,
    }

    if (activityLower.includes("aluminum") || activityLower.includes("can")) return amount * recyclingBenefits.aluminum
    if (activityLower.includes("plastic")) return amount * recyclingBenefits.plastic
    if (activityLower.includes("glass")) return amount * recyclingBenefits.glass
    if (activityLower.includes("newspaper")) return amount * recyclingBenefits.newspaper
    if (activityLower.includes("magazine")) return amount * recyclingBenefits.magazines
    if (activityLower.includes("cardboard")) return amount * recyclingBenefits.cardboard
    if (activityLower.includes("electronics")) return amount * recyclingBenefits.electronics

    return amount * -30 // General recycling benefit
  } else if (activityLower.includes("compost")) {
    return amount * -20 // Composting reduces methane emissions from landfills
  } else if (activityLower.includes("water")) {
    switch (unit) {
      case "gallons":
        return amount * 0.002 // Water treatment and heating
      case "minutes":
        if (activityLower.includes("shower")) {
          const gallons = amount * 2.5 // Average shower flow rate
          return gallons * 0.002
        } else {
          const gallons = amount * 1.0 // General water use
          return gallons * 0.002
        }
      default:
        return amount * 0.5
    }
  } else if (activityLower.includes("lawn") || activityLower.includes("garden")) {
    if (activityLower.includes("mower") || activityLower.includes("mowing")) {
      return amount * 2.5 // Gas lawn mower emissions per hour
    } else if (activityLower.includes("fertilizer")) {
      return amount * 5.0 // Fertilizer production and N2O emissions
    } else {
      return amount * 0.1 // General gardening
    }
  }

  // Default home activity calculation
  return amount * 2.0
}
