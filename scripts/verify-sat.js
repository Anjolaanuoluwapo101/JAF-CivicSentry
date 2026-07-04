require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // Quick count
  const { count, error: e1 } = await supabase.from('satellite_captures').select('*', { count: 'exact', head: true })
  console.log('Total:', count, e1?.message || '')

  // Test insert
  const testRow = {
    id: '00000000-0000-0000-0000-000000000001',
    captured_at: '2024-01-01T00:00:00Z',
    image_url: 'test',
    sha256_hash: 'test',
    product_name: 'test',
  }
  const { error: e2 } = await supabase.from('satellite_captures').upsert(testRow, { onConflict: 'id' })
  console.log('Test insert:', e2?.message || 'OK')

  // Clean up test
  await supabase.from('satellite_captures').delete().eq('id', '00000000-0000-0000-0000-000000000001')

  // Final count
  const { count: c2 } = await supabase.from('satellite_captures').select('*', { count: 'exact', head: true })
  console.log('After cleanup:', c2)
}
main().catch(console.error)
