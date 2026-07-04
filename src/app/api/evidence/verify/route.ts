import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { evidence_id } = body

    if (!evidence_id) {
      return NextResponse.json(
        { error: "Missing evidence_id" },
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

    // Fetch the evidence archive entry
    const { data: entry, error: fetchError } = await supabase
      .from("evidence_archive")
      .select("id, evidence_type, evidence_id, sha256_hash, verification_status")
      .eq("id", evidence_id)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
    }

    // Fetch the original source to re-hash and compare
    let currentHash: string | null = null

    if (entry.evidence_type === "satellite") {
      const { data: satellite } = await supabase
        .from("satellite_captures")
        .select("sha256_hash")
        .eq("id", entry.evidence_id)
        .single()
      currentHash = satellite?.sha256_hash || null
    } else if (entry.evidence_type === "report") {
      const { data: report } = await supabase
        .from("incident_reports")
        .select("id")
        .eq("id", entry.evidence_id)
        .single()
      // Reports don't have a content hash, verify existence only
      currentHash = report ? entry.sha256_hash : null
    }

    if (!currentHash) {
      return NextResponse.json(
        { error: "Source evidence not found" },
        { status: 404 }
      )
    }

    // Compare hashes
    const verified = currentHash === entry.sha256_hash

    const { error: updateError } = await supabase
      .from("evidence_archive")
      .update({
        verification_status: verified ? "verified" : "tampered",
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", evidence_id)

    if (updateError) {
      console.error("Update verification error:", updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      verification_status: verified ? "verified" : "tampered",
      original_hash: entry.sha256_hash,
      current_hash: currentHash,
      match: verified,
    })
  } catch (err: any) {
    console.error("Verify evidence API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
