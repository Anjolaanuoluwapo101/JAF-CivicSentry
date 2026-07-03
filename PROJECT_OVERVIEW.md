# CivicSentry AI

## Real-time polling unit risk intelligence for Nigeria's elections.

---

## The Problem

Every election cycle in Nigeria, violence erupts at polling stations. Ballot boxes are snatched. Voters are intimidated. INEC officials are attacked. And yet — there is no single platform where an election observer, a journalist, or a voter can look up a polling unit and ask: *Is this place dangerous?*

The data exists. ACLED tracks every political violence event in Nigeria. News outlets report on election-related attacks. Satellite imagery captures the state of polling stations before and after election day. Election results from six cycles (1999–2023) are publicly available. But all this information lives in separate silos — different websites, different formats, different APIs.

Meanwhile, voters show up to polling units they have no way of assessing. Election observers deploy teams without a data-driven risk map. Journalists cover hotspots only after violence has already occurred.

---

## What CivicSentry AI Does

CivicSentry AI pulls **26 real-world data sources** into a single interactive map. Every polling unit in Nigeria's six South West states — Lagos, Ogun, Oyo, Osun, Ondo, and Ekiti — is plotted with a color-coded risk score. Click on any unit and you get:

- Its **violence history** — how many conflict events have occurred nearby, what types (battles, civilian targeting, riots, protests), and how many fatalities
- **Live news signals** — recent news articles mentioning that state, with headline and source
- **Election history** — results from every presidential election going back to 1999
- **Population density** — the density of the area around the polling unit
- **Nearest hospital** — the closest health facility mapped from OpenStreetMap data
- **A satellite image** — the most recent available Sentinel-2 image of that location (with the real capture date labeled honestly)
- **An AI-generated risk narrative** — a plain-language paragraph that synthesizes the conflict data, news tone, satellite status, and election history into a single assessment

Citizens can submit incident reports directly through the app — uploading photos and descriptions that are visible to everyone, creating a real-time public record.

An evidence archive stores flagged satellite images and citizen reports alongside their SHA-256 cryptographic hashes, creating a tamper-proof chain of custody for accountability purposes.

---

## Who It Serves

- **Election observers** — know which polling units to watch before deploying teams
- **Journalists** — identify emerging hotspots by tracking news signals against a map
- **Security agencies** — allocate resources based on data, not instinct
- **INEC** — flag polling units that need additional security or logistical support
- **Voters** — look up their assigned polling unit and understand the risks before heading out

---

## Key Features

- **33,802 polling units** mapped with color-coded risk scores (green / orange / red)
- **1,501 health facilities** mapped for emergency response proximity
- **125+ news signals** matched to states for real-time awareness
- **Election results** from 1999, 2003, and 2011 at state level (2015, 2019, 2023 pending)
- **Population density** calculated per polling unit using official census data
- **AI risk narratives** powered by Google Gemini (swappable to DeepSeek)
- **Citizen incident reporting** with photo upload and public visibility
- **Evidence archive** with SHA-256 hash verification
- **Upgrade path** explaining the gap between free satellite revisit intervals and commercial tasking

---

## The Data Engine

CivicSentry aggregates data from 26 distinct sources:

| Category | Sources |
|----------|---------|
| Conflict & Violence | ACLED, WarScope, War-Tracker |
| News | NewsAPI, GDELT v2, GDELT Cloud |
| Satellite Imagery | Sentinel Hub (Copernicus), NASA GIBS |
| Nigerian Demographics | WorldPop, OpenStreetMap, GRID3, NPopC |
| Election Data | INEC, ElectoralGeography, mykeels GitHub repos |
| Infrastructure | LightDey, NEPAWatch, HuggingFace Energy Logs |
| Economic Indicators | NG DATA API, OpenNG, facts.ng, National Bureau of Statistics |
| AI | Google Gemini, DeepSeek (adapter pattern) |

Every data point is from a real, verifiable source. No synthetic data. No approximations.

---

## How It Works

1. **Seed phase**: One-time scripts download, parse, and insert real data from each source into a Postgres database hosted on Supabase
2. **Map phase**: A Leaflet.js map renders all polling units with risk-based coloring, layer toggles for health facilities and conflict clusters, and state/LGA search
3. **Analysis phase**: Clicking a polling unit opens a detail panel showing conflict history, news signals, satellite image, election results, and a generative AI risk narrative that synthesizes all available signals
4. **Reporting phase**: Authenticated users can submit incident reports with photos, creating a public record visible on the map
5. **Archive phase**: All evidence is stored with SHA-256 hashes for tamper-proof verification

---

## Built For Scale

- **Server-rendered** with Next.js for fast initial loads even on slow connections
- **Supabase Postgres** handles the database — the free tier easily holds all 33,802 polling units plus related data
- **Marker clustering** on the map prevents browser overload from 33K+ pins
- **AI adapter pattern** means switching between Gemini and DeepSeek is a one-line config change
- **Edge functions** (planned) will cache external API responses, reducing rate-limit pressure

---

## The Big Picture

Nigeria has over 176,000 polling units and 93 million registered voters. CivicSentry AI currently covers 33,802 units across 6 states — roughly 20% of the country. The architecture is designed to scale to all 36 states and the FCT.

Election violence is not inevitable. When you can see the risk before it materializes, you can prevent it. When you have photographic evidence with cryptographic proof of integrity, you can hold perpetrators accountable. When citizens have a channel to report what they see in real time, the information blackout that enables election manipulation is broken.

That is what CivicSentry AI is built to do.

---

*Built with Next.js, Supabase, Leaflet, Google Gemini, and 26 open data sources from Nigeria and around the world.*
