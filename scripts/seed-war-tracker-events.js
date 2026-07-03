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
  console.log('=== Seed War-Tracker Events ===')

  console.log('Loading polling units...')
  const { data: pollingUnits } = await supabase.from('polling_units').select('id, lat, lng, state')
  console.log(`  Loaded ${pollingUnits.length} polling units`)

  console.log('\nFetching War-Tracker events for Nigeria...')
  const incidents = []
  let cursor = null

  try {
    let url = 'https://war-tracker.com/api/v1/events?country=NG&limit=200'
    if (cursor) url += `&cursor=${cursor}`

    const data = await fetchJson(url)
    const events = data.events || []
    console.log(`  Found ${events.length} events`)

    for (const event of events) {
      if (!event.lat || !event.lon) continue
      const nearest = findNearestPollingUnit(event.lat, event.lon, pollingUnits)
      if (nearest) {
        incidents.push({
          id: `wartracker-${event.id}`,
          polling_unit_id: nearest.id,
          event_date: event.timestamp ? event.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
          event_type: event.event_type || 'Unknown',
          sub_event_type: event.confidence || '',
          description: event.source_url || '',
          fatalities: 0,
          source: 'War-Tracker',
          state: nearest.state,
        })
      }
    }
  } catch (err) {
    console.error(`  Error: ${err.message}`)
  }

  console.log(`\nMatched ${incidents.length} events to polling units`)

  if (incidents.length > 0) {
    const { error } = await supabase.from('acled_incidents').upsert(incidents, { onConflict: 'id' })
    if (error) console.error('Insert error:', error.message)
    else console.log(`Inserted ${incidents.length} War-Tracker events`)
  }

  console.log('Done!')
}

main().catch(console.error)
