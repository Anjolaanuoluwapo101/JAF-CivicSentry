require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status === 429 && attempt < retries) {
        const wait = attempt * 5000
        console.log(`    429 on ${url.substring(0, 60)}... retrying in ${wait}ms`)
        await sleep(wait)
        continue
      }
      if (response.status === 504 && attempt < retries) {
        const wait = attempt * 3000
        console.log(`    504 on ${url.substring(0, 60)}... retrying in ${wait}ms`)
        await sleep(wait)
        continue
      }
      return response
    } catch (err) {
      if (attempt < retries) {
        console.log(`    ${err.message}, retrying (${attempt}/${retries})...`)
        await sleep(attempt * 3000)
        continue
      }
      throw err
    }
  }
}

// ── Health Facilities: OpenStreetMap Overpass API ──
async function seedHealthFacilities() {
  console.log('\n--- Health Facilities (OpenStreetMap Overpass) ---')

  const healthFacilities = []
  const states = [
    { name: 'Lagos', query: 'Lagos' },
    { name: 'Ogun', query: 'Ogun' },
    { name: 'Oyo', query: 'Oyo' },
    { name: 'Osun', query: 'Osun' },
    { name: 'Ondo', query: 'Ondo' },
    { name: 'Ekiti', query: 'Ekiti' },
  ]

  for (const state of states) {
    const overpassQuery = `[out:json][timeout:120];area["name"="${state.query}"]["admin_level"="4"]->.searchArea;(node["amenity"="hospital"](area.searchArea);node["amenity"="clinic"](area.searchArea);way["amenity"="hospital"](area.searchArea);way["amenity"="clinic"](area.searchArea););out center;`

    try {
      console.log(`  Querying ${state.name}...`)
      const response = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CivicSentry/1.0 (research project)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(130000),
      })

      if (response.ok) {
        const data = await response.json()
        const elements = data.elements || []
        console.log(`    Found ${elements.length} facilities`)

        for (const el of elements) {
          const lat = el.lat || el.center?.lat
          const lng = el.lon || el.center?.lon
          if (!lat || !lng || lat < 4 || lat > 14 || lng < 2.7 || lng > 15) continue

          healthFacilities.push({
            id: crypto.randomUUID(),
            name: el.tags?.name || el.tags?.['name:en'] || `Unnamed ${el.tags?.amenity || 'facility'}`,
            alt_name: el.tags?.['name:short'] || null,
            type: el.tags?.amenity || 'clinic',
            category: el.tags?.['healthcare'] || el.tags?.amenity || null,
            ownership: el.tags?.operator_type || null,
            functional_status: el.tags?.operational_status || null,
            state: state.name.toUpperCase(),
            lga: el.tags?.['addr:district'] || el.tags?.['addr:city'] || '',
            ward: '',
            lat,
            lng,
          })
        }
      } else {
        const body = await response.text()
        console.error(`    Error ${response.status}: ${body.substring(0, 100)}`)
      }
    } catch (err) {
      console.error(`    ${state.name}: ${err.message}`)
    }

    await sleep(3000)
  }

  console.log(`\nTotal: ${healthFacilities.length} facilities`)

  if (healthFacilities.length > 0) {
    const BATCH_SIZE = 500
    let inserted = 0
    for (let i = 0; i < healthFacilities.length; i += BATCH_SIZE) {
      const batch = healthFacilities.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('health_facilities').upsert(batch, { onConflict: 'id' })
      if (error) console.error(`  Batch error:`, error.message)
      else { inserted += batch.length; console.log(`  Inserted ${inserted}/${healthFacilities.length}`) }
    }
  }
}

async function main() {
  console.log('=== Seed Nigerian Data (Real APIs) ===')
  console.log('  Seeding: health_facilities only')
  console.log('  Note: population_density and satellite_captures have dedicated seed scripts')

  await seedHealthFacilities()

  console.log('\nDone!')
}

main().catch(console.error)
