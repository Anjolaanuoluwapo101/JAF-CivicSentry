require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SENTINEL_CLIENT_ID = process.env.SENTINEL_HUB_CLIENT_ID
const SENTINEL_CLIENT_SECRET = process.env.SENTINEL_HUB_CLIENT_SECRET

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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

function findNearestPollingUnit(lat, lng, pollingUnits, maxDist = 10) {
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

function toODataPolygon(lng, lat, delta = 0.05) {
  const minLng = lng - delta
  const maxLng = lng + delta
  const minLat = lat - delta
  const maxLat = lat + delta
  return `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`
}

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
  return { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) }
}

let tokenState = { token: null, expiresAt: 0 }

async function ensureToken() {
  if (!tokenState.token || Date.now() > tokenState.expiresAt - 60000) {
    tokenState = await getSentinelToken()
  }
  return tokenState.token
}

async function fetchSentinelScenes(token, polygonWkt, startDate) {
  const url = `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-2' and OData.CSC.Intersects(area=geography'SRID=4326;${polygonWkt}') and ContentDate/Start gt ${startDate}T00:00:00.000Z and Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value lt 30)&$orderby=ContentDate/Start desc&$top=5&$expand=Attributes`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (response.status === 403) {
      // Token likely expired — refresh and retry once
      console.log('  403 received, refreshing token...')
      const newToken = await ensureToken()
      const retryController = new AbortController()
      const retryTimeout = setTimeout(() => retryController.abort(), 90000)
      try {
        const retryResponse = await fetch(url, {
          headers: { Authorization: `Bearer ${newToken}` },
          signal: retryController.signal,
        })
        clearTimeout(retryTimeout)
        if (!retryResponse.ok) {
          const text = await retryResponse.text()
          console.log(`  Retry error ${retryResponse.status}: ${text.substring(0, 200)}`)
          return []
        }
        const data = await retryResponse.json()
        return data.value || []
      } catch (retryErr) {
        clearTimeout(retryTimeout)
        console.log(`  Retry fetch error: ${retryErr.message}`)
        return []
      }
    }

    if (!response.ok) {
      const text = await response.text()
      console.log(`  API error ${response.status}: ${text.substring(0, 200)}`)
      return []
    }

    const data = await response.json()
    return data.value || []
  } catch (err) {
    clearTimeout(timeout)
    console.log(`  Fetch error: ${err.message}`)
    return []
  }
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function parseProductName(name) {
  // S2B_MSIL1C_20260628T100029_N0512_R122_T31NEH_20260628T140856.SAFE
  const parts = name?.split('_') || []
  return {
    platform: parts[0] === 'S2A' ? 'Sentinel-2A' : parts[0] === 'S2B' ? 'Sentinel-2B' : parts[0],
    productType: parts[1] || null, // MSIL1C or MSIL2A
    orbitNumber: parseInt(parts[3]?.replace('N', '')) || null,
  }
}

// ~100 coverage areas: 2-3 per LGA across all 6 SW states
const COVERAGE_AREAS = [
  // LAGOS (20 LGAs)
  { state: 'LAGOS', lat: 6.45, lng: 3.40, name: 'Lagos Island' },
  { state: 'LAGOS', lat: 6.46, lng: 3.44, name: 'Victoria Island' },
  { state: 'LAGOS', lat: 6.60, lng: 3.35, name: 'Ikeja' },
  { state: 'LAGOS', lat: 6.57, lng: 3.38, name: 'Mushin' },
  { state: 'LAGOS', lat: 6.52, lng: 3.36, name: 'Surulere' },
  { state: 'LAGOS', lat: 6.57, lng: 3.25, name: 'Alimosho' },
  { state: 'LAGOS', lat: 6.47, lng: 3.24, name: 'Agege' },
  { state: 'LAGOS', lat: 6.62, lng: 3.28, name: 'Oshodi-Isolo' },
  { state: 'LAGOS', lat: 6.65, lng: 3.32, name: 'Amuwo-Odofin' },
  { state: 'LAGOS', lat: 6.55, lng: 3.40, name: 'Lagos Mainland' },
  { state: 'LAGOS', lat: 6.50, lng: 3.45, name: 'Apapa' },
  { state: 'LAGOS', lat: 6.58, lng: 3.48, name: 'Eti-Osa' },
  { state: 'LAGOS', lat: 6.70, lng: 3.30, name: 'Ojo' },
  { state: 'LAGOS', lat: 6.44, lng: 3.30, name: 'Ikorodu' },
  { state: 'LAGOS', lat: 6.40, lng: 3.38, name: 'Badagry' },
  { state: 'LAGOS', lat: 6.68, lng: 3.40, name: 'Bede' },
  { state: 'LAGOS', lat: 6.53, lng: 3.32, name: 'Iyana-Ipaja' },
  { state: 'LAGOS', lat: 6.49, lng: 3.35, name: 'Bariga' },
  { state: 'LAGOS', lat: 6.63, lng: 3.35, name: 'Kosofe' },
  { state: 'LAGOS', lat: 6.42, lng: 3.34, name: 'Epe' },

  // OGUN (18 LGAs)
  { state: 'OGUN', lat: 7.15, lng: 3.35, name: 'Abeokuta South' },
  { state: 'OGUN', lat: 7.18, lng: 3.33, name: 'Abeokuta North' },
  { state: 'OGUN', lat: 6.69, lng: 3.23, name: 'Sango Ota' },
  { state: 'OGUN', lat: 6.65, lng: 3.18, name: 'Ifo' },
  { state: 'OGUN', lat: 6.88, lng: 3.12, name: 'Mowe' },
  { state: 'OGUN', lat: 6.95, lng: 3.18, name: 'Sagamu' },
  { state: 'OGUN', lat: 7.05, lng: 3.25, name: 'Ikenne' },
  { state: 'OGUN', lat: 6.82, lng: 3.05, name: 'Ado-Odo/Ota' },
  { state: 'OGUN', lat: 6.98, lng: 3.08, name: 'Odogbolu' },
  { state: 'OGUN', lat: 7.25, lng: 3.15, name: 'Odeda' },
  { state: 'OGUN', lat: 7.20, lng: 3.45, name: 'Obafemi-Owode' },
  { state: 'OGUN', lat: 6.75, lng: 3.00, name: 'Agbado/Oke' },
  { state: 'OGUN', lat: 7.10, lng: 3.50, name: 'Ewekoro' },
  { state: 'OGUN', lat: 6.85, lng: 3.25, name: 'Remo North' },
  { state: 'OGUN', lat: 6.72, lng: 3.30, name: 'Imeko-Afon' },
  { state: 'OGUN', lat: 7.30, lng: 3.20, name: 'Yewa North' },
  { state: 'OGUN', lat: 6.78, lng: 3.15, name: 'Ipokia' },
  { state: 'OGUN', lat: 7.00, lng: 3.35, name: 'Aba-Ketou' },

  // OYO (15 LGAs)
  { state: 'OYO', lat: 7.40, lng: 3.90, name: 'Ibadan North' },
  { state: 'OYO', lat: 7.37, lng: 3.88, name: 'Ibadan South-West' },
  { state: 'OYO', lat: 7.35, lng: 3.95, name: 'Ibadan North-East' },
  { state: 'OYO', lat: 7.42, lng: 3.92, name: 'Ibadan South-East' },
  { state: 'OYO', lat: 7.45, lng: 3.85, name: 'Ibadan North-West' },
  { state: 'OYO', lat: 7.38, lng: 3.82, name: 'Akinyele' },
  { state: 'OYO', lat: 7.32, lng: 3.98, name: 'Lagelu' },
  { state: 'OYO', lat: 7.50, lng: 4.00, name: 'Egbeda' },
  { state: 'OYO', lat: 7.30, lng: 3.88, name: 'Ona-Ara' },
  { state: 'OYO', lat: 8.13, lng: 4.18, name: 'Ogbomoso North' },
  { state: 'OYO', lat: 8.10, lng: 4.15, name: 'Ogbomoso South' },
  { state: 'OYO', lat: 7.85, lng: 3.95, name: 'Oyo East' },
  { state: 'OYO', lat: 7.80, lng: 3.93, name: 'Oyo West' },
  { state: 'OYO', lat: 7.95, lng: 4.05, name: 'Atiba' },
  { state: 'OYO', lat: 7.75, lng: 3.85, name: 'Afijio' },

  // OSUN (15 LGAs)
  { state: 'OSUN', lat: 7.77, lng: 4.56, name: 'Osogbo' },
  { state: 'OSUN', lat: 7.75, lng: 4.52, name: 'Olorunda' },
  { state: 'OSUN', lat: 7.80, lng: 4.58, name: 'Atakumosa West' },
  { state: 'OSUN', lat: 7.65, lng: 4.50, name: 'Ilesa East' },
  { state: 'OSUN', lat: 7.62, lng: 4.48, name: 'Ilesa West' },
  { state: 'OSUN', lat: 7.48, lng: 4.56, name: 'Ife East' },
  { state: 'OSUN', lat: 7.45, lng: 4.52, name: 'Ife North' },
  { state: 'OSUN', lat: 7.50, lng: 4.60, name: 'Ife South' },
  { state: 'OSUN', lat: 7.70, lng: 4.65, name: 'Orolu' },
  { state: 'OSUN', lat: 7.55, lng: 4.45, name: 'Ila' },
  { state: 'OSUN', lat: 7.60, lng: 4.40, name: 'Iwo' },
  { state: 'OSUN', lat: 7.68, lng: 4.35, name: 'Ayedire' },
  { state: 'OSUN', lat: 7.85, lng: 4.70, name: 'Boripe' },
  { state: 'OSUN', lat: 7.90, lng: 4.65, name: 'Ifelodun' },
  { state: 'OSUN', lat: 7.72, lng: 4.75, name: 'Odo-Otin' },

  // ONDO (12 LGAs)
  { state: 'ONDO', lat: 7.25, lng: 5.20, name: 'Akure South' },
  { state: 'ONDO', lat: 7.28, lng: 5.18, name: 'Akure North' },
  { state: 'ONDO', lat: 7.08, lng: 4.84, name: 'Ondo City' },
  { state: 'ONDO', lat: 7.10, lng: 4.80, name: 'Ondo East' },
  { state: 'ONDO', lat: 6.88, lng: 5.05, name: 'Okitipupa' },
  { state: 'ONDO', lat: 6.75, lng: 4.95, name: 'Ilaje' },
  { state: 'ONDO', lat: 7.40, lng: 5.05, name: 'Owo' },
  { state: 'ONDO', lat: 7.35, lng: 5.15, name: 'Akoko South-West' },
  { state: 'ONDO', lat: 7.42, lng: 5.25, name: 'Akoko North-East' },
  { state: 'ONDO', lat: 7.15, lng: 5.30, name: 'Idanre' },
  { state: 'ONDO', lat: 6.95, lng: 5.10, name: 'Irele' },
  { state: 'ONDO', lat: 7.20, lng: 4.90, name: 'Ese-Odo' },

  // EKITI (12 LGAs)
  { state: 'EKITI', lat: 7.62, lng: 5.22, name: 'Ado-Ekiti' },
  { state: 'EKITI', lat: 7.50, lng: 5.23, name: 'Ikere-Ekiti' },
  { state: 'EKITI', lat: 7.70, lng: 5.15, name: 'Iworoko' },
  { state: 'EKITI', lat: 7.55, lng: 5.10, name: 'Emure' },
  { state: 'EKITI', lat: 7.65, lng: 5.30, name: 'Ikole' },
  { state: 'EKITI', lat: 7.75, lng: 5.20, name: 'Oye' },
  { state: 'EKITI', lat: 7.80, lng: 5.10, name: 'Ilejemeje' },
  { state: 'EKITI', lat: 7.45, lng: 5.15, name: 'Irepodun/Ifelodun' },
  { state: 'EKITI', lat: 7.60, lng: 5.05, name: 'Ekiti East' },
  { state: 'EKITI', lat: 7.55, lng: 5.30, name: 'Ekiti South-West' },
  { state: 'EKITI', lat: 7.72, lng: 5.05, name: 'Moba' },
  { state: 'EKITI', lat: 7.48, lng: 5.00, name: 'Gbonyin' },
]

async function main() {
  console.log('=== Seed Satellite Captures (Copernicus OData) ===')
  console.log(`Coverage areas: ${COVERAGE_AREAS.length}`)

  if (!SENTINEL_CLIENT_ID || !SENTINEL_CLIENT_SECRET) {
    console.error('ERROR: SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET must be set in .env.local')
    process.exit(1)
  }

  tokenState = await getSentinelToken()

  // Load polling units for nearest-PU lookup
  console.log('\nLoading polling units...')
  const { data: pollingUnits, error: puError } = await supabase.from('polling_units').select('id, lat, lng')
  if (puError) {
    console.error('Error loading polling units:', puError.message)
    process.exit(1)
  }
  console.log(`  Loaded ${pollingUnits.length} polling units`)

  // Clear existing captures (only if --clean flag is passed)
  const cleanFlag = process.argv.includes('--clean')
  if (cleanFlag) {
    console.log('\nClearing existing satellite captures...')
    const { error: delError } = await supabase.from('satellite_captures').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (delError) console.log('  Delete warning:', delError.message)
    else console.log('  Cleared')
  } else {
    console.log('\nAppending to existing captures (use --clean to clear first)')
  }

  let successCount = 0
  let failCount = 0
  let insertedTotal = 0

  for (let i = 0; i < COVERAGE_AREAS.length; i++) {
    const area = COVERAGE_AREAS[i]
    console.log(`[${i + 1}/${COVERAGE_AREAS.length}] ${area.name} (${area.state})...`)

    try {
      const polygon = toODataPolygon(area.lng, area.lat, 0.05)
      const token = await ensureToken()
      const products = await fetchSentinelScenes(token, polygon, '2024-01-01')

      if (products.length === 0) {
        failCount++
        continue
      }

      successCount++
      console.log(`  Found ${products.length} scenes`)

      const captures = []
      for (const product of products) {
        const capturedAt = product.ContentDate?.Start || new Date().toISOString()
        const sha = await sha256(product.Id || `${area.state}-${capturedAt}`)

        // Extract attributes
        const attrs = product.Attributes || []
        const cloudCover = attrs.find(a => a.Name === 'cloudCover')?.Value ?? null
        const productType = attrs.find(a => a.Name === 'productType')?.Value || null
        const platformName = attrs.find(a => a.Name === 'platformName')?.Value || null
        const orbitNumber = attrs.find(a => a.Name === 'orbitNumber')?.Value ?? null

        const parsed = parseProductName(product.Name)
        const finalPlatform = platformName || parsed.platform
        const finalProductType = productType || parsed.productType
        const finalOrbit = orbitNumber || parsed.orbitNumber
        const isL2A = (finalProductType || product.Name || '').includes('L2A') || (finalProductType || '').includes('S2MSI2A')

        const nearestPU = findNearestPollingUnit(area.lat, area.lng, pollingUnits)

        captures.push({
          id: crypto.randomUUID(),
          polling_unit_id: nearestPU?.id || null,
          captured_at: capturedAt,
          image_url: `https://browser.dataspace.copernicus.eu/?zoom=14&lat=${area.lat}&lng=${area.lng}`,
          sha256_hash: sha,
          is_flagged: false,
          flag_reason: null,
          ai_summary: `Sentinel-2 ${isL2A ? 'L2A (atmospherically corrected)' : 'L1C (top-of-atmosphere)'} capture for ${area.name}, ${area.state}. Cloud cover: ${cloudCover != null ? cloudCover.toFixed(1) + '%' : 'unknown'}. Platform: ${finalPlatform}.`,
          product_name: product.Name,
          cloud_cover: cloudCover,
          product_type: finalProductType,
          platform: finalPlatform,
          orbit_number: finalOrbit,
          content_length: product.ContentLength || null,
          online: product.Online ?? true,
          geo_footprint: product.GeoFootprint || null,
        })
      }

      // Insert immediately per area (no batch at end)
      if (captures.length > 0) {
        const { error } = await supabase.from('satellite_captures').upsert(captures, { onConflict: 'id' })
        if (error) {
          console.error(`  Insert error:`, error.message)
        } else {
          insertedTotal += captures.length
          console.log(`  Inserted ${captures.length} (${insertedTotal} total)`)
        }
      }

      // Rate limit: wait between requests
      await new Promise(r => setTimeout(r, 5000))
    } catch (err) {
      failCount++
      console.error(`  Error: ${err.message}`)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Successful areas: ${successCount}/${COVERAGE_AREAS.length}`)
  console.log(`Failed areas: ${failCount}`)
  console.log(`Total inserted: ${insertedTotal}`)
  console.log('Done!')
}

main().catch(console.error)
