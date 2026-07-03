require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`))
        }
      })
    }).on('error', reject)
  })
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestPollingUnit(lat, lng, pollingUnits, maxDist = 5) {
  let nearest = null
  let minDist = Infinity
  for (const pu of pollingUnits) {
    const dist = haversineDistance(lat, lng, pu.lat, pu.lng)
    if (dist < minDist && dist <= maxDist) {
      minDist = dist
      nearest = pu
    }
  }
  return nearest
}

async function main() {
  console.log('=== Seed WarScope Events ===')

  // Load polling units with state
  console.log('Loading polling units...')
  const { data: pollingUnits } = await supabase.from('polling_units').select('id, lat, lng, state')
  console.log(`  Loaded ${pollingUnits.length} polling units`)

  // Fetch WarScope events for Nigeria
  console.log('\nFetching WarScope events...')
  const events = []

  try {
    const data = await fetchJson('https://warscope.net/api/events?theater=nigeria&days=90&type=battles&limit=500')
    if (data && data.events) {
      events.push(...data.events)
      console.log(`  Found ${data.events.length} battle events`)
    }
  } catch (err) {
    console.error(`  Error fetching battles: ${err.message}`)
  }

  try {
    const data = await fetchJson('https://warscope.net/api/events?theater=nigeria&days=90&type=protests&limit=500')
    if (data && data.events) {
      events.push(...data.events)
      console.log(`  Found ${data.events.length} protest events`)
    }
  } catch (err) {
    console.error(`  Error fetching protests: ${err.message}`)
  }

  try {
    const data = await fetchJson('https://warscope.net/api/events?theater=nigeria&days=90&type=atrocities&limit=500')
    if (data && data.events) {
      events.push(...data.events)
      console.log(`  Found ${data.events.length} atrocity events`)
    }
  } catch (err) {
    console.error(`  Error fetching atrocities: ${err.message}`)
  }

  console.log(`\nTotal WarScope events: ${events.length}`)

  // Match to polling units and insert
  const incidents = []
  for (const event of events) {
    if (!event.location || !event.location.lat || !event.location.lon) continue
    const nearest = findNearestPollingUnit(event.location.lat, event.location.lon, pollingUnits)
    if (nearest) {
      incidents.push({
        id: `warscope-${event.date}-${event.type}-${Math.random().toString(36).slice(2, 8)}`,
        polling_unit_id: nearest.id,
        event_date: event.date,
        event_type: event.type || 'Unknown',
        sub_event_type: event.theater || '',
        description: event.description || '',
        fatalities: event.fatalities || 0,
        source: 'WarScope',
        state: nearest.state,
      })
    }
  }

  console.log(`Matched ${incidents.length} events to polling units`)

  if (incidents.length > 0) {
    const { error } = await supabase.from('acled_incidents').upsert(incidents, { onConflict: 'id' })
    if (error) console.error('Insert error:', error.message)
    else console.log(`Inserted ${incidents.length} WarScope events`)
  }

  console.log('Done!')
}

main().catch(console.error)
