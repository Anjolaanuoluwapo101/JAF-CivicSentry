"use client"

import { useEffect, useState } from "react"
import { fetchElectionsForPU, ElectionResult } from "@/lib/detail-queries"

const PARTY_COLORS: Record<string, string> = {
  APC: "bg-blue-600",
  PDP: "bg-green-600",
  LP: "bg-gray-800",
  NNPP: "bg-purple-600",
  DEFAULT: "bg-gray-400",
}

export default function ElectionHistory({ pollingUnitId }: { pollingUnitId: string }) {
  const [results, setResults] = useState<ElectionResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchElectionsForPU(pollingUnitId).then((data) => {
      setResults(data)
      setLoading(false)
    })
  }, [pollingUnitId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No election data for this unit</p>
        <p className="text-xs text-gray-400 mt-1">Data may only exist at LGA/state level</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((r) => {
        const parties = r.party_results
          ? Object.entries(r.party_results).sort((a, b) => b[1] - a[1])
          : []
        const maxVotes = parties.length > 0 ? parties[0][1] : 1

        return (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{r.election_year}</h4>
                <p className="text-[10px] text-gray-400 capitalize">{r.election_type}</p>
              </div>
              {r.data_quality !== "complete" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                  {r.data_quality}
                </span>
              )}
            </div>

            {r.winner && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <span className="text-xs text-gray-500">Winner:</span>
                <span className="text-xs font-bold text-gray-900">{r.winner}</span>
                {r.winner_votes && (
                  <span className="text-[10px] text-gray-400">
                    ({r.winner_votes.toLocaleString()} votes)
                  </span>
                )}
              </div>
            )}

            {parties.length > 0 && (
              <div className="space-y-2">
                {parties.map(([party, votes]) => (
                  <div key={party}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-gray-700">{party}</span>
                      <span className="text-[10px] text-gray-500">{votes.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${PARTY_COLORS[party] || PARTY_COLORS.DEFAULT}`}
                        style={{ width: `${(votes / maxVotes) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
              {r.turnout_percentage !== null && (
                <span>Turnout: {r.turnout_percentage.toFixed(1)}%</span>
              )}
              {r.registered_voters !== null && (
                <span>Registered: {r.registered_voters.toLocaleString()}</span>
              )}
              {r.margin_of_victory !== null && (
                <span>Margin: {r.margin_of_victory.toLocaleString()}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
