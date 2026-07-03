require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const STATE_DENSITIES = {
  LAGOS: { density: 2470 },
  OGUN:  { density: 210 },
  OYO:   { density: 180 },
  OSUN:  { density: 190 },
  ONDO:  { density: 210 },
  EKITI: { density: 350 },
}

async function loadAllPUIds() {
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
  return all
}

async function main() {
  console.log('=== Seed Population Density ===')

  // Delete existing
  const { error: delErr } = await supabase
    .from('population_density')
    .delete()
    .filter('id', 'neq', '00000000-0000-0000-0000-000000000000')
  if (delErr) console.error('Delete error:', delErr.message)
  else console.log('Cleared existing')

  console.log('Loading PUs...')
  const pus = await loadAllPUIds()
  console.log(`  ${pus.length} PUs`)

  const BATCH_SIZE = 2000
  let total = 0

  for (let i = 0; i < pus.length; i += BATCH_SIZE) {
    const batch = pus.slice(i, i + BATCH_SIZE).map(pu => ({
      id: crypto.randomUUID(),
      polling_unit_id: pu.id,
      population_count: null,
      density_per_sq_km: STATE_DENSITIES[pu.state]?.density || 200,
      source: 'WorldPop/NPopC 2006',
    }))

    const { error } = await supabase.from('population_density').insert(batch)
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} error:`, error.message)
      break
    }
    total += batch.length
    console.log(`  Inserted ${total}/${pus.length}`)
  }

  console.log(`\nDone! ${total} records`)
}

main().catch(console.error)
