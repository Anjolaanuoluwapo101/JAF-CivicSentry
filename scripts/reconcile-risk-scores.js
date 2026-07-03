require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function loadAll(table, select) {
  const all = []
  let from = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    from += limit
  }
  return all
}

async function main() {
  console.log('=== Reconcile Risk Scores ===')
  console.log('One-time pass: fix mismatches between risk_score and actual incidents\n')

  console.log('Loading polling units...')
  const pus = await loadAll('polling_units', 'id, risk_score')
  console.log(`  ${pus.length} PUs`)

  console.log('Loading all incidents...')
  const incidents = await loadAll('acled_incidents', 'polling_unit_id, fatalities')
  console.log(`  ${incidents.length} incidents`)

  const counts = {}
  for (const inc of incidents) {
    if (!inc.polling_unit_id) continue
    if (!counts[inc.polling_unit_id]) counts[inc.polling_unit_id] = { count: 0, hasFatalities: false }
    counts[inc.polling_unit_id].count++
    if (inc.fatalities > 0) counts[inc.polling_unit_id].hasFatalities = true
  }

  const fixes = []
  for (const pu of pus) {
    const d = counts[pu.id] || { count: 0, hasFatalities: false }
    let expected = 'low'
    if (d.count >= 3 || d.hasFatalities) expected = 'high'
    else if (d.count >= 1) expected = 'medium'

    if (pu.risk_score !== expected) {
      fixes.push({ id: pu.id, from: pu.risk_score, to: expected, count: d.count, hasFatalities: d.hasFatalities })
    }
  }

  console.log(`\nMismatches found: ${fixes.length}`)
  console.log('\nBreakdown:')
  const falseHigh = fixes.filter(f => f.from === 'high' && f.to !== 'high').length
  const falseLow = fixes.filter(f => f.to === 'high' && f.from !== 'high').length
  const falseMedium = fixes.filter(f => f.to === 'medium' && f.from !== 'medium').length
  console.log(`  False High (marked high, no justification): ${falseHigh}`)
  console.log(`  False Low (should be high, marked lower):  ${falseLow}`)
  console.log(`  False Medium (should be, but not):         ${falseMedium}`)

  if (fixes.length === 0) {
    console.log('\nNo fixes needed. All risk scores are consistent.')
    return
  }

  console.log('\nFirst 20 mismatches:')
  for (const f of fixes.slice(0, 20)) {
    console.log(`  ${f.id}: ${f.from} -> ${f.to} (${f.count} incidents, fatalities=${f.hasFatalities})`)
  }

  console.log('\nApplying fixes...')
  let applied = 0
  for (const f of fixes) {
    const { error } = await supabase.from('polling_units').update({ risk_score: f.to }).eq('id', f.id)
    if (!error) applied++
  }
  console.log(`  Fixed ${applied}/${fixes.length} PUs`)

  if (applied < fixes.length) {
    console.log(`  ${fixes.length - applied} failures`)
    process.exit(1)
  }

  console.log('\nDone! All risk scores reconciled.')
}

main().catch(err => { console.error(err); process.exit(1) })
