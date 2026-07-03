require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const NEWS_API_KEY = process.env.NEWS_API_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const QUERIES = [
  'Nigeria election violence',
  'INEC polling unit',
  'Nigeria voter intimidation',
  'Nigeria election protest',
  'Lagos election',
  'Nigeria political crisis',
  'South West Nigeria election',
  'Oyo Ogun Osun Ondo Ekiti election',
  'Nigeria INEC attack',
  'Nigeria election security',
]

const SOUTH_WEST_STATES = ['LAGOS', 'OGUN', 'OYO', 'OSUN', 'ONDO', 'EKITI']

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CivicSentry/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body.substring(0, 100)}`)
  }
  return res.json()
}

function getDateRange() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
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
  console.log('=== Seed NewsAPI News Signals ===')

  console.log('Loading all polling units...')
  const pollingUnits = await loadAllPollingUnits()
  console.log(`  Loaded ${pollingUnits.length} polling units`)

  const startDate = getDateRange()
  console.log(`Date range: ${startDate} to today`)

  const allArticles = []

  for (const query of QUERIES) {
    console.log(`\nSearching: "${query}"`)
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${startDate}&sortBy=relevancy&pageSize=50&apiKey=${NEWS_API_KEY.trim()}&language=en`
      const data = await fetchJson(url)
      const articles = data.articles || []
      console.log(`  Found ${articles.length} articles (status: ${data.status})`)
      allArticles.push(...articles)
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }
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
    const text = ((article.title || '') + ' ' + (article.description || '') + ' ' + (article.content || '')).toLowerCase()

    for (const state of SOUTH_WEST_STATES) {
      if (text.includes(state.toLowerCase())) {
        signals.push({
          id: crypto.randomUUID(),
          polling_unit_id: null,
          state,
          headline: (article.title || '').substring(0, 500),
          url: article.url,
          source_domain: article.source?.name || article.source?.id || 'NewsAPI',
          sentiment_score: 0,
          tone: 0,
          published_at: (article.publishedAt || '').split('T')[0] || new Date().toISOString().split('T')[0],
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

  console.log(`\nDone! Inserted ${signals.length} news signals.`)
}

main().catch(console.error)
