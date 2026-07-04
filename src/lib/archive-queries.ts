import { supabase } from "./supabase"

export interface EvidenceItem {
  id: string
  evidence_type: "satellite" | "report"
  evidence_id: string
  polling_unit_id: string | null
  sha256_hash: string
  flagged_by: string | null
  flag_reason: string | null
  verification_status: "pending" | "verified" | "tampered"
  last_verified_at: string | null
  created_at: string
  pu_name?: string
  pu_state?: string
  satellite_image_url?: string
  satellite_captured_at?: string | null
  report_description?: string
  report_created_at?: string | null
}

export interface ArchiveStats {
  total: number
  satellite: number
  report: number
  verified: number
  pending: number
}

export async function fetchEvidenceArchive(params: {
  type?: string
  state?: string
  verification?: string
  page?: number
  limit?: number
}): Promise<{ items: EvidenceItem[]; total: number }> {
  const { type, state, verification, page = 0, limit = 20 } = params
  const offset = page * limit

  let query = supabase
    .from("evidence_archive")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (type && type !== "all") {
    query = query.eq("evidence_type", type)
  }
  if (verification && verification !== "all") {
    query = query.eq("verification_status", verification)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching evidence archive:", error.message)
    return { items: [], total: 0 }
  }

  if (!data || data.length === 0) return { items: [], total: count || 0 }

  // Collect IDs for batch lookups
  const puIds = [...new Set(data.map((r: any) => r.polling_unit_id).filter(Boolean))]
  const satIds = [...new Set(data.filter((r: any) => r.evidence_type === "satellite").map((r: any) => r.evidence_id))]
  const repIds = [...new Set(data.filter((r: any) => r.evidence_type === "report").map((r: any) => r.evidence_id))]

  // Batch fetch related data
  const [pus, sats, reps] = await Promise.all([
    puIds.length > 0
      ? supabase.from("polling_units").select("id, name, state").in("id", puIds)
      : { data: [] as any[], error: null },
    satIds.length > 0
      ? supabase.from("satellite_captures").select("id, image_url, captured_at").in("id", satIds)
      : { data: [] as any[], error: null },
    repIds.length > 0
      ? supabase.from("incident_reports").select("id, description, created_at").in("id", repIds)
      : { data: [] as any[], error: null },
  ])

  const puMap = new Map((pus.data || []).map((p: any) => [p.id, p]))
  const satMap = new Map((sats.data || []).map((s: any) => [s.id, s]))
  const repMap = new Map((reps.data || []).map((r: any) => [r.id, r]))

  const items: EvidenceItem[] = data.map((row: any) => {
    const pu = puMap.get(row.polling_unit_id)
    const sat = row.evidence_type === "satellite" ? satMap.get(row.evidence_id) : null
    const rep = row.evidence_type === "report" ? repMap.get(row.evidence_id) : null

    return {
      id: row.id,
      evidence_type: row.evidence_type,
      evidence_id: row.evidence_id,
      polling_unit_id: row.polling_unit_id,
      sha256_hash: row.sha256_hash,
      flagged_by: row.flagged_by,
      flag_reason: row.flag_reason,
      verification_status: row.verification_status,
      last_verified_at: row.last_verified_at,
      created_at: row.created_at,
      pu_name: pu?.name,
      pu_state: state || pu?.state,
      satellite_image_url: sat?.image_url,
      satellite_captured_at: sat?.captured_at,
      report_description: rep?.description,
      report_created_at: rep?.created_at,
    }
  })

  return { items, total: count || 0 }
}

export async function fetchEvidenceById(
  id: string
): Promise<EvidenceItem | null> {
  const { data: row, error } = await supabase
    .from("evidence_archive")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !row) return null

  // Fetch related data separately
  const [puRes, satRes, repRes] = await Promise.all([
    row.polling_unit_id
      ? supabase.from("polling_units").select("name, state, lat, lng").eq("id", row.polling_unit_id).single()
      : { data: null, error: null },
    row.evidence_type === "satellite"
      ? supabase.from("satellite_captures").select("image_url, captured_at, sha256_hash, ai_summary").eq("id", row.evidence_id).single()
      : { data: null, error: null },
    row.evidence_type === "report"
      ? supabase.from("incident_reports").select("description, photo_url, status, created_at").eq("id", row.evidence_id).single()
      : { data: null, error: null },
  ])

  return {
    id: row.id,
    evidence_type: row.evidence_type,
    evidence_id: row.evidence_id,
    polling_unit_id: row.polling_unit_id,
    sha256_hash: row.sha256_hash,
    flagged_by: row.flagged_by,
    flag_reason: row.flag_reason,
    verification_status: row.verification_status,
    last_verified_at: row.last_verified_at,
    created_at: row.created_at,
    pu_name: puRes.data?.name,
    pu_state: puRes.data?.state,
    satellite_image_url: satRes.data?.image_url,
    satellite_captured_at: satRes.data?.captured_at,
    report_description: repRes.data?.description,
    report_created_at: repRes.data?.created_at,
  }
}

export async function fetchArchiveStats(): Promise<ArchiveStats> {
  const [total, satellite, report, verified, pending] = await Promise.all([
    supabase.from("evidence_archive").select("*", { count: "exact", head: true }),
    supabase.from("evidence_archive").select("*", { count: "exact", head: true }).eq("evidence_type", "satellite"),
    supabase.from("evidence_archive").select("*", { count: "exact", head: true }).eq("evidence_type", "report"),
    supabase.from("evidence_archive").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabase.from("evidence_archive").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
  ])

  return {
    total: total.count || 0,
    satellite: satellite.count || 0,
    report: report.count || 0,
    verified: verified.count || 0,
    pending: pending.count || 0,
  }
}
