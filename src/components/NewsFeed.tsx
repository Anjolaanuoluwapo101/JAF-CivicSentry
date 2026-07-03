"use client"

import { useEffect, useState } from "react"
import { fetchNewsForPU, NewsItem } from "@/lib/detail-queries"

export default function NewsFeed({
  pollingUnitId,
  state,
}: {
  pollingUnitId: string
  state: string
}) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchNewsForPU(pollingUnitId, state).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [pollingUnitId, state])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No news signals for this area</p>
      </div>
    )
  }

  function sentimentLabel(score: number | null): { text: string; color: string } {
    if (score === null) return { text: "Neutral", color: "bg-gray-100 text-gray-600" }
    if (score > 0.2) return { text: "Positive", color: "bg-green-100 text-green-700" }
    if (score < -0.2) return { text: "Negative", color: "bg-red-100 text-red-700" }
    return { text: "Neutral", color: "bg-gray-100 text-gray-600" }
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const sentiment = sentimentLabel(item.sentiment_score)
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.headline}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${sentiment.color}`}>
                {sentiment.text}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-400">{item.source_domain}</span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] text-gray-400">
                {new Date(item.published_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
