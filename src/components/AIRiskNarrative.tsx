"use client"

import { useState, useEffect } from "react"
import { PollingUnit } from "@/lib/queries"

interface CacheEntry {
  narrative: string
  timestamp: number
}

const CACHE_KEY_PREFIX = "civic ai-risk-"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(puId: string): string {
  return `${CACHE_KEY_PREFIX}${puId}`
}

function getCached(puId: string): string | null {
  try {
    const raw = localStorage.getItem(getCacheKey(puId))
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(puId))
      return null
    }
    return entry.narrative
  } catch {
    return null
  }
}

function setCache(puId: string, narrative: string) {
  try {
    const entry: CacheEntry = { narrative, timestamp: Date.now() }
    localStorage.setItem(getCacheKey(puId), JSON.stringify(entry))
  } catch {}
}

export default function AIRiskNarrative({ pu }: { pu: PollingUnit }) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    const cached = getCached(pu.id)
    if (cached) {
      setNarrative(cached)
      setFromCache(true)
    }
  }, [pu.id])

  async function generate() {
    setLoading(true)
    setError(null)
    setFromCache(false)

    try {
      const res = await fetch("/api/ai-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pu_id: pu.id,
          name: pu.name,
          state: pu.state,
          lga: pu.lga,
          ward: pu.ward,
          risk_score: pu.risk_score,
        }),
      })

      if (!res.ok) throw new Error("Failed to generate narrative")

      const data = await res.json()
      setNarrative(data.narrative)
      setCache(pu.id, data.narrative)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Generating AI risk analysis...</p>
        <div className="flex gap-1 mt-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 mb-3">{error}</p>
        <button
          onClick={generate}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          Try again
        </button>
      </div>
    )
  }

  if (narrative) {
    return (
      <div>
        {fromCache && (
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] text-gray-400">Cached result</span>
          </div>
        )}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-xs font-bold text-emerald-800">AI Risk Analysis</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{narrative}</p>
        </div>
        <button
          onClick={generate}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Regenerate
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500 mb-4">Generate an AI-powered risk analysis for this polling unit</p>
      <button
        onClick={generate}
        className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        Generate AI Report
      </button>
    </div>
  )
}
