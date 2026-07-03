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

async function countRows(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = q.match(filter)
  const { count, error } = await q
  if (error) { critical(`${table} count`, error.message); return -1 }
  return count
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

async function checkOrphanedFKs(childTable, fkCol) {
  const children = await loadAll(childTable, fkCol)
  const fkValues = children.map(r => r[fkCol]).filter(v => v != null)
  const uniqueFKs = [...new Set(fkValues)]
  if (uniqueFKs.length === 0) { pass(`${childTable}.${fkCol} orphaned FKs`, 'No non-null FK values'); return 0 }
  const allParents = await loadAll('polling_units', 'id')
  const parentSet = new Set(allParents.map(p => p.id))
  const orphans = uniqueFKs.filter(id => !parentSet.has(id))
  if (orphans.length === 0) pass(`${childTable}.${fkCol} orphaned FKs`, `0 of ${uniqueFKs.length} FK values orphaned`)
  else critical(`${childTable}.${fkCol} orphaned FKs`, `${orphans.length} of ${uniqueFKs.length} FK values reference non-existent polling_units (e.g. ${orphans.slice(0, 5).join(', ')})`)
  return orphans.length
}

async function checkDuplicateValues(table, col, label) {
  const rows = await loadAll(table, col)
  const counts = {}
  for (const r of rows) {
    const val = r[col]
    if (val == null) continue
    counts[val] = (counts[val] || 0) + 1
  }
  const dupes = Object.entries(counts).filter(([, c]) => c > 1)
  if (dupes.length === 0) { pass(`${table}.${col} uniqueness`, `No duplicate ${label} found`); return }
  const total = dupes.reduce((s, [, c]) => s + c, 0)
  warn(`${table}.${col} uniqueness`, `${dupes.length} ${label}(s) appear ${total} times (duplicates)`);
  [...dupes].slice(0, 10).forEach(([val, c]) => console.log(`         ${val}: ${c}x`))
}

async function run() {
  console.log('========================================')
  console.log(' AUDIT: Data Mixing & Schema Integrity')
  console.log('========================================\n')

  JSON_RESULTS.tables = {}
  JSON_RESULTS.orphanedFKs = {}
  JSON_RESULTS.sourceMixing = {}
  JSON_RESULTS.nulls = {}
  JSON_RESULTS.duplicates = {}
  JSON_RESULTS.dateOutliers = {}

  // 1. TABLE ROW COUNTS
  console.log('--- Table Row Counts ---')
  const TABLES = [
    'polling_units', 'acled_incidents', 'election_results',
    'satellite_captures', 'news_signals', 'incident_reports',
    'subscriptions', 'health_facilities', 'power_outages',
    'population_density', 'economic_indicators',
  ]
  for (const t of TABLES) {
    const c = await countRows(t)
    JSON_RESULTS.tables[t] = c
    if (c === 0) warn(`${t} row count`, 'Table is empty')
    else if (c > 0) pass(`${t} row count`, `${c.toLocaleString()} rows`)
  }

  // 2. SOURCE MIXING - acled_incidents
  console.log('\n--- Source Mixing: acled_incidents ---')
  const acledRows = await loadAll('acled_incidents', 'source')
  const sourceCounts = {}
  for (const r of acledRows) {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1
  }
  const totalAcled = acledRows.length
  JSON_RESULTS.sourceMixing.acled_incidents = sourceCounts
  if (totalAcled === 0) warn('acled_incidents sources', 'No records')
  else {
    const sources = Object.keys(sourceCounts)
    pass('acled_incidents sources', `${sources.length} source(s): ${sources.join(', ')}`)
    for (const [src, cnt] of Object.entries(sourceCounts)) {
      console.log(`         ${src}: ${cnt} (${(cnt/totalAcled*100).toFixed(1)}%)`)
    }
    const expected = ['ACLED (HDX)', 'WarScope', 'War-Tracker']
    const unknown = sources.filter(s => !expected.includes(s))
    if (unknown.length > 0) warn('acled_incidents unexpected sources', `${unknown.join(', ')} not in expected list`)
    else pass('acled_incidents source validity', 'All sources match expected values')
  }

  // 3. SOURCE MIXING - news_signals
  console.log('\n--- Source Mixing: news_signals ---')
  const newsRows = await loadAll('news_signals', 'source_domain, headline')
  const domainCounts = {}
  for (const r of newsRows) {
    const d = r.source_domain || 'NULL'
    domainCounts[d] = (domainCounts[d] || 0) + 1
  }
  const totalNews = newsRows.length
  JSON_RESULTS.sourceMixing.news_signals = domainCounts
  if (totalNews === 0) warn('news_signals sources', 'No records')
  else {
    const domains = Object.keys(domainCounts)
    pass('news_signals sources', `${domains.length} source domain(s)`)
    for (const [d, cnt] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`         ${d}: ${cnt} (${(cnt/totalNews*100).toFixed(1)}%)`)
    }
    if (domainCounts['NULL']) warn('news_signals NULL source_domain', `${domainCounts['NULL']} records have NULL source_domain`)
  }

  // 4. ELECTION RESULTS - data_quality + year cross-tab
  console.log('\n--- Election Results: Data Quality ---')
  const electionRows = await loadAll('election_results', 'election_year, data_quality, state')
  const yearQuality = {}
  for (const r of electionRows) {
    const key = `${r.election_year}|${r.data_quality}`
    yearQuality[key] = (yearQuality[key] || 0) + 1
  }
  JSON_RESULTS.sourceMixing.election_results = yearQuality
  if (electionRows.length === 0) warn('election_results data_quality', 'No records')
  else {
    console.log('         Year | Quality         | Count')
    console.log('         ' + '-'.repeat(40))
    for (const [key, cnt] of Object.entries(yearQuality).sort()) {
      const [year, quality] = key.split('|')
      console.log(`         ${year} | ${quality.padEnd(15)} | ${cnt}`)
    }
    // Check for pollin_unit_id null vs not null per quality level
    const detailed = await loadAll('election_results', 'election_year, data_quality, polling_unit_id')
    const stateLevel = detailed.filter(r => r.data_quality === 'state_level_only')
    const stateLevelWithPU = stateLevel.filter(r => r.polling_unit_id != null)
    if (stateLevelWithPU.length > 0) warn('election_results state_level quality with PU', `${stateLevelWithPU.length} state_level_only records have polling_unit_id`)
    else pass('election_results state_level_only no PU', 'All state_level_only records have null polling_unit_id')

    const complete = detailed.filter(r => r.data_quality === 'complete')
    const completeNullPU = complete.filter(r => r.polling_unit_id == null)
    if (completeNullPU.length > 0) warn('election_results complete quality null PU', `${completeNullPU.length} complete quality records have null polling_unit_id`)
    else pass('election_results complete quality with PU', 'All complete records have a polling_unit_id')
  }

  // 5. QUALITY CHECK: unexpected data_quality values
  const qualities = new Set(electionRows.map(r => r.data_quality).filter(Boolean))
  const validQualities = ['complete', 'partial', 'state_level_only']
  const unexpectedQuality = [...qualities].filter(q => !validQualities.includes(q))
  if (unexpectedQuality.length > 0) critical('election_results data_quality values', `Unexpected: ${unexpectedQuality.join(', ')}`)
  else pass('election_results data_quality values', `All values in expected set: ${validQualities.join(', ')}`)

  // 6. ORPHANED FKs
  console.log('\n--- Orphaned Foreign Keys ---')
  const fkChecks = [
    ['acled_incidents', 'polling_unit_id'],
    ['election_results', 'polling_unit_id'],
    ['satellite_captures', 'polling_unit_id'],
    ['news_signals', 'polling_unit_id'],
    ['population_density', 'polling_unit_id'],
  ]
  let totalOrphans = 0
  for (const [tbl, col] of fkChecks) {
    const o = await checkOrphanedFKs(tbl, col)
    JSON_RESULTS.orphanedFKs[`${tbl}.${col}`] = o
    totalOrphans += o
  }
  if (totalOrphans > 0) critical('total orphans', `${totalOrphans} total orphaned FK references across all tables`)

  // 7. NULL required columns
  console.log('\n--- NULL Required Columns ---')
  const nullChecks = [
    ['polling_units', 'name'],
    ['polling_units', 'lat'],
    ['polling_units', 'lng'],
    ['election_results', 'election_year'],
    ['election_results', 'election_type'],
    ['health_facilities', 'name'],
    ['health_facilities', 'lat'],
    ['health_facilities', 'lng'],
    ['economic_indicators', 'indicator_type'],
  ]
  for (const [tbl, col] of nullChecks) {
    const { count, error } = await supabase
      .from(tbl)
      .select('*', { count: 'exact', head: true })
      .is(col, null)
    if (error) { warn(`${tbl}.${col} null check`, error.message); continue }
    JSON_RESULTS.nulls[`${tbl}.${col}`] = count
    if (count > 0) critical(`${tbl}.${col} NULL`, `${count} rows have NULL ${col}`)
    else pass(`${tbl}.${col} NULL`, 'No NULL values')
  }

  // 8. DUPLICATE IDs in polling_units
  console.log('\n--- Duplicate IDs ---')
  await checkDuplicateValues('polling_units', 'id', 'polling_unit ID')

  // 9. DUPLICATE URLs in news_signals
  await checkDuplicateValues('news_signals', 'url', 'news URL')

  // 10. DATE RANGE OUTLIERS
  console.log('\n--- Date Range Outliers ---')
  const dateChecks = [
    ['acled_incidents', 'event_date', { value: '1997-01-01', type: 'date' }, { value: '2026-12-31', type: 'date' }],
    ['election_results', 'election_year', { value: 1999, type: 'number' }, { value: 2023, type: 'number' }],
  ]
  for (const [tbl, col, min, max] of dateChecks) {
    const { count: before, error: e1 } = await supabase
      .from(tbl)
      .select('*', { count: 'exact', head: true })
      .lt(col, min.value)
    if (e1) { warn(`${tbl} ${col} min check`, e1.message); continue }
    const { count: after, error: e2 } = await supabase
      .from(tbl)
      .select('*', { count: 'exact', head: true })
      .gt(col, max.value)
    if (e2) { warn(`${tbl} ${col} max check`, e2.message); continue }
    JSON_RESULTS.dateOutliers[`${tbl}.${col}`] = { before: before, after: after }
    if (before > 0 || after > 0) critical(`${tbl} ${col} range`, `${before} before ${min.value}, ${after} after ${max.value}`)
    else pass(`${tbl} ${col} range`, `All between ${min.value} and ${max.value}`)
  }

  // -- SUMMARY --
  console.log('\n========================================')
  console.log(' SUMMARY')
  console.log('========================================')
  console.log(`  \x1b[32mPassed:\x1b[0m ${RESULTS.passed.length}`)
  console.log(`  \x1b[33mWarnings:\x1b[0m ${RESULTS.warning.length}`)
  console.log(`  \x1b[31mCritical:\x1b[0m ${RESULTS.critical.length}`)

  // Write JSON report
  JSON_RESULTS.summary = {
    passed: RESULTS.passed.length,
    warning: RESULTS.warning.length,
    critical: RESULTS.critical.length,
    passedDetails: RESULTS.passed,
    warningDetails: RESULTS.warning,
    criticalDetails: RESULTS.critical,
  }
  const reportFile = path.join(REPORT_DIR, 'audit-mixing.json')
  fs.writeFileSync(reportFile, JSON.stringify(JSON_RESULTS, null, 2))
  console.log(`\nReport written to ${reportFile}`)

  process.exit(RESULTS.critical.length > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
