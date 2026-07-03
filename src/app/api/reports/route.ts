import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { polling_unit_id, description } = body

    if (!polling_unit_id || !description?.trim()) {
      return NextResponse.json(
        { error: "Missing polling_unit_id or description" },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS for insert (we validate auth client-side)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from("incident_reports")
      .insert({
        polling_unit_id,
        description: description.trim(),
        reporter_id: "00000000-0000-0000-0000-000000000000", // anonymous placeholder
        status: "pending",
      })
      .select("id, created_at")
      .single()

    if (error) {
      console.error("Report insert error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, created_at: data.created_at })
  } catch (err: any) {
    console.error("Report API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
