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

async function run() {
  console.log('========================================')
  console.log(' AUDIT: Cross-Script Overlaps & Consistency')
  console.log('========================================\n')

  JSON_RESULTS.populationDensity = {}
  JSON_RESULTS.satelliteCaptures = {}
  JSON_RESULTS.electionConflicts = {}
  JSON_RESULTS.riskScoreMismatches = {}
  JSON_RESULTS.missingStateInfo = {}

  // 1. POPULATION DENSITY DUPLICATES
  console.log('--- Population Density Duplicates ---')
  const popRows = await loadAll('population_density', 'id, polling_unit_id, density_per_sq_km, source')
  const popByPU = {}
  for (const r of popRows) {
    if (!r.polling_unit_id) continue
    if (!popByPU[r.polling_unit_id]) popByPU[r.polling_unit_id] = []
    popByPU[r.polling_unit_id].push(r)
  }
  const popDupes = Object.entries(popByPU).filter(([, records]) => records.length > 1)
  JSON_RESULTS.populationDensity.duplicatePUs = popDupes.length
  if (popDupes.length > 0) {
    critical('population_density duplicates', `${popDupes.length} PUs have multiple density records`)
    for (const [puId, records] of popDupes.slice(0, 10)) {
      const vals = records.map(r => `${r.density_per_sq_km} (${r.source})`).join(', ')
      console.log(`         ${puId}: ${vals}`)
      // Check for conflicting values
      const uniqueVals = new Set(records.map(r => r.density_per_sq_km))
      if (uniqueVals.size > 1) warn(`conflicting density for ${puId}`, `Values differ: ${[...uniqueVals].join(', ')}`)
    }
  } else {
    pass('population_density duplicates', 'No PU has multiple density records')
  }
  JSON_RESULTS.populationDensity.duplicateDetails = popDupes.slice(0, 50).map(([puId, records]) => ({
    puId,
    records: records.map(r => ({ density: r.density_per_sq_km, source: r.source })),
  }))

  // 2. POPULATION DENSITY - check for sample records from seed-nigerian-data.js (source=OpenStreetMap, polling_unit_id=null)
  console.log('\n--- Population Density: Source Distribution ---')
  const sourceDistribution = {}
  for (const r of popRows) {
    const s = r.source || 'NULL'
    sourceDistribution[s] = (sourceDistribution[s] || 0) + 1
  }
  JSON_RESULTS.populationDensity.sourceDistribution = sourceDistribution
  for (const [src, cnt] of Object.entries(sourceDistribution)) {
    console.log(`         ${src}: ${cnt}`)
  }
  if (sourceDistribution['OpenStreetMap'] && sourceDistribution['WorldPop/NPopC 2006']) {
    warn('population_density multi-source', `Both OpenStreetMap (${sourceDistribution['OpenStreetMap']}) and WorldPop/NPopC 2006 (${sourceDistribution['WorldPop/NPopC 2006']}) records exist`)
  } else {
    pass('population_density single source', 'Only one source type in table')
  }

  // 3. SATELLITE CAPTURES DUPLICATES
  console.log('\n--- Satellite Captures Duplicates ---')
  const satRows = await loadAll('satellite_captures', 'id, polling_unit_id, sha256_hash, captured_at')
  JSON_RESULTS.satelliteCaptures.total = satRows.length
  
  // Duplicate SHA-256 hashes
  const hashCounts = {}
  for (const r of satRows) {
    if (!r.sha256_hash) continue
    hashCounts[r.sha256_hash] = (hashCounts[r.sha256_hash] || 0) + 1
  }
  const dupHashes = Object.entries(hashCounts).filter(([, c]) => c > 1)
  JSON_RESULTS.satelliteCaptures.duplicateHashes = dupHashes.length
  if (dupHashes.length > 0) {
    warn('satellite captures duplicate SHA-256', `${dupHashes.length} hashes appear multiple times`)
    for (const [hash, cnt] of dupHashes.slice(0, 10)) {
      console.log(`         ${hash.substring(0, 16)}...: ${cnt}x`)
    }
  } else {
    pass('satellite captures SHA-256 uniqueness', 'No duplicate hashes')
  }

  // Same PU + same date
  const puDateMap = {}
  for (const r of satRows) {
    if (!r.polling_unit_id || !r.captured_at) continue
    const key = `${r.polling_unit_id}|${r.captured_at?.split('T')[0]}`
    if (!puDateMap[key]) puDateMap[key] = []
    puDateMap[key].push(r.id)
  }
  const puDateDupes = Object.entries(puDateMap).filter(([, ids]) => ids.length > 1)
  JSON_RESULTS.satelliteCaptures.duplicatePUDate = puDateDupes.length
  if (puDateDupes.length > 0) {
    warn('satellite captures same PU+date', `${puDateDupes.length} PU+date combinations have multiple captures`)
  } else {
    pass('satellite captures PU+date uniqueness', 'No duplicate PU+date combinations')
  }

  // NULL polling_unit_id count
  const nullPUSat = satRows.filter(r => r.polling_unit_id == null).length
  JSON_RESULTS.satelliteCaptures.nullPU = nullPUSat
  if (nullPUSat > 0) warn('satellite captures null PU', `${nullPUSat} captures not linked to any PU (${(nullPUSat/satRows.length*100).toFixed(1)}%)`)
  else pass('satellite captures PU linkage', 'All captures linked to a PU')

  // 4. ELECTION RESULT CONFLICTS (same PU + same year)
  console.log('\n--- Election Result Conflicts ---')
  const electionRows = await loadAll('election_results', 'id, polling_unit_id, election_year, party_results, source')
  JSON_RESULTS.electionConflicts.total = electionRows.length
  const electionByPUYear = {}
  for (const r of electionRows) {
    if (!r.polling_unit_id) continue
    const key = `${r.polling_unit_id}|${r.election_year}`
    if (!electionByPUYear[key]) electionByPUYear[key] = []
    electionByPUYear[key].push(r)
  }
  const electionConflicts = Object.entries(electionByPUYear).filter(([, records]) => records.length > 1)
  JSON_RESULTS.electionConflicts.conflicts = electionConflicts.length
  if (electionConflicts.length > 0) {
    warn('election results conflicts', `${electionConflicts.length} PU+year combinations have multiple records`)
    for (const [key, records] of electionConflicts.slice(0, 10)) {
      const sources = records.map(r => `${r.source} (party_results: ${JSON.stringify(r.party_results)})`).join(' | ')
      console.log(`         ${key}: ${sources}`)
      // Check if party_results differ
      const partyResults = records.map(r => JSON.stringify(r.party_results))
      if (new Set(partyResults).size > 1) critical(`conflicting results for ${key}`, `Different party_results values from ${records.map(r => r.source).join(', ')}`)
    }
  } else {
    pass('election results conflicts', 'No duplicate PU+year combinations')
  }

  // 5. RISK SCORE vs REALITY MISMATCH
  console.log('\n--- Risk Score vs Incident Reality ---')
  const pus = await loadAll('polling_units', 'id, state, risk_score')
  const incidents = await loadAll('acled_incidents', 'polling_unit_id, fatalities')
  
  const incidentCounts = {}
  const fatalityFlags = {}
  for (const inc of incidents) {
    if (!inc.polling_unit_id) continue
    incidentCounts[inc.polling_unit_id] = (incidentCounts[inc.polling_unit_id] || 0) + 1
    if (inc.fatalities > 0) fatalityFlags[inc.polling_unit_id] = true
  }

  const mismatches = []
  const falseHigh = []
  const falseLow = []
  for (const pu of pus) {
    const cnt = incidentCounts[pu.id] || 0
    const hasFatalities = fatalityFlags[pu.id] || false
    let expected = 'low'
    if (cnt >= 3 || hasFatalities) expected = 'high'
    else if (cnt >= 1) expected = 'medium'
    else expected = 'low'
    
    if (pu.risk_score !== expected) {
      mismatches.push({ id: pu.id, state: pu.state, risk_score: pu.risk_score, expected, count: cnt, hasFatalities })
      if (pu.risk_score === 'high' && expected !== 'high') falseHigh.push(pu.id)
      if (expected === 'high' && pu.risk_score !== 'high') falseLow.push(pu.id)
    }
  }

  JSON_RESULTS.riskScoreMismatches.total = mismatches.length
  JSON_RESULTS.riskScoreMismatches.falseHigh = falseHigh.length
  JSON_RESULTS.riskScoreMismatches.falseLow = falseLow.length
  JSON_RESULTS.riskScoreMismatches.details = mismatches.slice(0, 100)

  if (mismatches.length > 0) {
    critical('risk score mismatches', `${mismatches.length} PUs have risk_score != expected based on incidents`)
    console.log(`         False High (no incidents but marked high): ${falseHigh.length}`)
    console.log(`         False Low (3+ incidents but not marked high): ${falseLow.length}`)
    for (const m of mismatches.slice(0, 10)) {
      console.log(`         ${m.id}: current=${m.risk_score}, expected=${m.expected} (${m.count} incidents, fatalities=${m.hasFatalities})`)
    }
  } else {
    pass('risk score consistency', 'All PU risk scores match incident counts')
  }

  // 6. MISSING STATE INFO IN TABLES THAT HAVE IT
  console.log('\n--- Missing State Information ---')
  JSON_RESULTS.missingStateInfo = {}
  const stateNullChecks = [
    ['polling_units', 'state'],
    ['news_signals', 'state'],
    ['election_results', 'state'],
    ['health_facilities', 'state'],
    ['economic_indicators', 'state'],
  ]
  for (const [tbl, col] of stateNullChecks) {
    const { count, error } = await supabase
      .from(tbl)
      .select('*', { count: 'exact', head: true })
      .is(col, null)
    if (error) { warn(`${tbl}.${col} null check`, error.message); continue }
    JSON_RESULTS.missingStateInfo[`${tbl}.${col}`] = count
    if (count > 0) warn(`${tbl} missing ${col}`, `${count} records have NULL ${col}`)
    else pass(`${tbl} ${col} completeness`, 'All records have state info')
  }

  // 7. Verify that all states in incidents/elections/health match known SW states
  console.log('\n--- State Value Consistency ---')
  const expectedStates = ['LAGOS', 'OGUN', 'OYO', 'OSUN', 'ONDO', 'EKITI']
  const stateCheckTables = [
    ['polling_units', 'state'],
    ['news_signals', 'state'],
    ['election_results', 'state'],
    ['health_facilities', 'state'],
  ]
  for (const [tbl, col] of stateCheckTables) {
    const rows = await loadAll(tbl, col)
    const stateSet = new Set(rows.map(r => r[col]).filter(Boolean))
    const unexpectedStates = [...stateSet].filter(s => !expectedStates.includes(s.toUpperCase()))
    JSON_RESULTS[`states_${tbl}`] = [...stateSet].sort()
    if (unexpectedStates.length > 0) {
      warn(`${tbl} unexpected states`, `${unexpectedStates.join(', ')} not in expected SW states`)
    } else if (stateSet.size > 0) {
      pass(`${tbl} state values`, `All states in expected set: ${expectedStates.join(', ')}`)
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
  const reportFile = path.join(REPORT_DIR, 'audit-overlaps.json')
  fs.writeFileSync(reportFile, JSON.stringify(JSON_RESULTS, null, 2))
  console.log(`\nReport written to ${reportFile}`)

  process.exit(RESULTS.critical.length > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
