require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const NIGERIA_LAT_MIN = 4
const NIGERIA_LAT_MAX = 14
const NIGERIA_LNG_MIN = 2.7  // Western border allows ~2.7°E
const NIGERIA_LNG_MAX = 15

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

async function deleteInvalidPollingUnits() {
  console.log('=== Step 1: Delete invalid polling units ===')
  console.log('Identifying PUs with coordinates clearly outside Nigeria...\n')

  // Find the bad PU IDs
  const allPUs = await loadAll('polling_units', 'id, lat, lng')
  console.log(`  Total PUs: ${allPUs.length}`)

  const invalid = allPUs.filter(pu => {
    const lat = parseFloat(pu.lat)
    const lng = parseFloat(pu.lng)
    return lat < NIGERIA_LAT_MIN || lat > NIGERIA_LAT_MAX ||
           lng < NIGERIA_LNG_MIN || lng > NIGERIA_LNG_MAX
  })

  console.log(`  Invalid PUs to delete: ${invalid.length}`)

  // Show breakdown
  const lowLat = invalid.filter(p => p.lat < NIGERIA_LAT_MIN).length
  const highLat = invalid.filter(p => p.lat > NIGERIA_LAT_MAX).length
  const lowLng = invalid.filter(p => p.lng < NIGERIA_LNG_MIN).length
  const highLng = invalid.filter(p => p.lng > NIGERIA_LNG_MAX).length
  console.log(`    lat < ${NIGERIA_LAT_MIN}: ${lowLat}`)
  console.log(`    lat > ${NIGERIA_LAT_MAX}: ${highLat}`)
  console.log(`    lng < ${NIGERIA_LNG_MIN}: ${lowLng}`)
  console.log(`    lng > ${NIGERIA_LNG_MAX}: ${highLng}`)

  if (invalid.length === 0) {
    console.log('  No invalid PUs found. Skipping.\n')
    return
  }

  const invalidIds = invalid.map(p => p.id)

  // 1. Delete population_density records linked to invalid PUs
  console.log('\n  Deleting population_density records...')
  let deleted = 0
  for (let i = 0; i < invalidIds.length; i += 100) {
    const batch = invalidIds.slice(i, i + 100)
    const { error } = await supabase
      .from('population_density')
      .delete()
      .in('polling_unit_id', batch)
    if (error) console.error(`    Error: ${error.message}`)
    else deleted += batch.length
  }
  console.log(`    Deleted ${deleted} density records`)

  // 2. Delete acled_incidents linked to invalid PUs
  console.log('\n  Deleting acled_incidents...')
  deleted = 0
  for (let i = 0; i < invalidIds.length; i += 100) {
    const batch = invalidIds.slice(i, i + 100)
    const { error } = await supabase
      .from('acled_incidents')
      .delete()
      .in('polling_unit_id', batch)
    if (error) console.error(`    Error: ${error.message}`)
  }
  // Count remaining incidents linked to valid PUs
  const { count: remaining } = await supabase
    .from('acled_incidents')
    .select('*', { count: 'exact', head: true })
    .not('polling_unit_id', 'is', null)
  console.log(`    Remaining incidents with PU link: ${remaining}`)

  // 3. Delete the invalid PUs themselves
  console.log('\n  Deleting invalid polling units...')
  deleted = 0
  for (let i = 0; i < invalidIds.length; i += 100) {
    const batch = invalidIds.slice(i, i + 100)
    const { error } = await supabase
      .from('polling_units')
      .delete()
      .in('id', batch)
    if (error) console.error(`    Error: ${error.message}`)
    else deleted += batch.length
  }
  console.log(`    Deleted ${deleted} PUs`)

  // Verify
  const { count: remainingPUs } = await supabase
    .from('polling_units')
    .select('*', { count: 'exact', head: true })
  console.log(`\n  Remaining PUs: ${remainingPUs}`)
  console.log('  Done.\n')
}

async function deduplicateNewsURLs() {
  console.log('=== Step 2: Deduplicate news_signals by URL ===')

  const allNews = await loadAll('news_signals', 'id, url, published_at')
  console.log(`  Total news records: ${allNews.length}`)

  // Group by URL
  const byURL = {}
  for (const r of allNews) {
    if (!r.url) continue
    if (!byURL[r.url]) byURL[r.url] = []
    byURL[r.url].push(r)
  }

  const dupes = Object.entries(byURL).filter(([, recs]) => recs.length > 1)
  console.log(`  Duplicate URLs found: ${dupes.length}`)

  if (dupes.length === 0) {
    console.log('  No duplicates. Skipping.\n')
    return
  }

  let totalDeleted = 0
  for (const [url, recs] of dupes) {
    // Keep the one with the earliest published_at (or first inserted)
    recs.sort((a, b) => {
      if (a.published_at && b.published_at) return new Date(a.published_at) - new Date(b.published_at)
      return 0
    })
    const keep = recs[0]
    const deleteIds = recs.slice(1).map(r => r.id)

    for (const id of deleteIds) {
      const { error } = await supabase
        .from('news_signals')
        .delete()
        .eq('id', id)
      if (!error) totalDeleted++
    }
  }

  console.log(`  Deleted ${totalDeleted} duplicate records`)
  const { count: remaining } = await supabase
    .from('news_signals')
    .select('*', { count: 'exact', head: true })
  console.log(`  Remaining news records: ${remaining}`)
  console.log('  Done.\n')
}

async function main() {
  console.log('========================================')
  console.log(' DATA INTEGRITY CLEANUP')
  console.log('========================================\n')

  await deleteInvalidPollingUnits()
  await deduplicateNewsURLs()

  console.log('========================================')
  console.log(' CLEANUP COMPLETE')
  console.log('========================================')
  console.log('')
  console.log('Next: Run `npm run audit:all` to verify fixes.')
}

main().catch(err => { console.error(err); process.exit(1) })
