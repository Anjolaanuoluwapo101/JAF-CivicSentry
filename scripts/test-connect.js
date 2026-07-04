require('./loadEnv')
const cid = process.env.SENTINEL_HUB_CLIENT_ID
const sec = process.env.SENTINEL_HUB_CLIENT_SECRET

async function test() {
  try {
    const r = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cid, client_secret: sec })
    })
    const d = await r.json()
    const t = d.access_token
    console.log('Token OK')

    const url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$top=1&$filter=Collection/Name eq 'SENTINEL-2'"
    const r2 = await fetch(url, { headers: { Authorization: 'Bearer ' + t } })
    console.log('Catalog status:', r2.status)
    const txt = await r2.text()
    console.log(txt.substring(0, 500))
  } catch (e) {
    console.log('ERROR:', e.message)
    console.log('Cause:', e.cause)
  }
}
test()
