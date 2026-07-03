"use client"

import { useEffect, useState } from "react"
import { fetchConflictForPU, ConflictEvent } from "@/lib/detail-queries"

export default function ConflictFeed({ pollingUnitId }: { pollingUnitId: string }) {
  const [events, setEvents] = useState<ConflictEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchConflictForPU(pollingUnitId).then((data) => {
      setEvents(data)
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

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No conflict events recorded for this unit</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div
          key={ev.id}
          className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-900">{ev.event_type}</span>
                {ev.fatalities > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                    {ev.fatalities} {ev.fatalities === 1 ? "death" : "deaths"}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{ev.sub_event_type}</p>
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {new Date(ev.event_date).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {ev.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ev.description}</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1.5">Source: {ev.source}</p>
        </div>
      ))}
    </div>
  )
}
