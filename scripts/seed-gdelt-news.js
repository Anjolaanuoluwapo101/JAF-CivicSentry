require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const QUERIES = [
  'Nigeria election',
  'Lagos election',
  'Oyo election',
  'INEC Nigeria',
]

const SOUTH_WEST_STATES = ['LAGOS', 'OGUN', 'OYO', 'OSUN', 'ONDO', 'EKITI']

function fetchGdeltJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CivicSentry/1.0)' },
      timeout: 20000,
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchGdeltJson(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON error: ${data.substring(0, 100)}`)) }
      })
    }).on('error', reject)
  })
}

async function loadAllPollingUnits() {
  const all = []
  let from = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase
      .from('polling_units')
      .select('id, state')
      .range(from, from + limit - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    from += limit
  }
  return all
}

async function main() {
  console.log('=== Seed GDELT News Signals ===')

  console.log('Loading all polling units...')
  const pollingUnits = await loadAllPollingUnits()
  console.log(`  Loaded ${pollingUnits.length} polling units`)

  for (const s of SOUTH_WEST_STATES) {
    const count = pollingUnits.filter(p => p.state === s).length
    console.log(`  ${s}: ${count} PUs`)
  }

  const allArticles = []

  console.log('Waiting 30s for rate limit to reset...')
  await sleep(30000)

  for (let qi = 0; qi < QUERIES.length; qi++) {
    const query = QUERIES[qi]
    console.log(`\nSearching [${qi+1}/${QUERIES.length}]: "${query}"`)
    try {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=250&format=json&startdatetime=20230101000000&enddatetime=20251231235959&sort=DateDesc`
      const data = await fetchGdeltJson(url)
      const articles = data.articles || []
      console.log(`  Found ${articles.length} articles`)
      allArticles.push(...articles)
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }
    if (qi < QUERIES.length - 1) await sleep(10000)
  }

  console.log(`\nTotal articles: ${allArticles.length}`)

  const seen = new Set()
  const unique = allArticles.filter(a => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })
  console.log(`Unique: ${unique.length}`)

  const signals = []
  for (const article of unique) {
    const text = ((article.title || '') + ' ' + (article.snippet || '') + ' ' + (article.content || '')).toLowerCase()
    const date = article.seendate || new Date().toISOString().split('T')[0]
    const formattedDate = date.length === 8
      ? `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`
      : date

    for (const state of SOUTH_WEST_STATES) {
      if (text.includes(state.toLowerCase())) {
        signals.push({
          id: crypto.randomUUID(),
          polling_unit_id: null,
          state,
          headline: (article.title || '').substring(0, 500),
          url: article.url,
          source_domain: article.domain || 'GDELT',
          sentiment_score: article.tone ? parseFloat(article.tone.split(',')[0]) : 0,
          tone: article.tone ? parseFloat(article.tone.split(',')[0]) : 0,
          published_at: formattedDate,
        })
      }
    }
  }

  console.log(`Matched ${signals.length} article-state signals`)

  if (signals.length > 0) {
    const BATCH_SIZE = 500
    let inserted = 0
    for (let i = 0; i < signals.length; i += BATCH_SIZE) {
      const batch = signals.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('news_signals').upsert(batch, { onConflict: 'id' })
      if (error) console.error(`  Batch error:`, error.message)
      else { inserted += batch.length; console.log(`  Inserted ${inserted}/${signals.length}`) }
    }
  }

  console.log(`\nDone!`)
}

main().catch(console.error)
