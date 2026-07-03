require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const { Readable } = require('stream')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const SOUTH_WEST_STATES = ['lagos', 'ogun', 'oyo', 'osun', 'ondo', 'ekiti']

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CivicSentry/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchCsv(res.headers.location).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

async function main() {
  console.log('=== Seed Polling Units (from polling-units.csv) ===')
  console.log('Source: mykeels/inec-polling-units (GitHub)')

  const csvUrl = 'https://raw.githubusercontent.com/mykeels/inec-polling-units/master/polling-units.csv'
  console.log(`\nDownloading CSV from ${csvUrl}...`)

  const csv = await fetchCsv(csvUrl)
  const lines = csv.split('\n').filter(l => l.trim())
  console.log(`  Total lines: ${lines.length}`)

  // Parse header
  const header = parseCsvLine(lines[0])
  console.log(`  Columns: ${header.join(', ')}`)

  // Find column indices - CSV uses: name, ward_name, local_government_name, state_name, location.latitude, location.longitude
  const colIdx = {}
  header.forEach((col, i) => { colIdx[col] = i })

  console.log(`  state_name index: ${colIdx.state_name}`)
  console.log(`  local_government_name index: ${colIdx.local_government_name}`)
  console.log(`  ward_name index: ${colIdx.ward_name}`)
  console.log(`  name index: ${colIdx.name}`)
  console.log(`  location.latitude index: ${colIdx['location.latitude']}`)
  console.log(`  location.longitude index: ${colIdx['location.longitude']}`)

  // Parse and filter to South West states
  const allUnits = []
  let rowIdx = 0
  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCsvLine(lines[i])
      const state = (fields[colIdx.state_name] || '').trim().toLowerCase()

      if (SOUTH_WEST_STATES.includes(state)) {
        const lat = parseFloat(fields[colIdx['location.latitude']])
        const lng = parseFloat(fields[colIdx['location.longitude']])

        if (!isNaN(lat) && !isNaN(lng) && lat >= 4 && lat <= 14 && lng >= 2.7 && lng <= 15 && !(lat === 0 && lng === 0)) {
          rowIdx++
          const id = `pu-${rowIdx}`

          allUnits.push({
            id,
            name: (fields[colIdx.name] || 'Unknown').substring(0, 200),
            state: state.toUpperCase(),
            lga: (fields[colIdx.local_government_name] || '').substring(0, 100),
            ward: (fields[colIdx.ward_name] || '').substring(0, 100),
            lat,
            lng,
            risk_score: 'low',
          })
        }
      }
    } catch (err) {
      // Skip malformed lines
    }
  }

  console.log(`\nFiltered to ${allUnits.length} polling units in South West states`)

  // Stats per state
  const stateCounts = {}
  allUnits.forEach(u => {
    stateCounts[u.state] = (stateCounts[u.state] || 0) + 1
  })
  console.log('\nRecords per state:')
  Object.entries(stateCounts).forEach(([state, count]) => {
    console.log(`  ${state}: ${count}`)
  })

  // Insert in batches of 500
  const BATCH_SIZE = 500
  let inserted = 0

  for (let i = 0; i < allUnits.length; i += BATCH_SIZE) {
    const batch = allUnits.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('polling_units').upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
    } else {
      inserted += batch.length
      console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted}/${allUnits.length}`)
    }
  }

  console.log(`\nDone! Inserted ${inserted} polling units.`)
}

main().catch(console.error)
