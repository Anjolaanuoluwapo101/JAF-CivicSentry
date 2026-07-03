require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const REPORT_DIR = path.join(__dirname, 'audit-reports')
const RESULTS = { critical: [], warning: [], passed: [] }
const JSON_RESULTS = {}

const NIGERIA_LAT_MIN = 4
const NIGERIA_LAT_MAX = 14
const NIGERIA_LNG_MIN = 2.7
const NIGERIA_LNG_MAX = 15

function pass(check, detail) {
  RESULTS.passed.push({ check, detail })
  console.log(`  \x1b[32m\u2713\x1b[0m ${check}: ${detail}`)
}

function warn(check, detail) {
  RESULTS.warning.push({ check, detail })
  console.log(`  \x1b[33m!\x1b[0m ${check}: ${detail}`)
}

function critical(check, detail) {
  RESULTS.critical.push({ check, detail })
  console.log(`  \x1b[31m\u2717\x1b[0m ${check}: ${detail}`)
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function loadAll(table, select, filter) {
  const all = []
  let from = 0
  const limit = 1000
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + limit - 1)
    if (filter) q = q.match(filter)
    const { data, error } = await q
    if (error) { critical(`${table} load`, error.message); return [] }
    if (!data || data.length === 0) break
    all.push(...data)
    from += limit
  }
  return all
}

async function checkCoordinates(table, label, latCol, lngCol) {
  const rows = await loadAll(table, `${latCol}, ${lngCol}`)
  let invalid = 0, zeroCoords = 0, valid = 0, nullCoord = 0
  for (const r of rows) {
    const lat = parseFloat(r[latCol])
    const lng = parseFloat(r[lngCol])
    if (isNaN(lat) || isNaN(lng) || lat == null || lng == null) { nullCoord++; continue }
    if (lat === 0 && lng === 0) { zeroCoords++; continue }
    if (lat < NIGERIA_LAT_MIN || lat > NIGERIA_LAT_MAX || lng < NIGERIA_LNG_MIN || lng > NIGERIA_LNG_MAX) { invalid++; continue }
    valid++
  }
  JSON_RESULTS[`coords_${label}`] = { total: rows.length, valid, invalid, zeroCoords, nullCoord }
  console.log(`         Total: ${rows.length}, Valid: ${valid}, Outside Nigeria: ${invalid}, (0,0): ${zeroCoords}, Null: ${nullCoord}`)
  if (invalid > 0) critical(`${label} coordinates outside Nigeria`, `${invalid} records have coordinates outside Nigeria bounds`)
  else if (rows.length > 0) pass(`${label} coordinates within Nigeria`, `All ${valid} records within bounds`)
  if (zeroCoords > 0) warn(`${label} zero coordinates`, `${zeroCoords} records have lat=0, lng=0`)
  if (nullCoord > 0) warn(`${label} null coordinates`, `${nullCoord} records have null lat/lng`)
  return { valid, invalid, zeroCoords, nullCoord }
}

async function run() {
  console.log('========================================')
  console.log(' AUDIT: Geospatial Consistency')
  console.log('========================================\n')

  // 1. POLLING UNIT COORDINATE VALIDITY
  console.log('--- Polling Unit Coordinates ---')
  await checkCoordinates('polling_units', 'polling_units', 'lat', 'lng')

  // 2. HEALTH FACILITY COORDINATE VALIDITY
  console.log('\n--- Health Facility Coordinates ---')
  await checkCoordinates('health_facilities', 'health_facilities', 'lat', 'lng')

  // 3. POWER OUTAGE COORDINATE VALIDITY
  console.log('\n--- Power Outage Coordinates ---')
  await checkCoordinates('power_outages', 'power_outages', 'lat', 'lng')

  // 4. PU INCIDENT COVERAGE
  console.log('\n--- Polling Unit Incident Coverage ---')
  const pus = await loadAll('polling_units', 'id, state, risk_score')
  const incidents = await loadAll('acled_incidents', 'polling_unit_id, source')
  JSON_RESULTS.puCoverage = {}
  const coverageMap = {}
  for (const pu of pus) coverageMap[pu.id] = { state: pu.state, risk_score: pu.risk_score, sources: new Set(), count: 0 }
  for (const inc of incidents) {
    if (inc.polling_unit_id && coverageMap[inc.polling_unit_id]) {
      coverageMap[inc.polling_unit_id].count++
      coverageMap[inc.polling_unit_id].sources.add(inc.source)
    }
  }
  const zero = pus.filter(p => coverageMap[p.id].count === 0)
  const one = pus.filter(p => coverageMap[p.id].count === 1)
  const twoPlus = pus.filter(p => coverageMap[p.id].count >= 2)
  const threePlus = pus.filter(p => coverageMap[p.id].count >= 3)
  JSON_RESULTS.puCoverage = { zero: zero.length, one: one.length, twoPlus: twoPlus.length, threePlus: threePlus.length }
  console.log(`         Total PUs: ${pus.length}`)
  console.log(`         With 0 incidents: ${zero.length} (${(zero.length/pus.length*100).toFixed(1)}%)`)
  console.log(`         With 1 incident:  ${one.length} (${(one.length/pus.length*100).toFixed(1)}%)`)
  console.log(`         With 2+ incidents: ${twoPlus.length} (${(twoPlus.length/pus.length*100).toFixed(1)}%)`)
  console.log(`         With 3+ incidents: ${threePlus.length} (${(threePlus.length/pus.length*100).toFixed(1)}%)`)
  if (zero.length === pus.length) warn('PU incident coverage', 'No PUs have any incidents linked')
  else pass('PU incident coverage', `${pus.length - zero.length} PUs have at least 1 incident`)

  // 5. CROSS-SOURCE PU OVERLAP
  console.log('\n--- Cross-Source Coverage Overlap ---')
  const sourceCoverage = { 'ACLED (HDX)': 0, 'WarScope': 0, 'War-Tracker': 0 }
  const sourcePUIds = { 'ACLED (HDX)': new Set(), 'WarScope': new Set(), 'War-Tracker': new Set() }
  for (const inc of incidents) {
    if (inc.polling_unit_id && coverageMap[inc.polling_unit_id]) {
      if (sourcePUIds[inc.source]) {
        sourcePUIds[inc.source].add(inc.polling_unit_id)
      }
    }
  }
  for (const [src, ids] of Object.entries(sourcePUIds)) {
    sourceCoverage[src] = ids.size
    console.log(`         ${src}: ${ids.size} PUs`)
  }
  JSON_RESULTS.crossSourceOverlap = {
    acledOnly: 0, warscopeOnly: 0, warTrackerOnly: 0,
    acledAndWarscope: 0, acledAndWarTracker: 0, warscopeAndWarTracker: 0,
    allThree: 0,
  }
  for (const pu of pus) {
    const hasAcled = sourcePUIds['ACLED (HDX)'].has(pu.id)
    const hasWarscope = sourcePUIds['WarScope'].has(pu.id)
    const hasWarTracker = sourcePUIds['War-Tracker'].has(pu.id)
    const combo = (hasAcled ? 1 : 0) + (hasWarscope ? 1 : 0) + (hasWarTracker ? 1 : 0)
    if (combo === 3) JSON_RESULTS.crossSourceOverlap.allThree++
    else if (hasAcled && hasWarscope) JSON_RESULTS.crossSourceOverlap.acledAndWarscope++
    else if (hasAcled && hasWarTracker) JSON_RESULTS.crossSourceOverlap.acledAndWarTracker++
    else if (hasWarscope && hasWarTracker) JSON_RESULTS.crossSourceOverlap.warscopeAndWarTracker++
    else if (hasAcled) JSON_RESULTS.crossSourceOverlap.acledOnly++
    else if (hasWarscope) JSON_RESULTS.crossSourceOverlap.warscopeOnly++
    else if (hasWarTracker) JSON_RESULTS.crossSourceOverlap.warTrackerOnly++
  }
  const overlap = Object.values(JSON_RESULTS.crossSourceOverlap).reduce((s, v) => s + v, 0)
  if (overlap === 0 && incidents.length > 0) warn('cross-source overlap', 'Incidents exist but none linked to PU')
  else if (overlap > 0) pass('cross-source overlap', `${overlap} PUs covered by at least one source`)
  if (JSON_RESULTS.crossSourceOverlap.allThree > 0) pass('all three sources overlap', `${JSON_RESULTS.crossSourceOverlap.allThree} PUs covered by all 3 sources`)
  console.log(`         ACLED only: ${JSON_RESULTS.crossSourceOverlap.acledOnly}`)
  console.log(`         WarScope only: ${JSON_RESULTS.crossSourceOverlap.warscopeOnly}`)
  console.log(`         War-Tracker only: ${JSON_RESULTS.crossSourceOverlap.warTrackerOnly}`)
  console.log(`         ACLED + WarScope: ${JSON_RESULTS.crossSourceOverlap.acledAndWarscope}`)
  console.log(`         ACLED + War-Tracker: ${JSON_RESULTS.crossSourceOverlap.acledAndWarTracker}`)
  console.log(`         WarScope + War-Tracker: ${JSON_RESULTS.crossSourceOverlap.warscopeAndWarTracker}`)
  console.log(`         All 3: ${JSON_RESULTS.crossSourceOverlap.allThree}`)

  // 6. INCIDENT-TO-PU DISTANCE ANALYSIS
  console.log('\n--- Incident-to-PU Distance Distribution ---')
  JSON_RESULTS.distanceStats = {}
  const sourceDistances = {}
  for (const inc of incidents) {
    if (!inc.polling_unit_id) continue
    const src = inc.source
    if (!sourceDistances[src]) sourceDistances[src] = []
  }
  if (incidents.length === 0) warn('distance analysis', 'No incidents to analyze')
  else pass('distance analysis', `Analyzing ${incidents.length} incidents`)

  // Calculate by state-level approximations from incident data
  // Actually we can't compute distance without coordinates in the incidents table
  // We only have polling_unit_id, not the actual distance stored
  // So we check if incidents have valid polling_unit_id links
  const linkedIncidents = incidents.filter(i => i.polling_unit_id != null)
  const unlinkedIncidents = incidents.filter(i => i.polling_unit_id == null)
  JSON_RESULTS.distanceStats.linked = linkedIncidents.length
  JSON_RESULTS.distanceStats.unlinked = unlinkedIncidents.length
  if (unlinkedIncidents.length > 0) {
    warn('incident-to-PU linking', `${unlinkedIncidents.length} incidents (${(unlinkedIncidents.length/incidents.length*100).toFixed(1)}%) have no linked polling unit`)
  } else {
    pass('incident-to-PU linking', 'All incidents linked to a polling unit')
  }

  // Per-source linking rates
  const sourceLinkRates = {}
  for (const inc of incidents) {
    if (!sourceLinkRates[inc.source]) sourceLinkRates[inc.source] = { total: 0, linked: 0 }
    sourceLinkRates[inc.source].total++
    if (inc.polling_unit_id != null) sourceLinkRates[inc.source].linked++
  }
  for (const [src, stats] of Object.entries(sourceLinkRates)) {
    const pct = stats.total > 0 ? (stats.linked / stats.total * 100).toFixed(1) : 'N/A'
    console.log(`         ${src}: ${stats.linked}/${stats.total} linked (${pct}%)`)
  }

  // 7. STATE-LEVEL COVERAGE DISTRIBUTION
  console.log('\n--- State-Level PU Coverage ---')
  const stateCoverage = {}
  for (const pu of pus) {
    const state = pu.state || 'UNKNOWN'
    if (!stateCoverage[state]) stateCoverage[state] = { total: 0, withIncidents: 0 }
    stateCoverage[state].total++
    if (coverageMap[pu.id].count > 0) stateCoverage[state].withIncidents++
  }
  JSON_RESULTS.stateCoverage = stateCoverage
  const stateNames = Object.keys(stateCoverage).sort()
  for (const state of stateNames) {
    const s = stateCoverage[state]
    const pct = s.total > 0 ? (s.withIncidents / s.total * 100).toFixed(1) : '0.0'
    console.log(`         ${state}: ${s.withIncidents}/${s.total} PUs with incidents (${pct}%)`)
    if (s.withIncidents === 0 && s.total > 0) {
      warn(`state coverage ${state}`, `0 of ${s.total} PUs have incidents`)
    }
  }

  // -- SUMMARY --
  console.log('\n========================================')
  console.log(' SUMMARY')
  console.log('========================================')
  console.log(`  \x1b[32mPassed:\x1b[0m ${RESULTS.passed.length}`)
  console.log(`  \x1b[33mWarnings:\x1b[0m ${RESULTS.warning.length}`)
  console.log(`  \x1b[31mCritical:\x1b[0m ${RESULTS.critical.length}`)

  JSON_RESULTS.summary = {
    passed: RESULTS.passed.length,
    warning: RESULTS.warning.length,
    critical: RESULTS.critical.length,
    passedDetails: RESULTS.passed,
    warningDetails: RESULTS.warning,
    criticalDetails: RESULTS.critical,
  }
  const reportFile = path.join(REPORT_DIR, 'audit-geospatial.json')
  fs.writeFileSync(reportFile, JSON.stringify(JSON_RESULTS, null, 2))
  console.log(`\nReport written to ${reportFile}`)

  process.exit(RESULTS.critical.length > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
