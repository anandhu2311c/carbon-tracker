import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
})

// Model selection based on task complexity
const MODELS = {
  COMPLEX_ANALYSIS: "llama-3.3-70b-versatile", // For detailed carbon analysis
  FAST_INSIGHTS: "llama-3.1-8b-instant", // For quick insights and simple tasks
  GENERAL: "gemma2-9b-it", // For general purpose tasks
} as const

export interface ScanResult {
  category: "transport" | "energy" | "food" | "home"
  item: string
  confidence: number
  emissions: number
  amount: number
  unit: string
  suggestions: string[]
  ecoScore: number
}

export interface AIInsight {
  id: string
  type: "tip" | "warning" | "achievement" | "goal"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  category: "transport" | "energy" | "food" | "home" | "general"
  actionable: boolean
  potentialSaving: number
}

// Analyze image for carbon footprint using the most powerful model
export async function analyzeImageForCarbon(imageDescription: string): Promise<ScanResult> {
  try {
    const prompt = `
    You are an expert environmental analyst with deep knowledge of carbon footprints, lifecycle assessments, and sustainability. 

    Based on this item description: "${imageDescription}", provide a comprehensive carbon footprint analysis.

    Consider these factors:
    - Manufacturing emissions
    - Transportation impact
    - Usage phase emissions
    - End-of-life disposal
    - Regional variations in carbon intensity

    Respond with ONLY a valid JSON object in this exact format:
    {
      "category": "transport|energy|food|home",
      "item": "specific item name",
      "confidence": 0.0-1.0,
      "emissions": number (kg CO2 equivalent),
      "amount": number,
      "unit": "appropriate unit (km, kWh, serving, etc.)",
      "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
      "ecoScore": 1-10 (10 being most eco-friendly)
    }

    Use realistic emission factors:
    - Gasoline car: ~0.2 kg CO2/km
    - Electric car: ~0.05-0.1 kg CO2/km
    - Beef: ~27 kg CO2/kg
    - Chicken: ~6 kg CO2/kg
    - LED bulb: ~0.01 kg CO2/hour
    - Plastic bottle: ~0.5 kg CO2/bottle

    Provide specific, actionable suggestions for reducing environmental impact.
    `

    const { text } = await generateText({
      model: groq(MODELS.COMPLEX_ANALYSIS),
      prompt,
      temperature: 0.2, // Lower temperature for more consistent results
      maxTokens: 1000,
    })

    // Clean and parse the response
    const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
    const result = JSON.parse(cleanedText)

    // Validate and ensure proper structure
    return {
      category: result.category || "home",
      item: result.item || "Unknown Item",
      confidence: Math.min(Math.max(result.confidence || 0.7, 0), 1),
      emissions: Math.max(result.emissions || 1, 0),
      amount: Math.max(result.amount || 1, 0),
      unit: result.unit || "unit",
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions.slice(0, 3)
        : ["Consider eco-friendly alternatives", "Look for sustainable options", "Reduce usage when possible"],
      ecoScore: Math.min(Math.max(result.ecoScore || 5, 1), 10),
    }
  } catch (error) {
    console.error("Error analyzing image with AI:", error)

    // Fallback result if AI fails
    return {
      category: "home",
      item: "Unidentified Item",
      confidence: 0.5,
      emissions: 1.0,
      amount: 1,
      unit: "unit",
      suggestions: [
        "Consider the environmental impact of this item",
        "Look for sustainable alternatives",
        "Reduce consumption when possible",
      ],
      ecoScore: 5,
    }
  }
}

// Generate personalized insights using the versatile model
export async function generatePersonalizedInsights(
  userStats: any,
  activities: any[],
  weekActivities: any[],
): Promise<AIInsight[]> {
  try {
    // Calculate key metrics for better AI analysis
    const totalEmissions = activities.reduce((sum, a) => sum + a.emissions, 0)
    const avgDailyEmissions = totalEmissions / Math.max(activities.length, 1)
    const categoryBreakdown = {
      transport: activities.filter((a) => a.type === "transport").reduce((sum, a) => sum + a.emissions, 0),
      energy: activities.filter((a) => a.type === "energy").reduce((sum, a) => sum + a.emissions, 0),
      food: activities.filter((a) => a.type === "food").reduce((sum, a) => sum + a.emissions, 0),
      home: activities.filter((a) => a.type === "home").reduce((sum, a) => sum + a.emissions, 0),
    }

    const prompt = `
    You are an expert environmental coach analyzing user behavior patterns to provide personalized sustainability insights.

    User Profile:
    - Total activities logged: ${userStats?.activities_logged || 0}
    - Current streak: ${userStats?.current_streak || 0} days
    - Total emissions tracked: ${totalEmissions.toFixed(1)} kg CO2
    - Average daily emissions: ${avgDailyEmissions.toFixed(1)} kg CO2

    Category Breakdown:
    - Transport: ${categoryBreakdown.transport.toFixed(1)} kg CO2
    - Energy: ${categoryBreakdown.energy.toFixed(1)} kg CO2  
    - Food: ${categoryBreakdown.food.toFixed(1)} kg CO2
    - Home: ${categoryBreakdown.home.toFixed(1)} kg CO2

    Recent Activities Sample: ${JSON.stringify(activities.slice(0, 5))}

    Generate 3-5 personalized insights as a JSON array. Focus on:
    1. Specific patterns in their data
    2. Actionable recommendations with realistic CO2 savings
    3. Positive reinforcement for good habits
    4. Areas with highest improvement potential

    Respond with ONLY a valid JSON array:
    [
      {
        "id": "unique_id",
        "type": "tip|warning|achievement|goal",
        "title": "specific, engaging title",
        "description": "detailed, personalized description with specific numbers",
        "impact": "high|medium|low",
        "category": "transport|energy|food|home|general",
        "actionable": true|false,
        "potentialSaving": number (realistic kg CO2 savings per week/month)
      }
    ]
    `

    const { text } = await generateText({
      model: groq(MODELS.COMPLEX_ANALYSIS),
      prompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
    const insights = JSON.parse(cleanedText)

    // Validate and ensure proper structure
    return Array.isArray(insights)
      ? insights.map((insight, index) => ({
          id: insight.id || `insight_${Date.now()}_${index}`,
          type: insight.type || "tip",
          title: insight.title || "Environmental Tip",
          description: insight.description || "Consider your environmental impact",
          impact: insight.impact || "medium",
          category: insight.category || "general",
          actionable: insight.actionable !== false,
          potentialSaving: Math.max(insight.potentialSaving || 0, 0),
        }))
      : []
  } catch (error) {
    console.error("Error generating insights with AI:", error)
    return []
  }
}

// Generate weekly report using fast model for quick summaries
export async function generateWeeklyReport(weekActivities: any[]): Promise<{
  summary: string
  recommendations: string[]
  insights: string[]
}> {
  try {
    const totalEmissions = weekActivities.reduce((sum, a) => sum + a.emissions, 0)
    const activityCount = weekActivities.length
    const categories = [...new Set(weekActivities.map((a) => a.type))]

    const prompt = `
    Analyze this week's environmental activities and create a concise report.

    Week Summary:
    - Total activities: ${activityCount}
    - Total emissions: ${totalEmissions.toFixed(1)} kg CO2
    - Categories tracked: ${categories.join(", ")}
    - Activities: ${JSON.stringify(weekActivities.slice(0, 10))}

    Generate a weekly report as JSON:
    {
      "summary": "2-3 sentence summary of the week's environmental impact and trends",
      "recommendations": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
      "insights": ["key insight 1", "key insight 2", "key insight 3"]
    }

    Focus on:
    - Specific numbers and trends
    - Actionable next steps
    - Positive reinforcement
    - Realistic goals

    Respond with ONLY valid JSON.
    `

    const { text } = await generateText({
      model: groq(MODELS.FAST_INSIGHTS),
      prompt,
      temperature: 0.2,
      maxTokens: 800,
    })

    const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
    const report = JSON.parse(cleanedText)

    return {
      summary: report.summary || "Keep tracking your environmental impact for better insights!",
      recommendations: Array.isArray(report.recommendations)
        ? report.recommendations
        : [
            "Continue logging your activities consistently",
            "Focus on your highest-emission category",
            "Set a weekly reduction goal",
            "Try one new sustainable habit",
          ],
      insights: Array.isArray(report.insights)
        ? report.insights
        : [
            "Consistency in tracking leads to better results",
            "Small changes can make a big difference",
            "Your efforts contribute to global sustainability",
          ],
    }
  } catch (error) {
    console.error("Error generating weekly report:", error)
    return {
      summary: "Keep up the great work tracking your environmental impact!",
      recommendations: [
        "Continue logging your daily activities",
        "Look for eco-friendly alternatives",
        "Set achievable reduction goals",
        "Engage with the community challenges",
      ],
      insights: [
        "Regular tracking helps identify patterns",
        "Small consistent changes create big impact",
        "Community engagement boosts motivation",
      ],
    }
  }
}

// Quick analysis for simple text inputs using fast model
export async function analyzeItemFromText(itemDescription: string): Promise<ScanResult> {
  try {
    const prompt = `
    Quickly analyze the carbon footprint of: "${itemDescription}"

    Provide realistic emissions data based on standard lifecycle assessments.

    Respond with ONLY valid JSON:
    {
      "category": "transport|energy|food|home",
      "item": "specific item name",
      "confidence": 0.0-1.0,
      "emissions": number (kg CO2),
      "amount": number,
      "unit": "appropriate unit",
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "ecoScore": 1-10
    }

    Use realistic emission factors and provide specific, actionable suggestions.
    `

    const { text } = await generateText({
      model: groq(MODELS.FAST_INSIGHTS),
      prompt,
      temperature: 0.1,
      maxTokens: 600,
    })

    const cleanedText = text.trim().replace(/```json\n?|\n?```/g, "")
    const result = JSON.parse(cleanedText)

    return {
      category: result.category || "home",
      item: result.item || itemDescription,
      confidence: Math.min(Math.max(result.confidence || 0.8, 0), 1),
      emissions: Math.max(result.emissions || 1, 0),
      amount: Math.max(result.amount || 1, 0),
      unit: result.unit || "unit",
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions
        : ["Consider sustainable alternatives", "Reduce usage frequency", "Look for eco-certified options"],
      ecoScore: Math.min(Math.max(result.ecoScore || 5, 1), 10),
    }
  } catch (error) {
    console.error("Error analyzing item text:", error)

    return {
      category: "home",
      item: itemDescription,
      confidence: 0.6,
      emissions: 1.0,
      amount: 1,
      unit: "unit",
      suggestions: [
        "Research the environmental impact",
        "Look for sustainable alternatives",
        "Consider reducing usage",
      ],
      ecoScore: 5,
    }
  }
}

// Generate eco-tips using the general model
export async function generateEcoTip(category?: string): Promise<string> {
  try {
    const prompt = `
    Generate a practical, actionable eco-tip${category ? ` for the ${category} category` : ""}.
    
    Make it:
    - Specific and actionable
    - Include approximate CO2 savings when possible
    - Easy to implement
    - Motivating and positive
    
    Respond with just the tip text, no extra formatting.
    `

    const { text } = await generateText({
      model: groq(MODELS.GENERAL),
      prompt,
      temperature: 0.4,
      maxTokens: 200,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating eco tip:", error)
    return "Every small action counts towards a more sustainable future!"
  }
}
