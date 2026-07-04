"use client"

import { useEffect, useState } from "react"
import { fetchSatelliteForPU, SatelliteDetail } from "@/lib/detail-queries"
import { useAuth } from "@/lib/auth"
import { Flag, Check, Loader2 } from "lucide-react"

export default function SatelliteView({ pollingUnitId }: { pollingUnitId: string }) {
  const { user } = useAuth()
  const [capture, setCapture] = useState<SatelliteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [flagReason, setFlagReason] = useState("")

  useEffect(() => {
    setLoading(true)
    fetchSatelliteForPU(pollingUnitId).then((data) => {
      setCapture(data)
      setLoading(false)
    })
  }, [pollingUnitId])

  const handleFlag = async () => {
    if (!capture || !capture.sha256_hash || !user) return
    setFlagging(true)
    try {
      const res = await fetch("/api/evidence/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence_type: "satellite",
          evidence_id: capture.id,
          polling_unit_id: pollingUnitId,
          sha256_hash: capture.sha256_hash,
          flag_reason: flagReason || "Flagged from satellite view",
        }),
      })
      if (res.ok) setFlagged(true)
    } catch (err) {
      console.error("Flag failed:", err)
    } finally {
      setFlagging(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!capture) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No satellite imagery available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Flagged indicator */}
      {capture.is_flagged && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-red-700">Flagged for review</p>
            {capture.flag_reason && (
              <p className="text-[10px] text-red-600">{capture.flag_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Capture info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          <span className="text-xs font-bold text-gray-900">Latest Capture</span>
        </div>

        {capture.captured_at && (
          <p className="text-xs text-gray-500 mb-2">
            Captured:{" "}
            {new Date(capture.captured_at).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {capture.ai_summary && (
          <p className="text-sm text-gray-700 mt-2">{capture.ai_summary}</p>
        )}
      </div>

      {/* SHA-256 hash */}
      {capture.sha256_hash && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">SHA-256 Hash</p>
          <p className="text-[10px] text-gray-600 font-mono break-all leading-relaxed">
            {capture.sha256_hash}
          </p>
        </div>
      )}

      {/* Flag for Archive */}
      {user && capture.sha256_hash && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          {flagged ? (
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4" />
              <span className="text-xs font-medium">Added to Evidence Archive</span>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Reason for flagging (optional)"
                className="w-full text-xs border border-emerald-200 rounded-lg px-3 py-1.5 mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleFlag}
                disabled={flagging}
                className="flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
              >
                {flagging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                {flagging ? "Flagging..." : "Flag for Evidence Archive"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Image URL */}
      {capture.image_url && (
        <a
          href={capture.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View Full Image
        </a>
      )}
    </div>
  )
}
