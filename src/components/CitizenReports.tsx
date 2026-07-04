"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"
import { Flag, Check, Loader2 } from "lucide-react"

interface Report {
  id: string
  description: string
  status: string
  created_at: string
  reporter_id: string
}

export default function CitizenReports({ pollingUnitId }: { pollingUnitId: string }) {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [flaggingId, setFlaggingId] = useState<string | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    supabase
      .from("incident_reports")
      .select("id, description, status, created_at, reporter_id")
      .eq("polling_unit_id", pollingUnitId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        setReports(data || [])
        setLoading(false)
      })
  }, [pollingUnitId])

  const handleFlag = async (report: Report) => {
    if (!user) return
    setFlaggingId(report.id)

    // Generate a simple hash of the report content for integrity
    const encoder = new TextEncoder()
    const data = encoder.encode(`${report.id}:${report.description}:${report.created_at}`)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    try {
      const res = await fetch("/api/evidence/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence_type: "report",
          evidence_id: report.id,
          polling_unit_id: pollingUnitId,
          sha256_hash: sha256Hash,
          flag_reason: "Flagged from citizen reports view",
        }),
      })
      if (res.ok) {
        setFlaggedIds((prev) => new Set(prev).add(report.id))
      }
    } catch (err) {
      console.error("Flag failed:", err)
    } finally {
      setFlaggingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No citizen reports for this unit yet</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
    dismissed: "bg-red-100 text-red-700",
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-700 flex-1">{r.description}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${statusColors[r.status] || "bg-gray-100 text-gray-600"}`}>
              {r.status}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-gray-400">
              {new Date(r.created_at).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {user && (
              flaggedIds.has(r.id) ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <Check className="w-3 h-3" />
                  Archived
                </span>
              ) : (
                <button
                  onClick={() => handleFlag(r)}
                  disabled={flaggingId === r.id}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {flaggingId === r.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Flag className="w-3 h-3" />
                  )}
                  Archive
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
