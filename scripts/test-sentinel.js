require('./loadEnv')
const cid = process.env.SENTINEL_HUB_CLIENT_ID
const sec = process.env.SENTINEL_HUB_CLIENT_SECRET

async function test() {
  const r = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cid, client_secret: sec })
  })
  const d = await r.json()
  const t = d.access_token
  console.log('Token OK')

  // Correct polygon: POLYGON((lng1 lat1,lng2 lat2,lng3 lat3,lng4 lat4,lng1 lat1))
  const url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-2' and OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((3.40 6.45,3.35 6.45,3.35 6.50,3.40 6.50,3.40 6.45))') and ContentDate/Start gt 2024-01-01T00:00:00.000Z&$top=3&$orderby=ContentDate/Start desc"

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const r2 = await fetch(url, { headers: { Authorization: 'Bearer ' + t }, signal: controller.signal })
    clearTimeout(timeout)
    console.log('Status:', r2.status)
    const txt = await r2.text()
    console.log('Response (first 2000):', txt.substring(0, 2000))
  } catch (e) {
    clearTimeout(timeout)
    console.log('Error:', e.message)
  }
}
test().catch(console.error)
