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
  console.log('=== Compute Risk Scores ===\n')

  console.log('Loading incidents...')
  const incidents = await loadAll('acled_incidents', 'polling_unit_id, fatalities')
  console.log(`  ${incidents.length} incidents`)

  const counts = {}
  for (const inc of incidents) {
    if (!inc.polling_unit_id) continue
    if (!counts[inc.polling_unit_id]) counts[inc.polling_unit_id] = { count: 0, hasFatalities: false }
    counts[inc.polling_unit_id].count++
    if (inc.fatalities > 0) counts[inc.polling_unit_id].hasFatalities = true
  }

  const highPUIds = []
  const mediumPUIds = []
  for (const [puId, d] of Object.entries(counts)) {
    if (d.count >= 3 || d.hasFatalities) highPUIds.push(puId)
    else if (d.count >= 1) mediumPUIds.push(puId)
  }

  console.log(`  ${highPUIds.length} high-risk, ${mediumPUIds.length} medium-risk PUs`)

  // Reset all to low
  console.log('\nResetting all PUs to low...')
  const { error: re } = await supabase.from('polling_units').update({ risk_score: 'low' }).neq('risk_score', 'low')
  if (re) console.error('  Reset error:', re.message)
  else console.log('  Done')

  // Bulk update high-risk
  if (highPUIds.length > 0) {
    console.log(`\nSetting ${highPUIds.length} PUs to high...`)
    for (let i = 0; i < highPUIds.length; i += 100) {
      const batch = highPUIds.slice(i, i + 100)
      const { error } = await supabase.from('polling_units').update({ risk_score: 'high' }).in('id', batch)
      if (error) console.error('  High batch error:', error.message)
    }
    console.log('  Done')
  }

  // Bulk update medium-risk
  if (mediumPUIds.length > 0) {
    console.log(`\nSetting ${mediumPUIds.length} PUs to medium...`)
    for (let i = 0; i < mediumPUIds.length; i += 100) {
      const batch = mediumPUIds.slice(i, i + 100)
      const { error } = await supabase.from('polling_units').update({ risk_score: 'medium' }).in('id', batch)
      if (error) console.error('  Medium batch error:', error.message)
    }
    console.log('  Done')
  }

  // Verify
  const { count: th } = await supabase.from('polling_units').select('*', { count: 'exact', head: true }).eq('risk_score', 'high')
  const { count: tm } = await supabase.from('polling_units').select('*', { count: 'exact', head: true }).eq('risk_score', 'medium')
  console.log(`\nFinal: High=${th}, Medium=${tm}`)
  console.log('Done!')
}

main().catch(err => { console.error(err); process.exit(1) })
