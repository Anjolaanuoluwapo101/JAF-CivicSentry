require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const statements = [
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS product_name TEXT',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS cloud_cover DOUBLE PRECISION',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS product_type TEXT',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS platform TEXT',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS orbit_number INTEGER',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS content_length BIGINT',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT true',
    'ALTER TABLE satellite_captures ADD COLUMN IF NOT EXISTS geo_footprint JSONB',
  ]

  for (const sql of statements) {
    // Use the Supabase REST API to run raw SQL via the query endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ query: sql }),
    })
    const status = res.status
    const text = await res.text()
    if (status >= 400) {
      console.log(`WARN ${status}: ${sql.substring(0, 50)}... => ${text.substring(0, 100)}`)
    } else {
      console.log(`OK: ${sql.substring(0, 60)}`)
    }
  }

  // Verify columns exist
  const { data, error } = await supabase.from('satellite_captures').select('*').limit(1)
  if (error) {
    console.log('Verify error:', error.message)
  } else if (data.length > 0) {
    const cols = Object.keys(data[0])
    console.log('\nFinal columns:', cols.join(', '))
  }
}

main().catch(console.error)
