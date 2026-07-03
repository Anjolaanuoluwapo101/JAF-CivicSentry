require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const SOUTH_WEST_STATES = ['LAGOS', 'OGUN', 'OYO', 'OSUN', 'ONDO', 'EKITI']

const QUERIES = [
  // General election
  'Nigeria election',
  'Nigeria election 2023',
  'Nigeria election results',
  'Nigeria presidential election',
  'Nigeria gubernatorial election',
  'Nigeria election violence',
  'Nigeria election security',
  'Nigeria election protest',
  'Nigeria election tribunal',
  'Nigeria election controversy',
  'Nigeria election polling unit',
  'INEC Nigeria',
  'INEC results',
  'INEC polling unit',
  'INEC voter registration',
  'Nigeria voter intimidation',
  'Nigeria ballot box',
  'Nigeria election fraud',
  'Nigeria political crisis',
  'Nigeria party defection',
  // Lagos
  'Lagos election',
  'Lagos governorship election',
  'Lagos election results',
  'Lagos INEC',
  'Lagos polling unit',
  'Lagos election violence',
  'Lagos political crisis',
  'Lagos election protest',
  'Lagos voter',
  // Ogun
  'Ogun election',
  'Ogun governorship election',
  'Ogun election results',
  'Ogun INEC',
  'Ogun polling unit',
  'Ogun election violence',
  // Oyo
  'Oyo election',
  'Oyo governorship election',
  'Oyo election results',
  'Oyo INEC',
  'Oyo polling unit',
  'Oyo election violence',
  // Osun
  'Osun election',
  'Osun governorship election',
  'Osun election results',
  'Osun INEC',
  'Osun polling unit',
  'Osun election violence',
  // Ondo
  'Ondo election',
  'Ondo governorship election',
  'Ondo election results',
  'Ondo INEC',
  'Ondo polling unit',
  'Ondo election violence',
  // Ekiti
  'Ekiti election',
  'Ekiti governorship election',
  'Ekiti election results',
  'Ekiti INEC',
  'Ekiti polling unit',
  'Ekiti election violence',
  // Security & conflict
  'Nigeria election attack',
  'Nigeria political violence',
  'Nigeria election killed',
  'Nigeria election injured',
  'Nigeria election crisis',
  'South West Nigeria security',
  'Nigeria election unrest',
  // Democracy & governance
  'Nigeria democracy',
  'Nigeria election transparency',
  'Nigeria election observer',
  'Nigeria election monitoring',
  'Nigeria election appeal court',
  'INEC BVAS',
  'INEC IReV',
  'Nigeria electronic voting',
]

function fetchRss(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CivicSentry/1.0)' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchRss(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

function parseRssItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]

    const title = (itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                   itemXml.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || ''

    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ||
                 itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim() || ''

    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''

    const source = (itemXml.match(/<source[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/source>/) ||
                    itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/))?.[1]?.trim() || 'Google News'

    if (title && link) {
      items.push({ title, link, pubDate, source })
    }
  }
  return items
}

function extractSourceDomain(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain
  } catch {
    return 'unknown'
  }
}

function matchState(text) {
  const lower = text.toLowerCase()
  for (const state of SOUTH_WEST_STATES) {
    if (lower.includes(state.toLowerCase())) return state
  }
  return null
}

async function main() {
  console.log('=== Seed News via Google News RSS (Free, No API Key) ===\n')

  const seen = new Set()
  let totalInserted = 0

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i]
    console.log(`[${i + 1}/${QUERIES.length}] Searching: "${query}"`)

    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-NG&gl=NG&ceid=NG:en`
      const xml = await fetchRss(url)
      const items = parseRssItems(xml)
      console.log(`  Found ${items.length} articles`)

      // Match to states and insert immediately
      const signals = []
      for (const article of items) {
        if (seen.has(article.link)) continue
        seen.add(article.link)

        const text = `${article.title} ${article.source}`.toLowerCase()
        for (const state of SOUTH_WEST_STATES) {
          if (text.includes(state.toLowerCase())) {
            const pubDate = article.pubDate ? new Date(article.pubDate) : new Date()
            signals.push({
              id: crypto.randomUUID(),
              polling_unit_id: null,
              state,
              headline: article.title.substring(0, 500),
              url: article.link,
              source_domain: extractSourceDomain(article.link),
              sentiment_score: 0,
              tone: 0,
              published_at: pubDate.toISOString().split('T')[0],
            })
          }
        }
      }

      if (signals.length > 0) {
        const { error } = await supabase.from('news_signals').upsert(signals, { onConflict: 'id' })
        if (error) console.error(`  Insert error:`, error.message)
        else { totalInserted += signals.length; console.log(`  Inserted ${signals.length} (total: ${totalInserted})`) }
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }

    if (i < QUERIES.length - 1) await sleep(1500)
  }

  console.log(`\nDone! Total inserted: ${totalInserted}`)
}

main().catch(console.error)
