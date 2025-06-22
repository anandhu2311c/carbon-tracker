import { supabase } from "./supabase"

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co"
  )
}

export const signUp = async (email: string, password: string, fullName: string) => {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: { message: "Supabase is not configured. Please add your Supabase credentials." },
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: { message: "Supabase is not configured. Please add your Supabase credentials." },
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return { user: null, error: null }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

export const getProfile = async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: "Supabase is not configured" } }
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
  return { data, error }
}

export const updateProfile = async (userId: string, updates: any) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: "Supabase is not configured" } }
  }

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()
  return { data, error }
}
