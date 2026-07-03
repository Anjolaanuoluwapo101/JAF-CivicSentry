require('./loadEnv')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const SOUTH_WEST_STATES = ['LAGOS', 'OGUN', 'OYO', 'OSUN', 'ONDO', 'EKITI']

const RSS_FEEDS = [
  { name: 'Vanguard', url: 'https://www.vanguardngr.com/feed/' },
  { name: 'Guardian Nigeria', url: 'https://guardian.ng/feed/' },
  { name: 'Tribune', url: 'https://tribuneonlineng.com/feed/' },
  { name: 'Punch', url: 'https://punchng.com/feed/' },
  { name: 'Sahara Reporters', url: 'https://saharareporters.com/feeds/latest/feed' },
  { name: 'Premium Times', url: 'https://www.premiumtimesng.com/feed' },
  { name: 'ThisDay', url: 'https://www.thisdaylive.com/feed/' },
  { name: 'Daily Trust', url: 'https://dailytrust.com/feed/' },
  { name: 'Nigerian Tribune', url: 'https://www.tribuneonlineng.com/feed/' },
  { name: 'Nigeria News', url: 'https://www.naija247news.com/feed/' },
  { name: 'Information Nigeria', url: 'https://www.informationng.com/feed/' },
  { name: 'Legit NG', url: 'https://www.legit.ng/feed/' },
  { name: 'Channels TV', url: 'https://www.channelstv.com/feed/' },
  { name: 'NAN News', url: 'https://nannews.ng/feed/' },
]

const ELECTION_KEYWORDS = [
  'election', 'inec', 'polling', 'voter', 'ballot', 'vote',
  'governor', 'president', 'senate', 'house of representatives',
  'constituency', 'campaign', 'candidate', 'political party',
  'apc', 'pdp', 'labour party', 'lp', 'obi', 'atiku', 'tinubu',
  'lagos', 'ogun', 'oyo', 'osun', 'ondo', 'ekiti',
  'election violence', 'election security', 'protest',
  'democracy', 'coup', 'military', 'junta',
  'political', 'politician', 'party', 'defection',
  'corruption', 'embezzlement', 'bribery',
  'strike', 'protest', 'unrest', 'crisis',
  'bvas', 'irev', 'electronic voting',
  'senator', 'reps', 'assembly', 'chairman',
  'local government', 'council',
]

function fetchRss(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CivicSentry/1.0)' },
      timeout: 20000,
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

    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || ''

    const description = (itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                         itemXml.match(/<description>([\s\S]*?)<\/description>/))?.[1]?.trim() || ''

    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''

    if (title && link) {
      items.push({ title, link, description, pubDate })
    }
  }
  return items
}

function extractSourceDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

function isElectionRelated(text) {
  const lower = text.toLowerCase()
  return ELECTION_KEYWORDS.some(kw => lower.includes(kw))
}

function matchState(text) {
  const lower = text.toLowerCase()
  for (const state of SOUTH_WEST_STATES) {
    if (lower.includes(state.toLowerCase())) return state
  }
  return null
}

async function main() {
  console.log('=== Seed News via Nigerian Newspaper RSS Feeds (Free, No API Key) ===\n')

  const allArticles = []

  for (const feed of RSS_FEEDS) {
    console.log(`Fetching: ${feed.name}`)
    try {
      const xml = await fetchRss(feed.url)
      const items = parseRssItems(xml)
      console.log(`  Found ${items.length} articles`)
      allArticles.push(...items.map(item => ({ ...item, source: feed.name })))
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }
    await sleep(2000)
  }

  console.log(`\nTotal articles: ${allArticles.length}`)

  // Deduplicate by URL
  const seen = new Set()
  const unique = allArticles.filter(a => {
    if (seen.has(a.link)) return false
    seen.add(a.link)
    return true
  })
  console.log(`Unique: ${unique.length}`)

  // Filter for election-related content
  const electionArticles = unique.filter(a =>
    isElectionRelated(a.title) || isElectionRelated(a.description)
  )
  console.log(`Election-related: ${electionArticles.length}`)

  // Match to states and create signals
  const signals = []
  for (const article of electionArticles) {
    const text = `${article.title} ${article.description}`.toLowerCase()

    for (const state of SOUTH_WEST_STATES) {
      if (text.includes(state.toLowerCase())) {
        const pubDate = article.pubDate ? new Date(article.pubDate) : new Date()
        if (!isNaN(pubDate.getTime())) {
          signals.push({
            id: crypto.randomUUID(),
            polling_unit_id: null,
            state,
            headline: article.title.substring(0, 500),
            url: article.link,
            source_domain: article.source,
            sentiment_score: 0,
            tone: 0,
            published_at: pubDate.toISOString().split('T')[0],
          })
        }
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
