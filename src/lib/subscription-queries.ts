import { supabase } from "./supabase"

export interface Subscription {
  id: string
  user_id: string
  tier: "free" | "live_monitoring"
  created_at: string
}

export async function fetchUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, tier, created_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export async function createFreeSubscription(
  userId: string
): Promise<Subscription | null> {
  // Check if subscription already exists
  const existing = await fetchUserSubscription(userId)
  if (existing) return existing

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ user_id: userId, tier: "free" })
    .select("id, user_id, tier, created_at")
    .single()

  if (error) {
    console.error("Error creating subscription:", error.message)
    return null
  }
  return data
}

export async function upgradeSubscription(
  userId: string,
  newTier: "live_monitoring"
): Promise<Subscription | null> {
  // Upsert: update if exists, create if not
  const existing = await fetchUserSubscription(userId)

  if (existing) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ tier: newTier })
      .eq("user_id", userId)
      .select("id, user_id, tier, created_at")
      .single()

    if (error) {
      console.error("Error upgrading subscription:", error.message)
      return null
    }
    return data
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ user_id: userId, tier: newTier })
    .select("id, user_id, tier, created_at")
    .single()

  if (error) {
    console.error("Error creating subscription:", error.message)
    return null
  }
  return data
}

export async function downgradeSubscription(
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ tier: "free" })
    .eq("user_id", userId)
    .select("id, user_id, tier, created_at")
    .single()

  if (error) {
    console.error("Error downgrading subscription:", error.message)
    return null
  }
  return data
}
