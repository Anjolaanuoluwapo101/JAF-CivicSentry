require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const SW_STATES = ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti']
const SW_STATES_UPPER = SW_STATES.map(s => s.toUpperCase())

function excelDateToDate(serial) {
  const d = new Date((serial - 25569) * 86400 * 1000)
  return d.toISOString().split('T')[0]
}

async function loadAllPUsByState() {
  const all = []
  let from = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase
      .from('polling_units')
      .select('id, state')
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    from += limit
  }

  const byState = {}
  for (const pu of all) {
    const s = pu.state || 'UNKNOWN'
    if (!byState[s]) byState[s] = []
    byState[s].push(pu.id)
  }
  return byState
}

async function main() {
  console.log('=== Seed ACLED Incidents from HDX XLSX ===')
  console.log('Matching: state-level round-robin across all PUs\n')

  console.log('Reading Africa aggregated data...')
  const wb = XLSX.readFile('C:/projects/jaf/civic-sentry/Africa_aggregated_data_up_to_week_of-2026-06-20.xlsx', { sheetRows: 0 })
  const ws = wb.Sheets['Sheet1']
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  console.log(`Total rows: ${rows.length}`)

  // Filter for Nigeria South West
  const swRows = rows.filter(r =>
    r.COUNTRY === 'Nigeria' && SW_STATES.includes(r.ADMIN1)
  )
  console.log(`Nigeria South West rows: ${swRows.length}`)

  // Group by ADMIN1 (state) for stats
  const stateCounts = {}
  for (const r of swRows) {
    const s = r.ADMIN1
    if (!stateCounts[s]) stateCounts[s] = 0
    stateCounts[s] += r.EVENTS || 0
  }
  for (const [s, c] of Object.entries(stateCounts)) {
    console.log(`  ${s}: ${c} total events`)
  }

  // Load PUs grouped by state
  console.log('\nLoading PUs by state...')
  const statePUs = await loadAllPUsByState()
  for (const [s, ids] of Object.entries(statePUs)) {
    console.log(`  ${s}: ${ids.length} PUs`)
  }

  // Create incident records with round-robin state matching
  const incidents = []
  const roundRobinCounters = {}
  for (const state of SW_STATES_UPPER) roundRobinCounters[state] = 0

  for (const row of swRows) {
    const stateKey = row.ADMIN1.toUpperCase()
    const stateName = row.ADMIN1
    const pus = statePUs[stateKey] || []

    // Pick next PU in state using round-robin
    let assignedPUId = null
    if (pus.length > 0) {
      const idx = roundRobinCounters[stateKey] % pus.length
      assignedPUId = pus[idx]
      roundRobinCounters[stateKey]++
    }

    incidents.push({
      id: `hdx-${row.ID}-${row.WEEK}-${row.EVENT_TYPE.replace(/\s+/g, '-')}`,
      polling_unit_id: assignedPUId,
      event_date: excelDateToDate(row.WEEK),
      event_type: row.EVENT_TYPE || '',
      sub_event_type: row.SUB_EVENT_TYPE || '',
      description: `${row.EVENTS} event(s) in ${stateName}, Nigeria (week of ${excelDateToDate(row.WEEK)}). Disorder: ${row.DISORDER_TYPE || 'unknown'}`,
      fatalities: parseInt(row.FATALITIES) || 0,
      source: 'ACLED (HDX)',
      state: stateKey,
    })
  }

  console.log(`\nTotal incidents: ${incidents.length}`)
  console.log(`Incidents linked to PU via state match: ${incidents.filter(i => i.polling_unit_id).length}`)
  console.log(`Round-robin distribution per state:`)
  for (const [s, c] of Object.entries(roundRobinCounters)) {
    console.log(`  ${s}: ${c} incidents → ${statePUs[s]?.length || 0} PUs (avg ${(c / (statePUs[s]?.length || 1)).toFixed(1)}/PU)`)
  }

  // Delete any existing ACLED sourced records first
  const { error: delErr } = await supabase
    .from('acled_incidents')
    .delete()
    .eq('source', 'ACLED (HDX)')
  if (delErr) console.error('Delete error:', delErr.message)
  else console.log('Cleared old HDX records')

  // Reset all risk scores to low in one call
  console.log('\nResetting all risk scores...')
  const { error: resetErr } = await supabase
    .from('polling_units')
    .update({ risk_score: 'low' })
    .neq('risk_score', 'low')
  if (resetErr) console.error('  Reset error:', resetErr.message)
  else console.log('  Reset all risk scores to low')

  // Insert in batches of 1000
  const BATCH_SIZE = 1000
  let inserted = 0
  for (let i = 0; i < incidents.length; i += BATCH_SIZE) {
    const batch = incidents.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('acled_incidents').upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
    if (error) {
      console.error(`  Batch error at ${i}: ${error.message}`)
    } else {
      inserted += batch.length
    }
    console.log(`  Inserted ${inserted}/${incidents.length}`)
  }

  // Compute incident counts per PU
  const counts = {}
  for (const inc of incidents) {
    if (!inc.polling_unit_id) continue
    if (!counts[inc.polling_unit_id]) counts[inc.polling_unit_id] = { count: 0, hasFatalities: false }
    counts[inc.polling_unit_id].count++
    if (inc.fatalities > 0) counts[inc.polling_unit_id].hasFatalities = true
  }

  // Update risk scores in batches of 500
  console.log('\nUpdating risk scores...')
  const riskUpdates = Object.entries(counts).map(([unitId, d]) => {
    let score = 'low'
    if (d.count >= 3 || d.hasFatalities) score = 'high'
    else if (d.count >= 1) score = 'medium'
    return { id: unitId, risk_score: score }
  })

  let low = 0, medium = 0, high = 0, updated = 0
  const RB = 500
  for (let i = 0; i < riskUpdates.length; i += RB) {
    const batch = riskUpdates.slice(i, i + RB)
    for (const r of batch) {
      if (r.risk_score === 'high') high++
      else if (r.risk_score === 'medium') medium++
      else low++
      const { error } = await supabase.from('polling_units').update({ risk_score: r.risk_score }).eq('id', r.id)
      if (!error) updated++
    }
  }
  console.log(`  Updated ${updated}/${riskUpdates.length} PUs - Low: ${low}, Medium: ${medium}, High: ${high}`)

  console.log(`\nDone! Inserted ${inserted} ACLED incidents.`)
}

main().catch(console.error)
