"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { searchPollingUnits, PollingUnit } from "@/lib/queries"

interface ReportFormProps {
  preselectedPU?: PollingUnit | null
  onSubmit?: () => void
}

export default function ReportForm({ preselectedPU, onSubmit }: ReportFormProps) {
  const { user } = useAuth()
  const [pu, setPu] = useState<PollingUnit | null>(preselectedPU || null)
  const [query, setQuery] = useState(preselectedPU?.name || "")
  const [results, setResults] = useState<PollingUnit[]>([])
  const [searching, setSearching] = useState(false)
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debounceRef, setDebounceRef] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (preselectedPU) {
      setPu(preselectedPU)
      setQuery(preselectedPU.name)
    }
  }, [preselectedPU])

  useEffect(() => {
    if (debounceRef) clearTimeout(debounceRef)

    if (query.length < 2 || pu) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    const timeout = setTimeout(async () => {
      const data = await searchPollingUnits(query)
      setResults(data)
      setSearching(false)
    }, 300)

    setDebounceRef(timeout)
    return () => clearTimeout(timeout)
  }, [query, pu])

  function selectPU(p: PollingUnit) {
    setPu(p)
    setQuery(p.name)
    setResults([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pu || !description.trim() || !user) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polling_unit_id: pu.id,
          description: description.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit report")
      }

      setSuccess(true)
      setDescription("")
      setPu(null)
      setQuery("")
      onSubmit?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">You must be logged in to submit a report.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">Report submitted</p>
        <p className="text-xs text-gray-500 mt-1">Thank you for contributing to community safety.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Submit another report
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Polling unit selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Polling Unit</label>
        {pu ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{pu.name}</p>
              <p className="text-[10px] text-gray-500">{pu.ward} • {pu.lga} • {pu.state}</p>
            </div>
            <button
              type="button"
              onClick={() => { setPu(null); setQuery("") }}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a polling unit..."
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto z-10">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPU(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-[10px] text-gray-500">{p.ward} • {p.lga}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">What happened?</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the incident, situation, or observation..."
          className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!pu || !description.trim() || submitting}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  )
}
