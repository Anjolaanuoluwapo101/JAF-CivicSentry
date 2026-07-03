require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENTINEL_CLIENT_ID = process.env.SENTINEL_HUB_CLIENT_ID
const SENTINEL_CLIENT_SECRET = process.env.SENTINEL_HUB_CLIENT_SECRET

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getSentinelToken() {
  console.log('Authenticating with Sentinel Hub...')
  const response = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SENTINEL_CLIENT_ID,
      client_secret: SENTINEL_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sentinel Hub auth failed: ${response.status} - ${text}`)
  }

  const data = await response.json()
  console.log('  Token obtained, expires in', data.expires_in, 'seconds')
  return data.access_token
}

async function fetchSentinelScenes(token, bbox, datetime) {
  const url = `https://sh.dataspace.copernicus.eu/api/v1/catalog/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-2' and OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((${bbox}))') and ContentDate/Start gt ${datetime}T00:00:00.000Z and Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value lt 30)&$orderby=ContentDate/Start desc&$top=10`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Catalog API error: ${response.status}`)
  }

  return response.json()
}

function bboxString(lng, lat, delta = 0.05) {
  return `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Key urban centers in South West Nigeria
const COVERAGE_AREAS = [
  { state: 'LAGOS', lat: 6.45, lng: 3.40, name: 'Lagos Island' },
  { state: 'LAGOS', lat: 6.60, lng: 3.35, name: 'Ikeja' },
  { state: 'LAGOS', lat: 6.52, lng: 3.36, name: 'Surulere' },
  { state: 'LAGOS', lat: 6.57, lng: 3.25, name: 'Alimosho' },
  { state: 'OGUN', lat: 7.15, lng: 3.35, name: 'Abeokuta' },
  { state: 'OGUN', lat: 6.69, lng: 3.23, name: 'Sango Ota' },
  { state: 'OYO', lat: 7.40, lng: 3.90, name: 'Ibadan Central' },
  { state: 'OYO', lat: 8.13, lng: 4.18, name: 'Ogbomoso' },
  { state: 'OSUN', lat: 7.77, lng: 4.56, name: 'Osogbo' },
  { state: 'OSUN', lat: 7.48, lng: 4.56, name: 'Ile-Ife' },
  { state: 'ONDO', lat: 7.25, lng: 5.20, name: 'Akure' },
  { state: 'ONDO', lat: 7.08, lng: 4.84, name: 'Ondo City' },
  { state: 'EKITI', lat: 7.62, lng: 5.22, name: 'Ado-Ekiti' },
  { state: 'EKITI', lat: 7.50, lng: 5.23, name: 'Ikere-Ekiti' },
]

async function main() {
  console.log('=== Seed Satellite Captures (Real Sentinel Hub Data) ===')

  if (!SENTINEL_CLIENT_ID || !SENTINEL_CLIENT_SECRET) {
    console.error('ERROR: SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET must be set in .env.local')
    process.exit(1)
  }

  const token = await getSentinelToken()

  const allCaptures = []

  for (const area of COVERAGE_AREAS) {
    console.log(`\nFetching scenes for ${area.name} (${area.state})...`)

    try {
      const bbox = bboxString(area.lng, area.lat)
      const result = await fetchSentinelScenes(token, bbox, '2024-01-01')
      const products = result.value || []
      console.log(`  Found ${products.length} scenes`)

      for (const product of products) {
        const date = product.ContentDate?.Start?.split('T')[0] || new Date().toISOString().split('T')[0]
        const cloudCover = product.Attributes?.find(a => a.Name === 'cloudCover')?.Value || 0
        const ndvi = product.Attributes?.find(a => a.Name === 'ndvi')?.Value || 0
        const sha = await sha256(product.Id || `${area.state}-${date}`)

        allCaptures.push({
          id: `sat-${area.state.toLowerCase()}-${date}-${sha.slice(0, 8)}`,
          lat: area.lat,
          lng: area.lng,
          capture_date: date,
          cloud_cover: cloudCover,
          ndvi: ndvi,
          image_url: `https://sh.dataspace.copernicus.eu/ogc/wms/${product.Id}`,
          sha256_hash: sha,
          source: 'Sentinel-2',
        })
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }
  }

  console.log(`\nTotal captures: ${allCaptures.length}`)

  if (allCaptures.length > 0) {
    const BATCH_SIZE = 500
    let inserted = 0
    for (let i = 0; i < allCaptures.length; i += BATCH_SIZE) {
      const batch = allCaptures.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('satellite_captures').upsert(batch, { onConflict: 'id' })
      if (error) console.error(`  Batch error:`, error.message)
      else {
        inserted += batch.length
        console.log(`  Inserted ${inserted}/${allCaptures.length}`)
      }
    }
  } else {
    console.log('No captures found. Check Sentinel Hub credentials.')
  }

  console.log('Done!')
}

main().catch(console.error)
