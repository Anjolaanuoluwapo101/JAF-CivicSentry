import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { evidence_type, evidence_id, polling_unit_id, sha256_hash, flag_reason } = body

    if (!evidence_type || !evidence_id || !sha256_hash) {
      return NextResponse.json(
        { error: "Missing evidence_type, evidence_id, or sha256_hash" },
        { status: 400 }
      )
    }

    if (!["satellite", "report"].includes(evidence_type)) {
      return NextResponse.json(
        { error: "evidence_type must be 'satellite' or 'report'" },
        { status: 400 }
      )
    }

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

    // Check if already flagged
    const { data: existing } = await supabase
      .from("evidence_archive")
      .select("id")
      .eq("evidence_type", evidence_type)
      .eq("evidence_id", evidence_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Evidence already flagged for archive" },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from("evidence_archive")
      .insert({
        evidence_type,
        evidence_id,
        polling_unit_id: polling_unit_id || null,
        sha256_hash,
        flagged_by: user.id,
        flag_reason: flag_reason || null,
        verification_status: "pending",
      })
      .select("id, created_at")
      .single()

    if (error) {
      console.error("Flag evidence error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, created_at: data.created_at })
  } catch (err: any) {
    console.error("Flag evidence API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
