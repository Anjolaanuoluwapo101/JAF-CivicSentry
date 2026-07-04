"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { fetchEvidenceArchive, fetchArchiveStats, EvidenceItem, ArchiveStats } from "@/lib/archive-queries"
import OnboardingOverlay, { OnboardingStep } from "@/components/OnboardingOverlay"
import { Shield, CheckCircle, AlertTriangle, Clock, Search, Filter, ChevronRight, Loader2, Archive, Image, FileText, RefreshCw, Eye } from "lucide-react"

const VERIFICATION_BADGES: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", icon: Clock },
  verified: { bg: "bg-green-50", text: "text-green-700", icon: CheckCircle },
  tampered: { bg: "bg-red-50", text: "text-red-700", icon: AlertTriangle },
}

const EVIDENCE_ICONS: Record<string, typeof Image> = {
  satellite: Image,
  report: FileText,
}

const ARCHIVE_ONBOARDING: OnboardingStep[] = [
  {
    title: "Browse Evidence",
    description: "This page lists all flagged satellite captures and citizen reports stored in the tamper-proof evidence archive. Each item has a SHA-256 hash for integrity verification.",
    icon: <Eye className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Filter & Search",
    description: "Use the type filter to view only satellite captures or citizen reports. The verification filter shows items that are pending, verified, or flagged as tampered.",
    icon: <Filter className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Verify Integrity",
    description: "Click any evidence item to view its full details and SHA-256 hash. Use the verify button to re-hash the source data and confirm nothing has been altered.",
    icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
  },
]

export default function ArchivePage() {
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [stats, setStats] = useState<ArchiveStats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchEvidenceArchive({ type: typeFilter, verification: verificationFilter, page }),
      fetchArchiveStats(),
    ]).then(([archiveData, archiveStats]) => {
      setItems(archiveData.items)
      setTotal(archiveData.total)
      setStats(archiveStats)
      setLoading(false)
    })
  }, [typeFilter, verificationFilter, page])

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingOverlay pageKey="archive" steps={ARCHIVE_ONBOARDING} />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Archive className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Evidence Archive</h1>
            <p className="text-sm text-gray-500">Tamper-proof chain of custody for election safety evidence</p>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Evidence</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Satellite</p>
              <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.satellite}</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Reports</p>
              <p className="text-xl font-bold text-purple-600 mt-0.5">{stats.report}</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Verified</p>
              <p className="text-xl font-bold text-green-600 mt-0.5">{stats.verified}</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-xl font-bold text-yellow-600 mt-0.5">{stats.pending}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="satellite">Satellite</option>
            <option value="report">Reports</option>
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => { setVerificationFilter(e.target.value); setPage(0) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="tampered">Tampered</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">{total} items</span>
        </div>

        {/* Evidence list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No evidence found</p>
            <p className="text-sm text-gray-400 mt-1">Flag satellite captures or incident reports to add them to the archive.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const badge = VERIFICATION_BADGES[item.verification_status]
              const BadgeIcon = badge.icon
              const TypeIcon = EVIDENCE_ICONS[item.evidence_type]

              return (
                <Link
                  key={item.id}
                  href={`/archive/${item.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.evidence_type === "satellite" ? "bg-blue-50" : "bg-purple-50"
                    }`}>
                      <TypeIcon className={`w-5 h-5 ${
                        item.evidence_type === "satellite" ? "text-blue-600" : "text-purple-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {item.evidence_type === "satellite" ? "Satellite Capture" : "Citizen Report"}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {item.verification_status}
                        </span>
                      </div>
                      {item.pu_name && (
                        <p className="text-xs text-gray-500 mb-1">
                          {item.pu_name} — {item.pu_state}
                        </p>
                      )}
                      {item.flag_reason && (
                        <p className="text-xs text-gray-400 truncate mb-1">{item.flag_reason}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="font-mono">{item.sha256_hash.slice(0, 16)}...</span>
                        <span>{new Date(item.created_at).toLocaleDateString("en-NG")}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(total / 20)}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * 20 >= total}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
