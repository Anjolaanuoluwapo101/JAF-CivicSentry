import { supabase } from "./supabase"

export interface PollingUnit {
  id: string
  name: string
  state: string
  lga: string
  ward: string
  lat: number
  lng: number
  risk_score: "low" | "medium" | "high"
}

export interface AcledIncident {
  id: string
  polling_unit_id: string | null
  event_date: string
  event_type: string
  sub_event_type: string
  description: string
  fatalities: number
  source: string
  state: string | null
}

export interface DashboardStats {
  totalPUs: number
  totalIncidents: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  statesWithIncidents: number
  totalFatalities: number
}

export async function fetchPollingUnits(
  state?: string
): Promise<PollingUnit[]> {
  let query = supabase
    .from("polling_units")
    .select("id, name, state, lga, ward, lat, lng, risk_score")
    .limit(100)

  if (state && state !== "ALL") {
    query = query.eq("state", state)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching PUs:", error.message)
    return []
  }
  return data || []
}

export async function fetchPollingUnitsInBounds(
  bounds: { north: number; south: number; east: number; west: number },
  state?: string
): Promise<PollingUnit[]> {
  let query = supabase
    .from("polling_units")
    .select("id, name, state, lga, ward, lat, lng, risk_score")
    .gte("lat", bounds.south)
    .lte("lat", bounds.north)
    .gte("lng", bounds.west)
    .lte("lng", bounds.east)
    .limit(100)

  if (state && state !== "ALL") {
    query = query.eq("state", state)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching PUs in bounds:", error.message)
    return []
  }
  return data || []
}

export async function fetchIncidents(
  state?: string
): Promise<AcledIncident[]> {
  const PAGE_SIZE = 1000
  let from = 0
  const all: AcledIncident[] = []

  while (true) {
    let query = supabase
      .from("acled_incidents")
      .select(
        "id, polling_unit_id, event_date, event_type, sub_event_type, description, fatalities, source, state"
      )
      .range(from, from + PAGE_SIZE - 1)

    if (state && state !== "ALL") {
      query = query.eq("state", state)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching incidents:", error.message)
      return all
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}

export interface SatelliteCapture {
  id: string
  polling_unit_id: string | null
  captured_at: string | null
  is_flagged: boolean
}

export async function fetchSatelliteCaptures(
  state?: string
): Promise<SatelliteCapture[]> {
  let query = supabase
    .from("satellite_captures")
    .select("id, polling_unit_id, captured_at, is_flagged")
    .not("polling_unit_id", "is", null)

  if (state && state !== "ALL") {
    query = query.eq("state", state)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching satellite captures:", error.message)
    return []
  }
  return data || []
}

export async function searchPollingUnits(
  query: string,
  state?: string
): Promise<PollingUnit[]> {
  if (!query || query.length < 2) return []

  let dbQuery = supabase
    .from("polling_units")
    .select("id, name, state, lga, ward, lat, lng, risk_score")
    .ilike("name", `%${query}%`)
    .limit(20)

  if (state && state !== "ALL") {
    dbQuery = dbQuery.eq("state", state)
  }

  const { data, error } = await dbQuery
  if (error) {
    console.error("Error searching PUs:", error.message)
    return []
  }
  return data || []
}

export async function fetchDashboardStats(
  state?: string
): Promise<DashboardStats> {
  async function count(table: string, filters?: { col: string; val: string }[]) {
    let q = supabase.from(table).select("*", { count: "exact", head: true })
    if (filters) {
      for (const f of filters) {
        q = q.eq(f.col, f.val)
      }
    }
    const { count: c, error } = await q
    if (error) return 0
    return c || 0
  }

  const stateFilter = state && state !== "ALL" ? [{ col: "state", val: state }] : undefined

  const [totalPUs, totalIncidents, highRisk, mediumRisk, totalFatalities] =
    await Promise.all([
      count("polling_units", stateFilter),
      count("acled_incidents", stateFilter),
      count("polling_units", [
        ...(stateFilter || []),
        { col: "risk_score", val: "high" },
      ]),
      count("polling_units", [
        ...(stateFilter || []),
        { col: "risk_score", val: "medium" },
      ]),
      (async () => {
        let q = supabase
          .from("acled_incidents")
          .select("fatalities")
        if (stateFilter) {
          for (const f of stateFilter) q = q.eq(f.col, f.val)
        }
        const { data, error } = await q
        if (error || !data) return 0
        return data.reduce((sum: number, i: any) => sum + (i.fatalities || 0), 0)
      })(),
    ])

  let statesWithIncidents = 0
  {
    let q = supabase.from("acled_incidents").select("state")
    if (stateFilter) {
      for (const f of stateFilter) q = q.eq(f.col, f.val)
    }
    const { data, error } = await q
    if (!error && data) {
      statesWithIncidents = new Set(data.map((i: any) => i.state).filter(Boolean)).size
    }
  }

  return {
    totalPUs,
    totalIncidents,
    highRisk,
    mediumRisk,
    lowRisk: totalPUs - highRisk - mediumRisk,
    statesWithIncidents,
    totalFatalities,
  }
}
