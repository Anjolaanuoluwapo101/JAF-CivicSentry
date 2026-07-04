import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, tier } = body

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (action === "upgrade") {
      const { data, error } = await supabase
        .from("subscriptions")
        .upsert(
          { user_id: user.id, tier: tier || "live_monitoring" },
          { onConflict: "user_id" }
        )
        .select("id, user_id, tier, created_at")
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    }

    if (action === "downgrade") {
      const { data, error } = await supabase
        .from("subscriptions")
        .update({ tier: "free" })
        .eq("user_id", user.id)
        .select("id, user_id, tier, created_at")
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("Subscription API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
