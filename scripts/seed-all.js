const { execSync } = require('child_process')
const path = require('path')

const SCRIPTS_DIR = __dirname

const scripts = [
  {
    name: 'Polling Units',
    file: 'seed-polling-units.js',
    description: 'Fetches polling units from mykeels/inec-polling-units for 6 SW states',
  },
  {
    name: 'ACLED Incidents',
    file: 'seed-acled-incidents.js',
    description: 'Fetches conflict events from ACLED API (OAuth)',
  },
  {
    name: 'WarScope Events',
    file: 'seed-warscope-events.js',
    description: 'Fetches war/conflict events from WarScope API',
  },
  {
    name: 'War-Tracker Events',
    file: 'seed-war-tracker-events.js',
    description: 'Fetches conflict events from War-Tracker API',
  },
  {
    name: 'GDELT News',
    file: 'seed-gdelt-news.js',
    description: 'Fetches news articles from GDELT Project (15 queries)',
  },
  {
    name: 'NewsMCP News',
    file: 'seed-newsmcp-news.js',
    description: 'Fetches news from NewsMCP/NewsAPI',
  },
  {
    name: 'Google News RSS',
    file: 'seed-news-google-rss.js',
    description: 'Fetches news via Google News RSS (free, no API key)',
  },
  {
    name: 'Nigerian Newspaper RSS',
    file: 'seed-news-rss-feeds.js',
    description: 'Fetches election news from 8 Nigerian newspaper RSS feeds',
  },
  {
    name: 'Election Data',
    file: 'seed-election-data.js',
    description: 'Seeds election results (1999-2023) from mykeels, engrtobechi, Kaggle',
  },
  {
    name: 'Nigerian Data',
    file: 'seed-nigerian-data.js',
    description: 'Seeds health facilities (OpenStreetMap Overpass)',
  },
  {
    name: 'Population Density',
    file: 'seed-population-density.js',
    description: 'Seeds per-PU population density from state-level averages',
  },
  {
    name: 'Satellite Captures',
    file: 'seed-satellite-captures.js',
    description: 'Fetches satellite metadata from Sentinel Hub API',
  },
  {
    name: 'Compute Risk Scores',
    file: 'compute-risk-scores.js',
    description: 'Recomputes risk_score for all PUs based on all conflict sources',
  },
]

function printHeader() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║         CIVICSENTRY - Phase 1 Seed          ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')
  console.log('This script seeds the Supabase database with:')
  console.log('  • 40,000+ polling units (6 SW states)')
  console.log('  • ACLED conflict incidents (2020-2025)')
  console.log('  • WarScope + War-Tracker events')
  console.log('  • GDELT + NewsMCP + Google News RSS + Nigerian RSS news signals')
  console.log('  • Election results (1999-2023)')
  console.log('  • Health facilities (OpenStreetMap Overpass)')
  console.log('  • Population density (per-PU state-level averages)')
  console.log('  • Sentinel-2 satellite metadata')
  console.log('  • Risk score recomputation (all conflict sources)')
  console.log('')
}

async function runScript(script) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Running: ${script.name}`)
  console.log(`${script.description}`)
  console.log(`${'='.repeat(50)}`)

  try {
    execSync(`node "${path.join(SCRIPTS_DIR, script.file)}"`, {
      stdio: 'inherit',
      timeout: 300000, // 5 min per script
    })
    console.log(`✓ ${script.name} completed`)
  } catch (err) {
    console.error(`✗ ${script.name} failed: ${err.message}`)
    return false
  }
  return true
}

async function main() {
  printHeader()

  const startTime = Date.now()
  const results = []

  for (const script of scripts) {
    const success = await runScript(script)
    results.push({ ...script, success })
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n\n' + '='.repeat(50))
  console.log('SEED COMPLETE')
  console.log('='.repeat(50))
  console.log(`Total time: ${elapsed}s`)
  console.log('')

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`Succeeded: ${succeeded}/${results.length}`)
  if (failed > 0) {
    console.log(`Failed: ${failed}`)
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}`)
    })
  }

  console.log('\nNext steps:')
  console.log('  1. Check Supabase Dashboard → Table Editor for data')
  console.log('  2. Run `npm run build` to verify app compiles')
  console.log('  3. Run `npm run dev` to see data on the map')
}

main().catch(console.error)
