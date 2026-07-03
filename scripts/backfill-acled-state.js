require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('=== Backfill acled_incidents.state from polling_units ===\n')

  // Load all PUs into a map
  console.log('Loading polling units...')
  const puMap = {}
  let from = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase
      .from('polling_units')
      .select('id, state')
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    data.forEach(p => puMap[p.id] = p.state)
    from += data.length
  }
  console.log(`  Loaded ${Object.keys(puMap).length} polling units`)

  // Load all incidents without state
  console.log('\nLoading incidents without state...')
  const incidents = []
  from = 0
  while (true) {
    const { data, error } = await supabase
      .from('acled_incidents')
      .select('id, polling_unit_id')
      .is('state', null)
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    incidents.push(...data)
    from += data.length
  }
  console.log(`  Found ${incidents.length} incidents to backfill`)

  if (incidents.length === 0) {
    console.log('\nNothing to backfill. Done!')
    return
  }

  // Update in batches
  let updated = 0
  for (let i = 0; i < incidents.length; i += 500) {
    const batch = incidents.slice(i, i + 500)
    for (const inc of batch) {
      const state = puMap[inc.polling_unit_id]
      if (state) {
        const { error } = await supabase
          .from('acled_incidents')
          .update({ state })
          .eq('id', inc.id)
        if (!error) updated++
      }
    }
    console.log(`  Updated ${updated}/${incidents.length}`)
  }

  console.log(`\nDone! Backfilled ${updated} incidents.`)

  // Verify
  const { count: withState } = await supabase
    .from('acled_incidents')
    .select('*', { count: 'exact', head: true })
    .not('state', 'is', null)
  const { count: total } = await supabase
    .from('acled_incidents')
    .select('*', { count: 'exact', head: true })
  console.log(`\nVerification: ${withState}/${total} incidents now have state`)
}

main().catch(console.error)
