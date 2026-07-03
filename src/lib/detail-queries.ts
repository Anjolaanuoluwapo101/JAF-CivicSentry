import { supabase } from "./supabase"

export interface ConflictEvent {
  id: string
  event_date: string
  event_type: string
  sub_event_type: string
  description: string
  fatalities: number
  source: string
}

export interface NewsItem {
  id: string
  headline: string
  url: string
  source_domain: string
  sentiment_score: number | null
  published_at: string
}

export interface ElectionResult {
  id: string
  election_year: number
  election_type: string
  registered_voters: number | null
  accredited_voters: number | null
  total_votes_cast: number | null
  valid_votes: number | null
  rejected_votes: number | null
  party_results: Record<string, number> | null
  winner: string | null
  winner_votes: number | null
  margin_of_victory: number | null
  turnout_percentage: number | null
  data_quality: string
}

export interface HealthFacility {
  id: string
  name: string
  type: string | null
  category: string | null
  functional_status: string | null
  lat: number
  lng: number
  distance_km: number
}

export interface PowerOutage {
  id: string
  disco: string | null
  feeder_id: string | null
  start_time: string | null
  end_time: string | null
  duration_min: number | null
  cause: string | null
  customers_affected: number | null
  status: string | null
}

export interface PopulationData {
  population_count: number | null
  density_per_sq_km: number | null
}

export interface EconomicData {
  indicator_type: string
  value: number | null
  unit: string | null
  recorded_at: string | null
  source: string | null
}

export interface SatelliteDetail {
  id: string
  captured_at: string | null
  image_url: string | null
  sha256_hash: string | null
  is_flagged: boolean
  flag_reason: string | null
  ai_summary: string | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function fetchConflictForPU(
  pollingUnitId: string
): Promise<ConflictEvent[]> {
  const { data, error } = await supabase
    .from("acled_incidents")
    .select("id, event_date, event_type, sub_event_type, description, fatalities, source")
    .eq("polling_unit_id", pollingUnitId)
    .order("event_date", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching conflicts:", error.message)
    return []
  }
  return data || []
}

export async function fetchNewsForPU(
  pollingUnitId: string,
  state: string
): Promise<NewsItem[]> {
  let query = supabase
    .from("news_signals")
    .select("id, headline, url, source_domain, sentiment_score, published_at")
    .order("published_at", { ascending: false })
    .limit(30)

  const { data: pu } = await supabase
    .from("polling_units")
    .select("state")
    .eq("id", pollingUnitId)
    .single()

  if (pu?.state) {
    query = query.eq("state", pu.state)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching news:", error.message)
    return []
  }
  return data || []
}

export async function fetchElectionsForPU(
  pollingUnitId: string
): Promise<ElectionResult[]> {
  const { data, error } = await supabase
    .from("election_results")
    .select(
      "id, election_year, election_type, registered_voters, accredited_voters, total_votes_cast, valid_votes, rejected_votes, party_results, winner, winner_votes, margin_of_victory, turnout_percentage, data_quality"
    )
    .eq("polling_unit_id", pollingUnitId)
    .order("election_year", { ascending: true })

  if (error) {
    console.error("Error fetching elections:", error.message)
    return []
  }
  return data || []
}

export async function fetchNearestHealthFacility(
  lat: number,
  lng: number,
  state: string
): Promise<HealthFacility[]> {
  const { data, error } = await supabase
    .from("health_facilities")
    .select("id, name, type, category, functional_status, lat, lng")
    .eq("state", state)
    .limit(100)

  if (error || !data) {
    console.error("Error fetching health facilities:", error.message)
    return []
  }

  return data
    .map((f) => ({
      ...f,
      distance_km: haversineKm(lat, lng, f.lat, f.lng),
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 5)
}

export async function fetchPowerOutages(
  state: string
): Promise<PowerOutage[]> {
  const { data, error } = await supabase
    .from("power_outages")
    .select("id, disco, feeder_id, start_time, end_time, duration_min, cause, customers_affected, status")
    .order("start_time", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error fetching power outages:", error.message)
    return []
  }
  return data || []
}

export async function fetchPopulationForPU(
  pollingUnitId: string
): Promise<PopulationData | null> {
  const { data, error } = await supabase
    .from("population_density")
    .select("population_count, density_per_sq_km")
    .eq("polling_unit_id", pollingUnitId)
    .single()

  if (error || !data) return null
  return data
}

export async function fetchEconomicForState(
  state: string
): Promise<EconomicData[]> {
  const { data, error } = await supabase
    .from("economic_indicators")
    .select("indicator_type, value, unit, recorded_at, source")
    .eq("state", state)
    .order("recorded_at", { ascending: false })
    .limit(30)

  if (error) {
    console.error("Error fetching economic data:", error.message)
    return []
  }
  return data || []
}

export async function fetchSatelliteForPU(
  pollingUnitId: string
): Promise<SatelliteDetail | null> {
  const { data, error } = await supabase
    .from("satellite_captures")
    .select("id, captured_at, image_url, sha256_hash, is_flagged, flag_reason, ai_summary")
    .eq("polling_unit_id", pollingUnitId)
    .order("captured_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}
